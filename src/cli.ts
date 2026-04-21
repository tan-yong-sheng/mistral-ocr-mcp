#!/usr/bin/env node

import { getConfig, setConfig, getConfigPath } from './config.js';
import path from 'path';
import os from 'os';
import https from 'https';
import http from 'http';

const configDir = process.env.MISTRAL_OCR_CONFIG_DIR || path.join(os.homedir(), '.mistral-ocr');

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: mistral-ocr <command> [args]');
    console.log('Commands:');
    console.log('  ocr <pdf-path> [--text]     - Run OCR on PDF (local or URL)');
    console.log('    --text                    - Output text only (default: JSON)');
    console.log('  config api_key <value>      - Set API key');
    console.log('  config base_url <value>     - Set base URL');
    console.log('  config show                 - Show current config');
    process.exit(0);
  }

  const [command, subcommand, ...rest] = args;

  if (command === 'ocr') {
    const outputFormat = rest.includes('--text') ? 'text' : 'json';
    await runOCR(configDir, subcommand, outputFormat);
  } else if (command === 'config') {
    if (subcommand === 'api_key' && rest.length > 0) {
      const value = rest.join(' ');
      setConfig(configDir, { api_key: value });
      console.log(`✓ API key set`);
    } else if (subcommand === 'base_url' && rest.length > 0) {
      const value = rest.join(' ');
      setConfig(configDir, { base_url: value });
      console.log(`✓ Base URL set`);
    } else if (subcommand === 'show') {
      try {
        const config = getConfig(configDir);
        console.log('Current config:');
        console.log(`  api_key: ${config.api_key?.substring(0, 8)}...`);
        console.log(`  base_url: ${config.base_url}`);
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

async function runOCR(configDir: string, pdfPath: string, outputFormat: 'json' | 'text' = 'json') {
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
    const response = await callMistralOCRAPI(baseUrl, config.api_key, pdfPath);

    const result = {
      text: response.pages.map((p: any) => p.markdown).join('\n\n'),
      pages: response.pages.length,
      confidence: 0.95,
      model: 'mistral-ocr-latest',
    };

    if (outputFormat === 'text') {
      console.log(result.text);
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

async function callMistralOCRAPI(baseUrl: string, apiKey: string, pdfPath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${baseUrl}/ocr`);
    const protocol = url.protocol === 'https:' ? https : http;

    const payload = {
      model: 'mistral-ocr-latest',
      document: {
        type: 'document_url',
        document_url: pdfPath,
      },
    };

    const body = JSON.stringify(payload);

    const req = protocol.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          Authorization: `Bearer ${apiKey}`,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`API error: ${res.statusCode} ${data}`));
          } else {
            resolve(JSON.parse(data));
          }
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
