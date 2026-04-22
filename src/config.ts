import fs from 'fs';
import path from 'path';
import os from 'os';
import { z } from 'zod';

const ConfigSchema = z.object({
  api_key: z.string().min(1, 'api_key required').optional(),
  base_url: z.string().url().default('https://api.mistral.ai/v1'),
  model: z.string().optional(),
  stt_model: z.string().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

const DEFAULT_CONFIG_DIR = path.join(os.homedir(), '.mistral-ai');
const CONFIG_FILE = 'config.json';

export function getConfig(configDir: string = DEFAULT_CONFIG_DIR): Config {
  // 1. Read config file first
  const configPath = path.join(configDir, CONFIG_FILE);
  const fileConfig = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    : {};

  // 2. Merge with env vars (env overrides file)
  const merged = {
    ...fileConfig,
    ...(process.env.MISTRAL_API_KEY && { api_key: process.env.MISTRAL_API_KEY }),
    ...(process.env.MISTRAL_BASE_URL && { base_url: process.env.MISTRAL_BASE_URL }),
    ...(process.env.MISTRAL_MODEL && { model: process.env.MISTRAL_MODEL }),
  };

  // 3. Validate and return
  const validated = ConfigSchema.parse(merged);

  // 4. Check if api_key present - throw only if nothing provided
  const hasApiKey = !!process.env.MISTRAL_API_KEY || !!validated.api_key;
  const hasBaseUrl = !!process.env.MISTRAL_BASE_URL || !!merged.base_url;

  if (!hasApiKey && !hasBaseUrl) {
    throw new Error('MISTRAL_API_KEY environment variable or config file required');
  }

  return validated;
}

export function setConfig(configDir: string = DEFAULT_CONFIG_DIR, config: Partial<Config>): void {
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const configPath = path.join(configDir, CONFIG_FILE);
  const existing = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    : {};

  const updated = { ...existing, ...config };
  ConfigSchema.parse(updated); // Validate before write

  fs.writeFileSync(configPath, JSON.stringify(updated, null, 2));
}

export function getConfigPath(configDir: string = DEFAULT_CONFIG_DIR): string {
  return path.join(configDir, CONFIG_FILE);
}
