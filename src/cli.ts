#!/usr/bin/env node

import { getConfig, setConfig, getConfigPath } from './config.js';
import path from 'path';
import os from 'os';
import fs from 'fs';
import {
  uploadFileToMistral,
  getSignedUrlFromMistral,
  callOCRAPI,
  generateSpeech,
  transcribeAudio,
  validateDocumentType as _validateDocumentType,
  listVoices,
  listLanguages,
} from './tools/index.js';

const configDir = process.env.MISTRAL_AI_CONFIG_DIR || path.join(os.homedir(), '.mistral-ai');

async function runTTSVoices(configDir: string, args: string[]) {
  if (args.includes('--help')) {
    console.log('Usage: mistral-ai tts voices [--json]');
    console.log('Options:');
    console.log('  --json    Output as JSON');
    process.exit(0);
  }

  try {
    const { apiKey, baseUrl } = requireConfig(configDir);
    const voices = await listVoices(baseUrl, apiKey);
    const asJson = args.includes('--json');

    if (asJson) {
      console.log(JSON.stringify(voices, null, 2));
    } else {
      console.log('Available TTS voices:');
      for (const voice of voices) {
        console.log(`  ${voice.voice_id.padEnd(15)} ${voice.name || ''}`);
      }
    }
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

async function runSTTLanguages(args: string[]) {
  if (args.includes('--help')) {
    console.log('Usage: mistral-ai stt languages [--json]');
    console.log('Options:');
    console.log('  --json    Output as JSON');
    process.exit(0);
  }

  try {
    const languages = listLanguages();
    const asJson = args.includes('--json');

    if (asJson) {
      console.log(JSON.stringify(languages, null, 2));
    } else {
      console.log('Supported STT languages:');
      for (const lang of languages) {
        console.log(`  ${lang.code.padEnd(6)} ${lang.name}`);
      }
    }
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: mistral-ai <command> [args]');
    console.log('Commands:');
    console.log('  ocr <file-or-url> [--model MODEL] [--table-format markdown|html]');
    console.log('  tts <text> [--voice-id ID | --ref-audio FILE] [--format FORMAT]');
    console.log('  tts voices [--json]           List available TTS voices');
    console.log('  stt <audio> [--realtime] [--diarize] [--language LANG]');
    console.log('  stt languages                List supported STT languages');
    console.log('  config api_key <value>');
    console.log('  config base_url <value>');
    console.log('  config model <value>');
    console.log('  config show');
    process.exit(0);
  }

  const [command, subcommand, ...rest] = args;

  if (command === 'ocr') {
    await runOCR(configDir, subcommand, rest);
  } else if (command === 'tts') {
    if (subcommand === 'voices') {
      await runTTSVoices(configDir, rest);
    } else {
      await runTTS(configDir, subcommand, rest);
    }
  } else if (command === 'stt') {
    if (subcommand === 'languages') {
      await runSTTLanguages(rest);
    } else {
      await runSTT(configDir, subcommand, rest);
    }
  } else if (command === 'config') {
    if (subcommand === 'api_key' && rest.length > 0) {
      const value = rest.join(' ');
      setConfig(configDir, { api_key: value });
      console.log(`✓ API key set`);
    } else if (subcommand === 'base_url' && rest.length > 0) {
      const value = rest.join(' ');
      setConfig(configDir, { base_url: value });
      console.log(`✓ Base URL set`);
    } else if (subcommand === 'model' && rest.length > 0) {
      const value = rest.join(' ');
      setConfig(configDir, { model: value });
      console.log(`✓ Model set`);
    } else if (subcommand === 'show') {
      try {
        const config = getConfig(configDir);
        console.log('Current config:');
        console.log(`  api_key: ${config.api_key?.substring(0, 8)}...`);
        console.log(`  base_url: ${config.base_url}`);
        console.log(`  model: ${config.model || 'mistral-ocr-latest'}`);
        console.log(`  location: ${getConfigPath(configDir)}`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    } else {
      console.error('Invalid command');
      process.exit(1);
    }
  } else {
    console.error('Unknown command');
    process.exit(1);
  }
}

function requireConfig(configDir: string) {
  const config = getConfig(configDir);
  if (!config.api_key) {
    console.error('Error: MISTRAL_API_KEY required');
    process.exit(1);
  }
  const baseUrl = config.base_url || 'https://api.mistral.ai/v1';
  return { config, baseUrl, apiKey: config.api_key };
}

async function runTTS(configDir: string, text: string, args: string[]) {
  if (!text || text === '--help' || args.includes('--help')) {
    console.log(
      'Usage: mistral-ai tts <text> [--voice-id ID | --ref-audio FILE] [--format FORMAT]'
    );
    console.log('Options:');
    console.log('  --voice-id ID      Preset voice ID (e.g., "alice", "bob")');
    console.log('  --ref-audio FILE   Reference audio file for voice cloning');
    console.log('  --format FORMAT    Output format: mp3, wav, pcm, flac, opus (default: mp3)');
    process.exit(0);
  }

  try {
    const { apiKey, baseUrl } = requireConfig(configDir);
    const voiceIdIdx = args.indexOf('--voice-id');
    const refAudioIdx = args.indexOf('--ref-audio');
    const formatIdx = args.indexOf('--format');

    const voiceId = voiceIdIdx >= 0 ? args[voiceIdIdx + 1] : undefined;
    const refAudio = refAudioIdx >= 0 ? args[refAudioIdx + 1] : undefined;
    const format = (formatIdx >= 0 ? args[formatIdx + 1] : 'mp3') as any;

    if (!voiceId && !refAudio) {
      console.error('Error: Either --voice-id or --ref-audio required');
      process.exit(1);
    }

    const response = await generateSpeech(baseUrl, apiKey, text, voiceId, refAudio, format);
    console.log(response.audio_data);
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

async function runSTT(configDir: string, audioSource: string, args: string[]) {
  if (!audioSource || audioSource === '--help' || args.includes('--help')) {
    console.log('Usage: mistral-ai stt <audio-file-or-url> [options]');
    console.log('Options:');
    console.log('  --realtime         Use realtime model (<200ms latency)');
    console.log('  --diarize          Enable speaker diarization');
    console.log('  --language LANG    Language code (e.g., "en", "fr")');
    process.exit(0);
  }

  try {
    const { apiKey, baseUrl } = requireConfig(configDir);
    const realtime = args.includes('--realtime');
    const diarize = args.includes('--diarize');
    const langIdx = args.indexOf('--language');
    const language = langIdx >= 0 ? args[langIdx + 1] : undefined;

    const response = await transcribeAudio(
      baseUrl,
      apiKey,
      audioSource,
      realtime,
      diarize,
      language
    );
    console.log(response.text);
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

async function runOCR(configDir: string, pdfPath: string, args: string[]) {
  if (!pdfPath) {
    console.error('Error: PDF path required');
    process.exit(1);
  }

  try {
    const { config, apiKey, baseUrl } = requireConfig(configDir);
    const modelIdx = args.indexOf('--model');
    const tableFormatIdx = args.indexOf('--table-format');
    const cliModel = modelIdx >= 0 ? args[modelIdx + 1] : undefined;
    const tableFormat = tableFormatIdx >= 0 ? (args[tableFormatIdx + 1] as any) : undefined;
    const model = process.env.MISTRAL_MODEL || cliModel || config.model || 'mistral-ocr-latest';

    // Local file → upload → get signed URL
    let documentUrl = pdfPath;
    if (!pdfPath.startsWith('http://') && !pdfPath.startsWith('https://')) {
      const fileBuffer = fs.readFileSync(pdfPath);
      const fileName = path.basename(pdfPath);
      const fileId = await uploadFileToMistral(baseUrl, apiKey, fileBuffer, fileName);
      documentUrl = await getSignedUrlFromMistral(baseUrl, apiKey, fileId);
    }

    const response = await callOCRAPI(baseUrl, apiKey, documentUrl, model, tableFormat);

    const result = {
      text: response.pages.map((p: any) => p.markdown).join('\n\n'),
      pages: response.pages.length,
      model: response.model || 'mistral-ocr-latest',
    };

    const frontmatter = `---
model: ${result.model}
pages: ${result.pages}
---

${result.text}`;

    console.log(frontmatter);
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
