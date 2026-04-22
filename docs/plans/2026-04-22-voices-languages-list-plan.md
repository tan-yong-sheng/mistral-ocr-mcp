# Voices & Languages List Implementation Plan

## Overview

Add CLI commands to list voices (TTS) + languages (STT). Dynamically inject into MCP tool descriptions at runtime.

## Tasks

### Task 1: Add CLI Commands

- `mistral-ai tts voices` → fetch + display voices from API
- `mistral-ai stt languages` → display hardcoded language list
- Update help text

### Task 2: Create Voice/Language Fetchers

- `src/tools/voices.ts` → `listVoices()` fn (fetch from API)
- `src/tools/languages.ts` → `listLanguages()` fn (hardcoded)
- Cache voices in memory (session-scoped)

### Task 3: Update MCP Server

- On init: fetch voices, cache
- Inject into `tts_speech` tool description
- Inject languages into `stt_transcribe` tool description
- Format: "Supported voices: alice, bob, charlie..."

### Task 4: Update Tests

- Test CLI commands (voices/languages)
- Test voice fetch + caching
- Test MCP description injection

### Task 5: Update Docs

- SKILL.md: add voices/languages commands
- README: show examples

### Task 6: Build & Verify

- npm run build
- npm run lint
- npm run test
- Verify CLI help + MCP descriptions

## Implementation Notes

- Voices: fetch once on MCP init, cache for session
- Languages: hardcoded (no API endpoint)
- CLI: independent of MCP (can run standalone)
- Error handling: graceful fallback if voice fetch fails
