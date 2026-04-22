#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { createRequire } from 'module';
import { getConfig } from './config.js';
import fs from 'fs';
import path from 'path';
import {
  uploadFileToMistral,
  getSignedUrlFromMistral,
  callOCRAPI,
  generateSpeech,
  transcribeAudio,
  listVoices,
  listLanguages,
} from './tools/index.js';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

let MISTRAL_API_KEY: string;
let MISTRAL_BASE_URL: string;

try {
  const config = getConfig();
  MISTRAL_API_KEY = config.api_key!;
  MISTRAL_BASE_URL = config.base_url!;
} catch (err: any) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}

// Initialize voices before defining tools
async function init() {
  let cachedVoiceIds: string[] = [];

  try {
    const voices = await listVoices(MISTRAL_BASE_URL, MISTRAL_API_KEY);
    cachedVoiceIds = voices.map((v) => v.voice_id);
    console.error(`[MCP] Loaded ${cachedVoiceIds.length} voices`);
  } catch (err: any) {
    console.error(`[MCP] Voice fetch failed: ${err.message}. Continuing without voice list.`);
  }

  const languages = listLanguages();
  const languageCodes = languages.map((l) => l.code).join(', ');
  const voiceList = cachedVoiceIds.join(', ');

  const server = new McpServer({
    name: 'Mistral AI MCP',
    version: packageJson.version,
  });

  async function processSource(source: string): Promise<string> {
    // URL → use directly
    if (source.startsWith('http://') || source.startsWith('https://')) {
      return source;
    }

    // Local file → upload → get signed URL
    if (!fs.existsSync(source)) {
      throw new Error(`File not found: ${source}`);
    }

    const fileBuffer = fs.readFileSync(source);
    const fileName = path.basename(source);
    const fileId = await uploadFileToMistral(
      MISTRAL_BASE_URL,
      MISTRAL_API_KEY,
      fileBuffer,
      fileName
    );
    return getSignedUrlFromMistral(MISTRAL_BASE_URL, MISTRAL_API_KEY, fileId);
  }

  server.tool(
    'ocr_pdf',
    'Extract text from PDF files (local or URL) using Mistral OCR. Accepts multiple sources.',
    {
      sources: z.array(z.string()).describe('Array of PDF sources: local file paths or HTTPS URLs'),
    },
    async ({ sources }) => {
      try {
        if (!sources || sources.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: At least one source required',
              },
            ],
          };
        }

        const results: { source: string; text: string }[] = [];

        for (const source of sources) {
          try {
            const documentUrl = await processSource(source);
            const result = await callOCRAPI(
              MISTRAL_BASE_URL,
              MISTRAL_API_KEY,
              documentUrl,
              'mistral-ocr-latest'
            );
            const text = result.pages.map((p: any) => p.markdown).join('\n\n');
            results.push({ source, text });
          } catch (error: any) {
            results.push({ source, text: `Error: ${error.message}` });
          }
        }

        const output = results.map((r) => `# Source: ${r.source}\n\n${r.text}`).join('\n\n---\n\n');

        return {
          content: [
            {
              type: 'text',
              text: output,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    'tts_speech',
    `Generate speech from text using Voxtral TTS. Available voices: ${voiceList}. Supports voice cloning with reference audio.`,
    {
      text: z.string().describe('Text to convert to speech'),
      voice_id: z.string().optional().describe(`Preset voice ID. Available: ${voiceList}`),
      ref_audio_url: z
        .string()
        .optional()
        .describe('HTTPS URL to reference audio (5-25s) for voice cloning'),
      format: z
        .enum(['mp3', 'wav', 'pcm', 'flac', 'opus'])
        .optional()
        .describe('Output format (default: mp3)'),
    },
    async ({ text, voice_id, ref_audio_url, format }) => {
      try {
        if (!voice_id && !ref_audio_url) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: Either voice_id or ref_audio_url required',
              },
            ],
          };
        }

        // ref_audio_url must be HTTPS. MCP tools cannot download arbitrary URLs.
        if (ref_audio_url && !ref_audio_url.startsWith('https://')) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: ref_audio_url must be HTTPS URL',
              },
            ],
          };
        }

        const result = await generateSpeech(
          MISTRAL_BASE_URL,
          MISTRAL_API_KEY,
          text,
          voice_id,
          ref_audio_url,
          (format as any) || 'mp3'
        );

        // Save audio to temp file
        const audioBuffer = Buffer.from(result.audio_data, 'base64');
        const ext = (format as any) || 'mp3';
        const outputPath = `/tmp/speech_${Date.now()}.${ext}`;
        fs.writeFileSync(outputPath, audioBuffer);

        return {
          content: [
            {
              type: 'text',
              text: `Speech generated (${result.model}). Saved to: ${outputPath}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    'stt_transcribe',
    `Transcribe audio to text using Voxtral STT. Supported languages: ${languageCodes}`,
    {
      audio_source: z.string().describe('Audio file path or HTTPS URL'),
      diarize: z.boolean().optional().describe('Enable speaker diarization (batch mode only)'),
      language: z.string().optional().describe(`Language code. Supported: ${languageCodes}`),
      model: z.string().optional().describe('STT model. Default: voxtral-mini-latest'),
    },
    async ({ audio_source, diarize, language, model }) => {
      try {
        const result = await transcribeAudio(
          MISTRAL_BASE_URL,
          MISTRAL_API_KEY,
          audio_source,
          diarize || false,
          language,
          model
        );

        return {
          content: [
            {
              type: 'text',
              text: `Transcription (${result.model}):\n\n${result.text}\n\nLanguage: ${result.language || 'auto-detected'}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  const transport = new StdioServerTransport();

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });

  server.connect(transport);
}

init();
