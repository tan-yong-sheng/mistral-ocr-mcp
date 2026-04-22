import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const testConfigDir = path.join(os.tmpdir(), 'mistral-ai-cli-test');
const testConfigFile = path.join(testConfigDir, 'config.json');

describe('CLI', () => {
  beforeEach(() => {
    if (!fs.existsSync(testConfigDir)) {
      fs.mkdirSync(testConfigDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testConfigFile)) {
      fs.unlinkSync(testConfigFile);
    }
    if (fs.existsSync(testConfigDir)) {
      fs.rmdirSync(testConfigDir);
    }
  });

  it('sets api_key', () => {
    execSync(`tsx src/cli.ts config api_key test-key-123`, {
      env: { ...process.env, MISTRAL_AI_CONFIG_DIR: testConfigDir },
    });
    const config = JSON.parse(fs.readFileSync(testConfigFile, 'utf-8'));
    expect(config.api_key).toBe('test-key-123');
  });

  it('sets base_url', () => {
    execSync(`tsx src/cli.ts config base_url https://custom.api.com/v1`, {
      env: { ...process.env, MISTRAL_AI_CONFIG_DIR: testConfigDir },
    });
    const config = JSON.parse(fs.readFileSync(testConfigFile, 'utf-8'));
    expect(config.base_url).toBe('https://custom.api.com/v1');
  });

  it('shows config', () => {
    fs.writeFileSync(
      testConfigFile,
      JSON.stringify({
        api_key: 'test-key',
        base_url: 'https://test.api.com/v1',
      })
    );
    const output = execSync(`tsx src/cli.ts config show`, {
      env: { ...process.env, MISTRAL_AI_CONFIG_DIR: testConfigDir },
      encoding: 'utf-8',
    });
    expect(output).toContain('api_key');
    expect(output).toContain('test-key');
  });

  it('shows help with ocr command', () => {
    const output = execSync(`tsx src/cli.ts`, {
      env: { ...process.env, MISTRAL_AI_CONFIG_DIR: testConfigDir },
      encoding: 'utf-8',
    });
    expect(output).toContain('ocr');
  });

  it('shows help with tts command', () => {
    const output = execSync(`tsx src/cli.ts`, {
      env: { ...process.env, MISTRAL_AI_CONFIG_DIR: testConfigDir },
      encoding: 'utf-8',
    });
    expect(output).toContain('tts');
  });

  it('shows help with stt command', () => {
    const output = execSync(`tsx src/cli.ts`, {
      env: { ...process.env, MISTRAL_AI_CONFIG_DIR: testConfigDir },
      encoding: 'utf-8',
    });
    expect(output).toContain('stt');
  });
});
