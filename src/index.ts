#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fetch from 'node-fetch';
import { createRequire } from 'module';
import { getConfig } from './config.js';

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

server.tool(
  'ocr_pdf_url',
  'Extract text from PDF via URL using Mistral OCR.',
  {
    pdf_url: z.string().url().describe('Public URL to PDF file'),
  },
  async ({ pdf_url }) => {
    try {
      const response = await fetch(`${MISTRAL_BASE_URL}/ocr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${MISTRAL_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'mistral-ocr-latest',
          document: {
            type: 'document_url',
            document_url: pdf_url,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          content: [
            {
              type: 'text',
              text: `API error: ${response.status} ${errorText}`,
            },
          ],
        };
      }

      const result = (await response.json()) as any;
      const text = result.pages.map((p: any) => p.markdown).join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: text,
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
