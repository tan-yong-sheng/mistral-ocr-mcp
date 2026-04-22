#!/usr/bin/env node

import { getConfig, setConfig, getConfigPath } from './config.js';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { uploadFileToMistral, getSignedUrlFromMistral, callOCRAPI } from './tools/index.js';

const configDir = process.env.MISTRAL_AI_CONFIG_DIR || path.join(os.homedir(), '.mistral-ai');

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: mistral-ai <command> [args]');
    console.log('Commands:');
    console.log('  ocr <file-or-url> [--model MODEL] - Extract text from documents/images');
    console.log('  tts <text> [--voice-id ID]       - Generate speech from text');
    console.log('  stt <audio-file-or-url> [--realtime] - Transcribe audio to text');
    console.log('  config api_key <value>           - Set API key');
    console.log('  config base_url <value>          - Set base URL');
    console.log('  config model <value>           - Set default model');
    console.log('  config show                    - Show current config');
    process.exit(0);
  }

  const [command, subcommand, ...rest] = args;

  if (command === 'ocr') {
    const modelIdx = rest.indexOf('--model');
    const model = modelIdx >= 0 ? rest[modelIdx + 1] : undefined;
    await runOCR(configDir, subcommand, model);
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

async function runOCR(configDir: string, pdfPath: string, cliModel?: string) {
  if (!pdfPath) {
    console.error('Error: PDF path required');
    process.exit(1);
  }

  try {
    const config = getConfig(configDir);
    if (!config.api_key) {
      console.error('Error: MISTRAL_API_KEY required. Set via: mistral-ocr config api_key <key>');
      process.exit(1);
    }

    const baseUrl = config.base_url || 'https://api.mistral.ai/v1';
    const model = process.env.MISTRAL_MODEL || cliModel || config.model || 'mistral-ocr-latest';

    // Local file → upload → get signed URL
    let documentUrl = pdfPath;
    if (!pdfPath.startsWith('http://') && !pdfPath.startsWith('https://')) {
      const fileBuffer = fs.readFileSync(pdfPath);
      const fileName = path.basename(pdfPath);
      const fileId = await uploadFileToMistral(baseUrl, config.api_key, fileBuffer, fileName);
      documentUrl = await getSignedUrlFromMistral(baseUrl, config.api_key, fileId);
    }

    const response = await callOCRAPI(baseUrl, config.api_key, documentUrl, model);

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
