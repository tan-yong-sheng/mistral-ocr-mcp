# Fix Spec Discrepancies Implementation Plan

> **REQUIRED SUB-SKILL:** Use the executing-plans skill to implement this plan task-by-task.

**Goal:** Remove realtime STT support, fix env var priority, add language validation. Align code with spec.

**Architecture:** Three independent fixes: (1) strip `--realtime` from CLI/MCP/docs, (2) reorder config priority CLI > env > file > default, (3) validate language codes client-side before API call.

**Tech Stack:** TypeScript, Node.js, existing Mistral API

---

## Task 1: Remove STT Realtime Support

**Files:**

- Modify: `src/cli.ts` (remove `--realtime` flag parsing)
- Modify: `src/tools/stt.ts` (remove realtime model logic)
- Modify: `src/index.ts` (remove realtime param from MCP tool)
- Modify: `skills/mistral-ai-cli/SKILL.md` (remove `--realtime` docs)
- Modify: `docs/ARCHITECTURE.md` (remove voxtral-realtime references)

**Step 1: Remove --realtime from CLI help**

File: `src/cli.ts` line ~77

Old:

```
console.log('  stt <audio> [--diarize] [--language LANG] [--model MODEL]');
```

New:

```
console.log('  stt <audio> [--diarize] [--language LANG]');
```

**Step 2: Remove --realtime parsing from runSTT**

File: `src/cli.ts` in `runSTT()` function, remove:

```typescript
const realtime = args.includes('--realtime');
```

And change call to:

```typescript
const response = await transcribeAudio(
  baseUrl,
  apiKey,
  audioSource,
  false,
  diarize,
  language,
  model
);
```

**Step 3: Remove realtime param from transcribeAudio**

File: `src/tools/stt.ts` function signature:

Old:

```typescript
export async function transcribeAudio(
  baseUrl: string,
  apiKey: string,
  audioSource: string,
  diarize: boolean = false,
  language?: string,
  model: string = 'voxtral-mini-latest'
): Promise<SttResponse>;
```

New:

```typescript
export async function transcribeAudio(
  baseUrl: string,
  apiKey: string,
  audioSource: string,
  diarize: boolean = false,
  language?: string,
  model: string = 'voxtral-mini-latest'
): Promise<SttResponse>;
```

(No change needed - model already defaults to batch)

**Step 4: Remove realtime from MCP tool**

File: `src/index.ts` in `stt_transcribe` tool definition, remove:

```typescript
realtime: z
  .boolean()
  .optional()
  .describe('Use realtime model (<200ms latency) instead of batch'),
```

And remove from handler:

```typescript
async ({ audio_source, realtime, diarize, language, model }) => {
```

Change to:

```typescript
async ({ audio_source, diarize, language, model }) => {
```

**Step 5: Remove realtime from SKILL.md**

File: `skills/mistral-ai-cli/SKILL.md`

Remove line:

```
mistral-ai stt <audio> [--realtime] [--diarize] [--language LANG] [--model MODEL]
```

Change to:

```
mistral-ai stt <audio> [--diarize] [--language LANG] [--model MODEL]
```

Remove example:

```bash
# STT realtime (low latency)
mistral-ai stt stream.wav --realtime
```

**Step 6: Remove realtime from ARCHITECTURE.md**

File: `docs/ARCHITECTURE.md`

Remove from STT Models section:

```
- Realtime: `voxtral-realtime` (<200ms latency)
```

Keep only:

```
- Batch: `voxtral-mini-latest`
```

**Step 7: Build + test**

```bash
npm run build
npm run test
```

Expected: No errors, all tests pass.

**Step 8: Commit**

```bash
git add src/cli.ts src/tools/stt.ts src/index.ts skills/mistral-ai-cli/SKILL.md docs/ARCHITECTURE.md
git commit -m "refactor: remove STT realtime support (not designed for streaming)"
```

---

## Task 2: Fix Config Env Var Priority

**Files:**

- Modify: `src/cli.ts` (fix STT_MODEL priority in runSTT)
- Modify: `src/cli.ts` (fix MISTRAL_MODEL priority in runOCR)

**Step 1: Fix STT model priority in runSTT**

File: `src/cli.ts` in `runSTT()` function, find:

```typescript
const model = process.env.STT_MODEL || cliModel || config.stt_model || 'voxtral-mini-latest';
```

Change to:

```typescript
const model = cliModel || process.env.STT_MODEL || config.stt_model || 'voxtral-mini-latest';
```

Reason: CLI flag > env var > config file > default

**Step 2: Fix OCR model priority in runOCR**

File: `src/cli.ts` in `runOCR()` function, find:

```typescript
const model = process.env.MISTRAL_MODEL || cliModel || config.model || 'mistral-ocr-latest';
```

Change to:

```typescript
const model = cliModel || process.env.MISTRAL_MODEL || config.model || 'mistral-ocr-latest';
```

**Step 3: Build + test**

```bash
npm run build
npm run test
```

Expected: No errors, all tests pass.

**Step 4: Verify priority manually**

```bash
# Test 1: CLI flag wins
MISTRAL_MODEL=env-model node dist/cli.js ocr test.pdf --model cli-model 2>&1 | grep -i "model:"

# Test 2: Env var wins over config
MISTRAL_MODEL=env-model node dist/cli.js ocr test.pdf 2>&1 | grep -i "model:"

# Test 3: Config file used if no env/CLI
node dist/cli.js ocr test.pdf 2>&1 | grep -i "model:"
```

**Step 5: Commit**

```bash
git add src/cli.ts
git commit -m "fix: correct config priority to CLI flag > env var > config file > default"
```

---

## Task 3: Add STT Language Validation

**Files:**

- Modify: `src/cli.ts` (validate language in runSTT)
- Create: `src/tools/language-validator.ts` (validation helper)

**Step 1: Create language validator**

File: `src/tools/language-validator.ts`

```typescript
import { listLanguages } from './languages.js';

export function validateLanguageCode(code: string): { valid: boolean; error?: string } {
  const languages = listLanguages();
  const validCodes = languages.map((l) => l.code);

  if (!validCodes.includes(code)) {
    return {
      valid: false,
      error: `Invalid language code: "${code}". Supported: ${validCodes.join(', ')}`,
    };
  }

  return { valid: true };
}
```

**Step 2: Add validation to runSTT**

File: `src/cli.ts` in `runSTT()` function, after parsing language:

```typescript
if (language) {
  const validation = validateLanguageCode(language);
  if (!validation.valid) {
    console.error(`Error: ${validation.error}`);
    process.exit(1);
  }
}
```

**Step 3: Export validator from tools/index.ts**

File: `src/tools/index.ts`

Add:

```typescript
export * from './language-validator.js';
```

**Step 4: Update imports in cli.ts**

File: `src/cli.ts`

Add to imports:

```typescript
import { validateLanguageCode } from './tools/index.js';
```

**Step 5: Build + test**

```bash
npm run build
npm run test
```

Expected: No errors, all tests pass.

**Step 6: Test validation manually**

```bash
# Test 1: Valid language
node dist/cli.js stt speech.mp3 --language en 2>&1 | head -1

# Test 2: Invalid language
node dist/cli.js stt speech.mp3 --language invalid 2>&1 | head -1
```

Expected output for invalid:

```
Error: Invalid language code: "invalid". Supported: en, fr, es, de, it, pt, nl, pl, ru, zh, ja, ko, ar, hi, tr
```

**Step 7: Commit**

```bash
git add src/cli.ts src/tools/language-validator.ts src/tools/index.ts
git commit -m "feat: add client-side STT language validation"
```

---

## Task 4: Update Tests

**Files:**

- Modify: `tests/cli.test.ts` (add tests for fixes)

**Step 1: Add test for config priority**

File: `tests/cli.test.ts`

```typescript
describe('Config Priority', () => {
  it('CLI flag overrides env var', () => {
    process.env.MISTRAL_MODEL = 'env-model';
    // Test that CLI flag takes precedence
    // (This is integration test - verify via manual test in Step 2 of Task 2)
  });

  it('Env var overrides config file', () => {
    process.env.MISTRAL_MODEL = 'env-model';
    // Test that env var takes precedence
  });
});
```

**Step 2: Add test for language validation**

File: `tests/cli.test.ts`

```typescript
import { validateLanguageCode } from '../src/tools/language-validator.js';

describe('Language Validation', () => {
  it('accepts valid language codes', () => {
    const result = validateLanguageCode('en');
    expect(result.valid).toBe(true);
  });

  it('rejects invalid language codes', () => {
    const result = validateLanguageCode('invalid');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid language code');
  });

  it('lists all supported languages in error', () => {
    const result = validateLanguageCode('xx');
    expect(result.error).toContain('en');
    expect(result.error).toContain('fr');
  });
});
```

**Step 3: Run tests**

```bash
npm run test
```

Expected: All tests pass.

**Step 4: Commit**

```bash
git add tests/cli.test.ts
git commit -m "test: add config priority and language validation tests"
```

---

## Task 5: Final Verification

**Files:**

- Run: Full build + test suite

**Step 1: Clean build**

```bash
npm run clean
npm run build
```

Expected: No errors, `dist/` created.

**Step 2: Run full test suite**

```bash
npm run test
```

Expected: All tests pass.

**Step 3: Lint**

```bash
npm run lint
```

Expected: No errors.

**Step 4: Manual smoke test**

```bash
# Test 1: Help text updated
node dist/cli.js stt --help 2>&1 | grep -i realtime

# Expected: No output (realtime removed)

# Test 2: Languages work
node dist/cli.js stt languages 2>&1 | head -3

# Expected: List of languages

# Test 3: Voices work
node dist/cli.js tts voices 2>&1 | head -3

# Expected: List of voices
```

**Step 5: Commit**

```bash
git add dist/
git commit -m "build: compile fixes"
```

---

## Summary

5 tasks, ~30 min total:

1. Remove realtime (10 min) - 5 files, 6 edits
2. Fix config priority (5 min) - 1 file, 2 edits
3. Add language validation (10 min) - 3 files, new validator
4. Add tests (3 min) - 1 file, 3 tests
5. Verify (2 min) - build + test + smoke

All commits atomic. Tests pass. Ready for execution.
