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
  // Fetch voices at startup, cache for session
  let cachedVoiceIds: string[] = ['alice', 'bob', 'charlie'];

  try {
    const voices = await listVoices(MISTRAL_BASE_URL, MISTRAL_API_KEY);
    cachedVoiceIds = voices.map((v) => v.voice_id);
    console.error(`[MCP] Loaded ${cachedVoiceIds.length} voices`);
  } catch (err) {
    console.error(`[MCP] Failed to fetch voices, using defaults`);
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

        // If ref_audio_url, download to temp file
        let refAudioPath: string | undefined;
        if (ref_audio_url) {
          // Download logic here
          refAudioPath = '/tmp/ref_audio.wav'; // placeholder
        }

        const result = await generateSpeech(
          MISTRAL_BASE_URL,
          MISTRAL_API_KEY,
          text,
          voice_id,
          refAudioPath,
          (format as any) || 'mp3'
        );

        return {
          content: [
            {
              type: 'text',
              text: `Speech generated (${result.model}). Audio data (base64): ${result.audio_data.substring(0, 100)}...`,
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
      realtime: z
        .boolean()
        .optional()
        .describe('Use realtime model (<200ms latency) instead of batch'),
      diarize: z.boolean().optional().describe('Enable speaker diarization'),
      language: z.string().optional().describe(`Language code. Supported: ${languageCodes}`),
    },
    async ({ audio_source, realtime, diarize, language }) => {
      try {
        const result = await transcribeAudio(
          MISTRAL_BASE_URL,
          MISTRAL_API_KEY,
          audio_source,
          realtime || false,
          diarize || false,
          language
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
