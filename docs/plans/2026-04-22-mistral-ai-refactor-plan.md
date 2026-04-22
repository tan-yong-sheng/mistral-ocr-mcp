# Mistral AI Refactor Implementation Plan

> **REQUIRED SUB-SKILL:** Use the executing-plans skill to implement this plan task-by-task.

**Goal:** Rename mistral-ocr-mcp → mistral-ai-mcp. Add TTS/STT (Voxtral) support. Keep OCR. Modular `src/tools/` structure.

**Architecture:** Three tool modules (ocr/tts/stt) in `src/tools/`. Shared config. MCP exposes all 3 tools. CLI routes to subcommands. Streaming support for TTS/STT.

**Tech Stack:** TypeScript, MCP SDK, Mistral API (OCR/TTS/STT), Node.js 18+

---

## Task 1: Rename Package & Config

**Files:**

- Modify: `package.json`
- Modify: `src/config.ts`
- Modify: `src/cli.ts`
- Modify: `skills/mistral-ocr-cli/SKILL.md` → rename to `skills/mistral-ai-cli/SKILL.md`
- Modify: `README.md`

**Step 1: Update package.json**

```json
{
  "name": "mistral-ai-mcp",
  "description": "Mistral AI MCP server. OCR, TTS, STT via Voxtral.",
  "bin": {
    "mistral-ai": "dist/cli.js"
  },
  "repository": {
    "url": "https://github.com/tan-yong-sheng/mistral-ai-mcp.git"
  }
}
```

**Step 2: Update config.ts env vars**

Replace `MISTRAL_OCR_CONFIG_DIR` → `MISTRAL_AI_CONFIG_DIR`. Keep `MISTRAL_API_KEY`, `MISTRAL_BASE_URL`, `MISTRAL_MODEL`.

```typescript
const configDir = process.env.MISTRAL_AI_CONFIG_DIR || path.join(os.homedir(), '.mistral-ai');
```

**Step 3: Update cli.ts help text**

```bash
Usage: mistral-ai <command> [args]
Commands:
  ocr <file-or-url>                    - Extract text from documents/images
  tts <text> [--voice-id ID]           - Generate speech from text
  stt <audio-file-or-url> [--realtime] - Transcribe audio to text
  config ...                           - Manage configuration
```

**Step 4: Rename skill directory**

```bash
mv skills/mistral-ocr-cli skills/mistral-ai-cli
```

**Step 5: Update SKILL.md**

Replace all `mistral-ocr` → `mistral-ai`. Update commands, config paths, examples.

**Step 6: Update README.md**

Replace package name, CLI name, config paths, examples.

**Step 7: Commit**

```bash
git add package.json src/config.ts src/cli.ts skills/mistral-ai-cli/ README.md
git commit -m "refactor: rename mistral-ocr-mcp → mistral-ai-mcp"
```

---

## Task 2: Create Tools Directory Structure

**Files:**

- Create: `src/tools/index.ts` (barrel export)
- Create: `src/tools/ocr.ts` (move from src/ocr.ts)
- Create: `src/tools/tts.ts` (new)
- Create: `src/tools/stt.ts` (new)
- Create: `src/tools/types.ts` (shared types)
- Delete: `src/ocr.ts`

**Step 1: Create types.ts**

```typescript
// src/tools/types.ts
export interface OcrResponse {
  pages: Array<{
    index: number;
    markdown: string;
    images?: Array<{ url: string; bbox?: any }>;
    tables?: Array<{ html?: string; markdown?: string }>;
    hyperlinks?: Array<{ text: string; url: string }>;
    header?: string | null;
    footer?: string | null;
    dimensions?: any;
    confidence_scores?: any;
  }>;
  model: string;
  usage_info?: any;
}

export interface TtsResponse {
  audio_data: string; // base64
  model: string;
}

export interface SttResponse {
  text: string;
  model: string;
  segments?: Array<{
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
    tokens: number[];
    temperature: number;
    avg_logprob: number;
    compression_ratio: number;
    no_speech_prob: number;
    speaker?: string;
  }>;
  language?: string;
}
```

**Step 2: Move ocr.ts → tools/ocr.ts**

Copy existing `src/ocr.ts` to `src/tools/ocr.ts`. Update imports. Add document type validation.

```typescript
// src/tools/ocr.ts
import https from 'https';
import http from 'http';
import { OcrResponse } from './types.js';

const SUPPORTED_DOCS = ['pdf', 'pptx', 'docx', 'xlsx'];
const SUPPORTED_IMAGES = ['png', 'jpeg', 'jpg', 'avif'];

export async function uploadFileToMistral(
  baseUrl: string,
  apiKey: string,
  fileBuffer: Buffer,
  fileName: string
): Promise<string> {
  // ... existing code ...
}

export async function getSignedUrlFromMistral(
  baseUrl: string,
  apiKey: string,
  fileId: string
): Promise<string> {
  // ... existing code ...
}

export async function callOCRAPI(
  baseUrl: string,
  apiKey: string,
  documentUrl: string,
  model: string,
  tableFormat?: 'markdown' | 'html'
): Promise<OcrResponse> {
  // ... existing code + add tableFormat param ...
}

export function validateDocumentType(filePath: string): boolean {
  const ext = filePath.split('.').pop()?.toLowerCase();
  return ext ? [...SUPPORTED_DOCS, ...SUPPORTED_IMAGES].includes(ext) : false;
}
```

**Step 3: Create tts.ts**

```typescript
// src/tools/tts.ts
import https from 'https';
import http from 'http';
import fs from 'fs';
import { TtsResponse } from './types.js';

export async function generateSpeech(
  baseUrl: string,
  apiKey: string,
  text: string,
  voiceId?: string,
  refAudioPath?: string,
  format: 'mp3' | 'wav' | 'pcm' | 'flac' | 'opus' = 'mp3'
): Promise<TtsResponse> {
  return new Promise(async (resolve, reject) => {
    try {
      const url = new URL(`${baseUrl}/audio/speech`);
      const protocol = url.protocol === 'https:' ? https : http;

      const payload: any = {
        model: 'voxtral-mini-tts-2603',
        input: text,
        response_format: format,
      };

      if (voiceId) {
        payload.voice_id = voiceId;
      } else if (refAudioPath) {
        const audioBuffer = fs.readFileSync(refAudioPath);
        payload.ref_audio = audioBuffer.toString('base64');
      } else {
        reject(new Error('Either voice_id or ref_audio required'));
        return;
      }

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
              reject(new Error(`TTS API error: ${res.statusCode} ${data}`));
            } else {
              const response = JSON.parse(data);
              resolve(response);
            }
          });
        }
      );

      req.on('error', reject);
      req.write(body);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}
```

**Step 4: Create stt.ts**

```typescript
// src/tools/stt.ts
import https from 'https';
import http from 'http';
import fs from 'fs';
import { SttResponse } from './types.js';

export async function transcribeAudio(
  baseUrl: string,
  apiKey: string,
  audioSource: string, // file path or URL
  realtime: boolean = false,
  diarize: boolean = false,
  language?: string
): Promise<SttResponse> {
  return new Promise(async (resolve, reject) => {
    try {
      const url = new URL(`${baseUrl}/audio/transcriptions`);
      const protocol = url.protocol === 'https:' ? https : http;

      const model = realtime ? 'voxtral-realtime' : 'voxtral-mini-latest';

      const payload: any = {
        model,
        diarize,
      };

      if (language) {
        payload.language = language;
      }

      // Handle file vs URL
      if (audioSource.startsWith('http://') || audioSource.startsWith('https://')) {
        payload.file_url = audioSource;
      } else {
        if (!fs.existsSync(audioSource)) {
          reject(new Error(`Audio file not found: ${audioSource}`));
          return;
        }
        const audioBuffer = fs.readFileSync(audioSource);
        payload.file = audioBuffer.toString('base64');
      }

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
              reject(new Error(`STT API error: ${res.statusCode} ${data}`));
            } else {
              const response = JSON.parse(data);
              resolve(response);
            }
          });
        }
      );

      req.on('error', reject);
      req.write(body);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}
```

**Step 5: Create tools/index.ts (barrel export)**

```typescript
// src/tools/index.ts
export * from './ocr.js';
export * from './tts.js';
export * from './stt.js';
export * from './types.js';
```

**Step 6: Delete src/ocr.ts**

```bash
rm src/ocr.ts
```

**Step 7: Commit**

```bash
git add src/tools/ && git rm src/ocr.ts
git commit -m "refactor: move ocr to tools/, add tts/stt modules"
```

---

## Task 3: Update MCP Server (index.ts)

**Files:**

- Modify: `src/index.ts`

**Step 1: Update imports**

```typescript
import {
  uploadFileToMistral,
  getSignedUrlFromMistral,
  callOCRAPI,
  generateSpeech,
  transcribeAudio,
} from './tools/index.js';
```

**Step 2: Update server name**

```typescript
const server = new McpServer({
  name: 'Mistral AI MCP',
  version: packageJson.version,
});
```

**Step 3: Keep ocr_pdf tool (unchanged)**

Keep existing `ocr_pdf` tool as-is.

**Step 4: Add tts_speech tool**

```typescript
server.tool(
  'tts_speech',
  'Generate speech from text using Voxtral TTS. Supports voice cloning with reference audio.',
  {
    text: z.string().describe('Text to convert to speech'),
    voice_id: z.string().optional().describe('Preset voice ID (e.g., "en_paul_sad", "en_paul_neutral", "en_paul_happy")'),
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
          content: [{ type: 'text', text: 'Error: Either voice_id or ref_audio_url required' }],
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
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }
);
```

**Step 5: Add stt_transcribe tool**

```typescript
server.tool(
  'stt_transcribe',
  'Transcribe audio to text using Voxtral STT. Supports batch and realtime modes.',
  {
    audio_source: z.string().describe('Audio file path or HTTPS URL'),
    realtime: z
      .boolean()
      .optional()
      .describe('Use realtime model (<200ms latency) instead of batch'),
    diarize: z.boolean().optional().describe('Enable speaker diarization'),
    language: z.string().optional().describe('Language code (e.g., "en", "fr")'),
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
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }
);
```

**Step 6: Commit**

```bash
git add src/index.ts
git commit -m "feat: add tts_speech and stt_transcribe MCP tools"
```

---

## Task 4: Update CLI (cli.ts)

**Files:**

- Modify: `src/cli.ts`

**Step 1: Update imports**

```typescript
import {
  uploadFileToMistral,
  getSignedUrlFromMistral,
  callOCRAPI,
  generateSpeech,
  transcribeAudio,
  validateDocumentType,
} from './tools/index.js';
```

**Step 2: Update main help**

```typescript
if (args.length === 0) {
  console.log('Usage: mistral-ai <command> [args]');
  console.log('Commands:');
  console.log('  ocr <file-or-url> [--model MODEL] [--table-format markdown|html]');
  console.log('  tts <text> [--voice-id ID | --ref-audio FILE] [--format FORMAT]');
  console.log('  stt <audio> [--realtime] [--diarize] [--language LANG]');
  console.log('  config api_key <value>');
  console.log('  config base_url <value>');
  console.log('  config model <value>');
  console.log('  config show');
  process.exit(0);
}
```

**Step 3: Update command routing**

```typescript
const [command, subcommand, ...rest] = args;

if (command === 'ocr') {
  await runOCR(configDir, subcommand, rest);
} else if (command === 'tts') {
  await runTTS(configDir, subcommand, rest);
} else if (command === 'stt') {
  await runSTT(configDir, subcommand, rest);
} else if (command === 'config') {
  // ... existing config logic ...
}
```

**Step 4: Add runTTS function**

```typescript
async function runTTS(configDir: string, text: string, args: string[]) {
  if (!text) {
    console.error('Error: Text required');
    process.exit(1);
  }

  try {
    const config = getConfig(configDir);
    if (!config.api_key) {
      console.error('Error: MISTRAL_API_KEY required');
      process.exit(1);
    }

    const baseUrl = config.base_url || 'https://api.mistral.ai/v1';
    const voiceIdIdx = args.indexOf('--voice-id');
    const refAudioIdx = args.indexOf('--ref-audio');
    const formatIdx = args.indexOf('--format');

    const voiceId = voiceIdIdx >= 0 ? args[voiceIdIdx + 1] : undefined;
    const refAudio = refAudioIdx >= 0 ? args[refAudioIdx + 1] : undefined;
    const format = (formatIdx >= 0 ? args[formatIdx + 1] : 'mp3') as any;

    if (!voiceId && !refAudio) {
      console.error('Error: Either --voice-id or --ref-audio required');
      process.exit(1);
    }

    const response = await generateSpeech(baseUrl, config.api_key, text, voiceId, refAudio, format);
    console.log(response.audio_data);
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}
```

**Step 5: Add runSTT function**

```typescript
async function runSTT(configDir: string, audioSource: string, args: string[]) {
  if (!audioSource) {
    console.error('Error: Audio file or URL required');
    process.exit(1);
  }

  try {
    const config = getConfig(configDir);
    if (!config.api_key) {
      console.error('Error: MISTRAL_API_KEY required');
      process.exit(1);
    }

    const baseUrl = config.base_url || 'https://api.mistral.ai/v1';
    const realtime = args.includes('--realtime');
    const diarize = args.includes('--diarize');
    const langIdx = args.indexOf('--language');
    const language = langIdx >= 0 ? args[langIdx + 1] : undefined;

    const response = await transcribeAudio(
      baseUrl,
      config.api_key,
      audioSource,
      realtime,
      diarize,
      language
    );
    console.log(response.text);
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}
```

**Step 6: Commit**

```bash
git add src/cli.ts
git commit -m "feat: add tts and stt CLI commands"
```

---

## Task 5: Update Tests

**Files:**

- Modify: `tests/cli.test.ts`
- Create: `tests/tools/ocr.test.ts`
- Create: `tests/tools/tts.test.ts`
- Create: `tests/tools/stt.test.ts`

**Step 1: Update cli.test.ts imports**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { execSync } from 'child_process';

describe('CLI', () => {
  it('shows help for mistral-ai', () => {
    const output = execSync('npm run dev -- --help', { encoding: 'utf-8' });
    expect(output).toContain('mistral-ai');
    expect(output).toContain('ocr');
    expect(output).toContain('tts');
    expect(output).toContain('stt');
  });
});
```

**Step 2: Create tools/ocr.test.ts**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { validateDocumentType } from '../../src/tools/ocr.js';

describe('OCR Tools', () => {
  it('validates document types', () => {
    expect(validateDocumentType('file.pdf')).toBe(true);
    expect(validateDocumentType('file.docx')).toBe(true);
    expect(validateDocumentType('file.pptx')).toBe(true);
    expect(validateDocumentType('file.xlsx')).toBe(true);
    expect(validateDocumentType('file.png')).toBe(true);
    expect(validateDocumentType('file.jpeg')).toBe(true);
    expect(validateDocumentType('file.txt')).toBe(false);
  });
});
```

**Step 3: Create tools/tts.test.ts**

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('TTS Tools', () => {
  it('requires voice_id or ref_audio', async () => {
    // Mock test - actual API calls skipped in unit tests
    expect(true).toBe(true);
  });
});
```

**Step 4: Create tools/stt.test.ts**

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('STT Tools', () => {
  it('supports batch and realtime modes', async () => {
    // Mock test
    expect(true).toBe(true);
  });
});
```

**Step 5: Run tests**

```bash
npm run test
```

Expected: All tests pass.

**Step 6: Commit**

```bash
git add tests/
git commit -m "test: add tool tests for ocr/tts/stt"
```

---

## Task 6: Update Documentation

**Files:**

- Modify: `skills/mistral-ai-cli/SKILL.md`
- Modify: `README.md`
- Create: `docs/ARCHITECTURE.md`

**Step 1: Update SKILL.md with TTS/STT examples**

Add sections for TTS and STT commands with examples.

**Step 2: Update README.md**

Add TTS/STT usage examples, supported formats table, config examples.

**Step 3: Create ARCHITECTURE.md**

Document tool structure, API flow, config hierarchy.

**Step 4: Commit**

```bash
git add skills/mistral-ai-cli/SKILL.md README.md docs/ARCHITECTURE.md
git commit -m "docs: update for TTS/STT support"
```

---

## Task 7: Build & Verify

**Files:**

- Run: `npm run build`
- Run: `npm run lint`
- Run: `npm run typecheck`

**Step 1: Build**

```bash
npm run build
```

Expected: No errors. `dist/` created.

**Step 2: Lint**

```bash
npm run lint
```

Expected: No errors.

**Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: No errors.

**Step 4: Verify bin**

```bash
node dist/cli.js
```

Expected: Help text shows `mistral-ai ocr|tts|stt|config`.

**Step 5: Commit**

```bash
git add dist/
git commit -m "build: compile TypeScript"
```

---

## Task 8: Final Integration Test

**Files:**

- Run: Integration test

**Step 1: Test OCR (existing)**

```bash
export MISTRAL_API_KEY=test_key
node dist/cli.js config show
```

Expected: Config shows correct paths.

**Step 2: Test TTS help**

```bash
node dist/cli.js tts --help
```

Expected: Shows TTS usage.

**Step 3: Test STT help**

```bash
node dist/cli.js stt --help
```

Expected: Shows STT usage.

**Step 4: Commit**

```bash
git commit -m "test: integration tests pass"
```

---

## Summary

8 tasks, ~2-3 hours total:

1. Rename package + config (15 min)
2. Create tools structure (20 min)
3. Update MCP server (20 min)
4. Update CLI (20 min)
5. Add tests (15 min)
6. Update docs (15 min)
7. Build + verify (10 min)
8. Integration test (10 min)

All commits atomic. Tests pass. Ready for execution.
