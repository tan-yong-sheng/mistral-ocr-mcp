import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getConfig, setConfig } from '../src/config';
import fs from 'fs';
import path from 'path';
import os from 'os';

const testConfigDir = path.join(os.tmpdir(), 'mistral-ocr-test');
const testConfigFile = path.join(testConfigDir, 'config.json');

describe('config', () => {
  beforeEach(() => {
    if (!fs.existsSync(testConfigDir)) {
      fs.mkdirSync(testConfigDir, { recursive: true });
    }
    // Clear env vars
    delete process.env.MISTRAL_API_KEY;
    delete process.env.MISTRAL_BASE_URL;
  });

  afterEach(() => {
    if (fs.existsSync(testConfigFile)) {
      fs.unlinkSync(testConfigFile);
    }
    if (fs.existsSync(testConfigDir)) {
      fs.rmdirSync(testConfigDir);
    }
  });

  it('reads api_key from env var', () => {
    process.env.MISTRAL_API_KEY = 'test-key-123';
    const config = getConfig(testConfigDir);
    expect(config.api_key).toBe('test-key-123');
  });

  it('reads base_url from env var', () => {
    process.env.MISTRAL_BASE_URL = 'https://custom.api.com/v1';
    const config = getConfig(testConfigDir);
    expect(config.base_url).toBe('https://custom.api.com/v1');
  });

  it('defaults base_url to mistral api', () => {
    process.env.MISTRAL_API_KEY = 'test-key';
    const config = getConfig(testConfigDir);
    expect(config.base_url).toBe('https://api.mistral.ai/v1');
  });

  it('reads from config file if env var missing', () => {
    fs.writeFileSync(testConfigFile, JSON.stringify({ api_key: 'file-key', base_url: 'https://file.api.com/v1' }));
    const config = getConfig(testConfigDir);
    expect(config.api_key).toBe('file-key');
    expect(config.base_url).toBe('https://file.api.com/v1');
  });

  it('env var overrides config file', () => {
    fs.writeFileSync(testConfigFile, JSON.stringify({ api_key: 'file-key', base_url: 'https://file.api.com/v1' }));
    process.env.MISTRAL_API_KEY = 'env-key';
    const config = getConfig(testConfigDir);
    expect(config.api_key).toBe('env-key');
    expect(config.base_url).toBe('https://file.api.com/v1');
  });

  it('writes config to file', () => {
    setConfig(testConfigDir, { api_key: 'new-key', base_url: 'https://new.api.com/v1' });
    const content = JSON.parse(fs.readFileSync(testConfigFile, 'utf-8'));
    expect(content.api_key).toBe('new-key');
    expect(content.base_url).toBe('https://new.api.com/v1');
  });

  it('throws if api_key missing', () => {
    expect(() => getConfig(testConfigDir)).toThrow('MISTRAL_API_KEY');
  });
});