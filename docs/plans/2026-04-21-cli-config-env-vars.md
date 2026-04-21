# CLI + Environment Variables Implementation Plan

> **REQUIRED SUB-SKILL:** Use the executing-plans skill to implement this plan task-by-task.

**Goal:** Add CLI tool for config management + expose `MISTRAL_BASE_URL` env var for MCP server.

**Architecture:** Shared config module (`src/config.ts`) reads from env vars (override) → `~/.mistral-ocr/config.json` (fallback). CLI (`src/cli.ts`) manages config file. MCP server (`src/index.ts`) uses config module. Both bin entries in `package.json`.

**Tech Stack:** TypeScript, Node.js, zod for validation, fs for file I/O.

---

### Task 1: Create config module

**Files:**
- Create: `src/config.ts`

**Step 1: Write failing test**

```typescript
// tests/config.test.ts
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
    fs.writeFileSync(testConfigFile, JSON.stringify({
      api_key: 'file-key',
      base_url: 'https://file.api.com/v1'
    }));
    const config = getConfig(testConfigDir);
    expect(config.api_key).toBe('file-key');
    expect(config.base_url).toBe('https://file.api.com/v1');
  });

  it('env var overrides config file', () => {
    fs.writeFileSync(testConfigFile, JSON.stringify({
      api_key: 'file-key',
      base_url: 'https://file.api.com/v1'
    }));
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
```

**Step 2: Run test to verify fail**

```bash
npm test -- tests/config.test.ts
```

Expected: FAIL - `getConfig` not defined.

**Step 3: Write minimal implementation**

```typescript
// src/config.ts
import fs from 'fs';
import path from 'path';
import os from 'os';
import { z } from 'zod';

const ConfigSchema = z.object({
  api_key: z.string().min(1, 'api_key required'),
  base_url: z.string().url().default('https://api.mistral.ai/v1')
});

export type Config = z.infer<typeof ConfigSchema>;

const DEFAULT_CONFIG_DIR = path.join(os.homedir(), '.mistral-ocr');
const CONFIG_FILE = 'config.json';

export function getConfig(configDir: string = DEFAULT_CONFIG_DIR): Config {
  // 1. Check env vars first
  const envApiKey = process.env.MISTRAL_API_KEY;
  const envBaseUrl = process.env.MISTRAL_BASE_URL;

  if (envApiKey) {
    return ConfigSchema.parse({
      api_key: envApiKey,
      base_url: envBaseUrl || 'https://api.mistral.ai/v1'
    });
  }

  // 2. Check config file
  const configPath = path.join(configDir, CONFIG_FILE);
  if (fs.existsSync(configPath)) {
    const fileContent = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return ConfigSchema.parse(fileContent);
  }

  // 3. Fail if nothing found
  throw new Error('MISTRAL_API_KEY environment variable or config file required');
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
```

**Step 4: Run test to verify pass**

```bash
npm test -- tests/config.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/config.ts tests/config.test.ts
git commit -m "feat: add config module with env var + file support"
```

---

### Task 2: Create CLI tool

**Files:**
- Create: `src/cli.ts`

**Step 1: Write failing test**

```typescript
// tests/cli.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const testConfigDir = path.join(os.tmpdir(), 'mistral-ocr-cli-test');
const testConfigFile = path.join(testConfigDir, 'config.json');

describe('cli', () => {
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
      env: { ...process.env, MISTRAL_OCR_CONFIG_DIR: testConfigDir }
    });
    const config = JSON.parse(fs.readFileSync(testConfigFile, 'utf-8'));
    expect(config.api_key).toBe('test-key-123');
  });

  it('sets base_url', () => {
    execSync(`tsx src/cli.ts config base_url https://custom.api.com/v1`, {
      env: { ...process.env, MISTRAL_OCR_CONFIG_DIR: testConfigDir }
    });
    const config = JSON.parse(fs.readFileSync(testConfigFile, 'utf-8'));
    expect(config.base_url).toBe('https://custom.api.com/v1');
  });

  it('shows config', () => {
    fs.writeFileSync(testConfigFile, JSON.stringify({
      api_key: 'test-key',
      base_url: 'https://test.api.com/v1'
    }));
    const output = execSync(`tsx src/cli.ts config show`, {
      env: { ...process.env, MISTRAL_OCR_CONFIG_DIR: testConfigDir },
      encoding: 'utf-8'
    });
    expect(output).toContain('api_key');
    expect(output).toContain('test-key');
  });
});
```

**Step 2: Run test to verify fail**

```bash
npm test -- tests/cli.test.ts
```

Expected: FAIL - `src/cli.ts` not found.

**Step 3: Write minimal implementation**

```typescript
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
        console.log(`  api_key: ${config.api_key.substring(0, 8)}...`);
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
```

**Step 4: Run test to verify pass**

```bash
npm test -- tests/cli.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/cli.ts tests/cli.test.ts
git commit -m "feat: add CLI tool for config management"
```

---

### Task 3: Update MCP server to use config module

**Files:**
- Modify: `src/index.ts`

**Step 1: Update imports + config loading**

Replace:
```typescript
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

if (!MISTRAL_API_KEY || MISTRAL_API_KEY === "YOUR_MISTRAL_API_KEY") {
  console.error("Error: MISTRAL_API_KEY environment variable is required");
  process.exit(1);
}
```

With:
```typescript
import { getConfig } from './config.js';

let MISTRAL_API_KEY: string;
let MISTRAL_BASE_URL: string;

try {
  const config = getConfig();
  MISTRAL_API_KEY = config.api_key;
  MISTRAL_BASE_URL = config.base_url;
} catch (err: any) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
```

**Step 2: Replace hardcoded URLs**

Replace all `https://api.mistral.ai/v1` with `MISTRAL_BASE_URL`:

```typescript
// In ocr_for_local_pdf tool:
const uploadResponse = await fetch(`${MISTRAL_BASE_URL}/files`, {

// In ocr_for_local_pdf tool (signed URL):
const urlResponse = await fetch(`${MISTRAL_BASE_URL}/files/${fileId}/url?expiry=24`, {

// In ocr_for_local_pdf tool (OCR endpoint):
const ocrResponse = await fetch(`${MISTRAL_BASE_URL}/ocr`, {

// In ocr_for_pdf_url tool:
const response = await fetch(`${MISTRAL_BASE_URL}/ocr`, {
```

**Step 3: Run MCP server to verify**

```bash
npm run build
MISTRAL_API_KEY=test-key npm start
```

Expected: Server starts without errors, listens on stdio.

**Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: use config module + MISTRAL_BASE_URL env var in MCP server"
```

---

### Task 4: Update package.json bin entries

**Files:**
- Modify: `package.json`

**Step 1: Add CLI bin entry**

Replace:
```json
"bin": {
  "mistral-ocr-mcp": "dist/index.js"
}
```

With:
```json
"bin": {
  "mistral-ocr-mcp": "dist/index.js",
  "mistral-ocr": "dist/cli.js"
}
```

**Step 2: Update build postbuild to chmod both**

Replace:
```json
"postbuild": "chmod +x dist/index.js 2>/dev/null || true"
```

With:
```json
"postbuild": "chmod +x dist/index.js dist/cli.js 2>/dev/null || true"
```

**Step 3: Build + verify**

```bash
npm run build
ls -la dist/
```

Expected: Both `dist/index.js` and `dist/cli.js` exist + executable.

**Step 4: Commit**

```bash
git add package.json
git commit -m "feat: add mistral-ocr CLI bin entry"
```

---

### Task 5: Create CLI skills

**Files:**
- Create: `skills/cli-setup/SKILL.md`
- Create: `skills/cli-config/SKILL.md`

**Step 1: Create cli-setup skill**

```markdown
# CLI Setup

## Overview

Initialize Mistral OCR CLI configuration for first-time use.

## Quick Start

```bash
npm install -g mistral-ocr-mcp
mistral-ocr config api_key YOUR_API_KEY
mistral-ocr config base_url https://api.mistral.ai/v1  # optional
mistral-ocr config show
```

## Configuration

Config stored in `~/.mistral-ocr/config.json`. Environment variables override file settings.

**Env vars:**
- `MISTRAL_API_KEY` - API key (required)
- `MISTRAL_BASE_URL` - Base URL (optional, defaults to `https://api.mistral.ai/v1`)

## Troubleshooting

**"MISTRAL_API_KEY required"**
- Set via CLI: `mistral-ocr config api_key <key>`
- Or env var: `export MISTRAL_API_KEY=<key>`

**Custom API endpoint**
- `mistral-ocr config base_url https://custom.api.com/v1`
```

**Step 2: Create cli-config skill**

```markdown
# CLI Config Management

## Overview

Manage Mistral OCR configuration via CLI commands.

## Commands

### Set API Key

```bash
mistral-ocr config api_key YOUR_API_KEY
```

Stores in `~/.mistral-ocr/config.json`.

### Set Base URL

```bash
mistral-ocr config base_url https://custom.api.com/v1
```

Defaults to `https://api.mistral.ai/v1` if not set.

### Show Current Config

```bash
mistral-ocr config show
```

Displays current settings + config file location.

## Priority

1. Environment variables (highest)
2. Config file
3. Defaults (base_url only)

## Examples

```bash
# Set both
mistral-ocr config api_key sk-...
mistral-ocr config base_url https://api.mistral.ai/v1

# View
mistral-ocr config show

# Override with env var
export MISTRAL_API_KEY=sk-override
mistral-ocr config show  # Shows env var value
```
```

**Step 3: Commit**

```bash
git add skills/
git commit -m "docs: add CLI setup + config management skills"
```

---

### Task 6: Run all tests + verify build

**Files:**
- No changes

**Step 1: Run all tests**

```bash
npm test
```

Expected: All tests pass.

**Step 2: Build**

```bash
npm run build
```

Expected: No errors, `dist/` contains both `index.js` + `cli.js`.

**Step 3: Verify CLI works**

```bash
export MISTRAL_OCR_CONFIG_DIR=/tmp/test-mistral-ocr
node dist/cli.js config api_key test-key-123
node dist/cli.js config show
```

Expected: Config set + displayed correctly.

**Step 4: Verify MCP server works**

```bash
export MISTRAL_API_KEY=test-key
npm start
```

Expected: Server starts, listens on stdio.

**Step 5: Commit**

```bash
git add -A
git commit -m "test: verify all tests pass + builds work"
```

---

Plan complete and saved to `docs/plans/2026-04-21-cli-config-env-vars.md`. Two execution options:

**1. Subagent-Driven (this session)** - Fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?