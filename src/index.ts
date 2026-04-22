#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { createRequire } from 'module';
import { getConfig } from './config.js';
import fs from 'fs';
import path from 'path';
import { uploadFileToMistral, getSignedUrlFromMistral, callOCRAPI } from './tools/index.js';

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

const server = new McpServer({
  name: 'Mistral OCR MCP',
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
  const fileId = await uploadFileToMistral(MISTRAL_BASE_URL, MISTRAL_API_KEY, fileBuffer, fileName);
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
