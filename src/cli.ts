#!/usr/bin/env node

import { getConfig, setConfig, getConfigPath } from './config.js';
import path from 'path';
import os from 'os';

const configDir = process.env.MISTRAL_OCR_CONFIG_DIR || path.join(os.homedir(), '.mistral-ocr');

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: mistral-ocr config <command> [value]');
    console.log('Commands:');
    console.log('  api_key <value>  - Set API key');
    console.log('  base_url <value> - Set base URL');
    console.log('  show             - Show current config');
    process.exit(0);
  }

  const [command, subcommand, ...rest] = args;

  if (command === 'config') {
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

main().catch(err => {
  console.error(err);
  process.exit(1);
});