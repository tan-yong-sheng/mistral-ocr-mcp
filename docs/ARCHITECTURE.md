# Architecture

Mistral AI MCP - OCR, TTS, STT via Voxtral.

## Directory Structure

```
src/
├── index.ts          # MCP server entry
├── cli.ts            # CLI entry
├── config.ts         # Config loading
└── tools/
    ├── index.ts      # Barrel export
    ├── types.ts      # Shared types
    ├── ocr.ts        # OCR implementation
    ├── tts.ts        # TTS implementation
    └── stt.ts        # STT implementation
```

## Tool Structure

Each tool module (`ocr.ts`, `tts.ts`, `stt.ts`) exports:

- **API functions** - Core Mistral API calls
- **Validation functions** - Input validation
- **Shared types** - TypeScript interfaces in `types.ts`

### types.ts

```typescript
interface OcrResponse {
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

interface TtsResponse {
  audio_data: string; // base64
  model: string;
}

interface SttResponse {
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

## API Flow

### CLI Flow

```
User Input → cli.ts → tools/* → Mistral API → Response → stdout
```

1. Parse args (`ocr`/`tts`/`stt`/`config`)
2. Load config from `MISTRAL_AI_CONFIG_DIR`
3. Call appropriate tool function
4. Output result

### MCP Flow

```
MCP Client → index.ts → tools/* → Mistral API → JSON Response
```

1. MCP client calls tool via stdio
2. Server routes to appropriate handler
3. Handler calls tool function
4. Response formatted as MCP result

## Config Hierarchy

```
Environment Variables > Config File > Defaults
```

### Config File Location

- Linux/macOS: `~/.mistral-ai/config.json`
- Windows: `%USERPROFILE%\.mistral-ai\config.json`
- Override: `MISTRAL_AI_CONFIG_DIR` env var

### Config File Format

```json
{
  "api_key": "your-api-key",
  "base_url": "https://api.mistral.ai/v1",
  "model": "mistral-ai-latest"
}
```

### Environment Variables

| Variable                | Default                     | Description        |
| ----------------------- | --------------------------- | ------------------ |
| `MISTRAL_API_KEY`       | -                           | API key (required) |
| `MISTRAL_AI_CONFIG_DIR` | `~/.mistral-ai`             | Config directory   |
| `MISTRAL_BASE_URL`      | `https://api.mistral.ai/v1` | API endpoint       |
| `MISTRAL_MODEL`         | `mistral-ai-latest`         | Default OCR model  |

### Priority

1. CLI flag (`--model`, `--voice-id`, etc.)
2. Environment variable
3. Config file
4. Default value

## Supported Formats

### OCR

| Type      | Extensions            | Notes                    |
| --------- | --------------------- | ------------------------ |
| Documents | PDF, DOCX, PPTX, XLSX | Full document processing |
| Images    | PNG, JPEG, AVIF       | Image-based OCR          |

**Models:** `mistral-ai-latest` (default)

**Features:**

- Page-by-page extraction
- Table extraction (markdown/html)
- Hyperlink extraction
- Confidence scores

### TTS

| Format | Extension | Notes        |
| ------ | --------- | ------------ |
| MP3    | `.mp3`    | Default      |
| WAV    | `.wav`    | Uncompressed |
| PCM    | `.pcm`    | Raw audio    |
| FLAC   | `.flac`   | Lossless     |
| Opus   | `.opus`   | Efficient    |

**Models:** `voxtral-mini-tts-2603`

**Voice Options:**

- Preset voices: `alice`, `bob`, `charlie`, etc.
- Voice cloning: Reference audio (5-25s HTTPS URL)

### STT

| Format | Extension | Notes         |
| ------ | --------- | ------------- |
| MP3    | `.mp3`    | Common format |
| WAV    | `.wav`    | Uncompressed  |
| FLAC   | `.flac`   | Lossless      |
| OGG    | `.ogg`    | Compressed    |
| WebM   | `.webm`   | Browser audio |

**Models:**

- `voxtral-mini-latest`

**Features:**

- Speaker diarization (optional)
- Language specification
- Word-level timestamps (segments)

## MCP Tools

### ocr_pdf_url

```typescript
server.tool('ocr_pdf_url', {
  pdf_url: z.string().describe('HTTPS URL to PDF'),
  table_format: z.enum(['markdown', 'html']).optional(),
});
```

### tts_speech

```typescript
server.tool('tts_speech', {
  text: z.string().describe('Text to convert'),
  voice_id: z.string().optional().describe('Preset voice ID'),
  ref_audio_url: z.string().optional().describe('HTTPS URL to reference audio'),
  format: z.enum(['mp3', 'wav', 'pcm', 'flac', 'opus']).optional(),
});
```

### stt_transcribe

```typescript
server.tool('stt_transcribe', {
  audio_source: z.string().describe('Audio file path or HTTPS URL'),
  diarize: z.boolean().optional().describe('Enable speaker diarization'),
  language: z.string().optional().describe('Language code (e.g., "en")'),
});
```

## Security

- API key stored in user config directory (0600 permissions)
- No key logged or transmitted to third parties
- HTTPS only for API calls
- Reference audio URLs must be HTTPS
