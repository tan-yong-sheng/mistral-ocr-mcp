# mistral-ai-mcp

Mistral AI MCP server + CLI. OCR documents, TTS text-to-speech, STT speech-to-text via Voxtral.

## Features

- **OCR** - Extract text from PDFs, DOCX, PPTX, XLSX, images
- **TTS** - Generate speech with preset voices or voice cloning
- **STT** - Transcribe audio (batch or realtime)

## Install

```bash
npm install -g mistral-ai-mcp
```

Requires Node.js 18+.

## CLI Usage

```bash
mistral-ai ocr <file-or-url>    # Extract text from documents/images
mistral-ai tts <text>            # Generate speech from text
mistral-ai stt <audio>           # Transcribe audio to text
mistral-ai config ...            # Manage configuration
```

### OCR Examples

```bash
# Local PDF
mistral-ai ocr ./document.pdf > output.md

# From URL
mistral-ai ocr https://arxiv.org/pdf/2301.00001.pdf > paper.md

# Tables
mistral-ai ocr ./document.pdf --table-format html
```

### TTS Examples

```bash
# Preset voice
mistral-ai tts "Hello, world!" --voice-id alice

# Voice cloning via reference audio
mistral-ai tts "Hello from me!" --ref-audio ./my-voice.wav

# Output format
mistral-ai tts "Hello!" --voice-id bob --format wav > output.wav
```

### STT Examples

```bash
# Basic transcription
mistral-ai stt ./audio.mp3

# Realtime mode (low latency)
mistral-ai stt ./audio.mp3 --realtime

# Speaker diarization
mistral-ai stt ./meeting.mp3 --diarize

# Specific language
mistral-ai stt ./audio.mp3 --language en
```

## Supported Formats

| Tool | Input Formats                          | Output Formats            |
| ---- | -------------------------------------- | ------------------------- |
| OCR  | PDF, DOCX, PPTX, XLSX, PNG, JPEG, AVIF | Markdown + YAML           |
| TTS  | Text                                   | MP3, WAV, PCM, FLAC, Opus |
| STT  | MP3, WAV, FLAC, OGG, WebM              | Text + JSON               |

## Configuration

### Set API Key

```bash
mistral-ai config api_key <your-key>
```

Or via environment:

```bash
export MISTRAL_API_KEY=your-key
```

### Config Location

- Linux/macOS: `~/.mistral-ai/config.json`
- Windows: `%USERPROFILE%\.mistral-ai\config.json`

Override with `MISTRAL_AI_CONFIG_DIR` env var.

### Show Config

```bash
mistral-ai config show
```

### Config Options

```bash
mistral-ai config api_key <key>    # Set API key
mistral-ai config base_url <url>    # API endpoint (default: https://api.mistral.ai/v1)
mistral-ai config model <model>     # Default OCR model
```

## MCP Server

Start server with stdio transport:

```bash
mistral-ai-mcp
```

### MCP Tools

| Tool             | Description               |
| ---------------- | ------------------------- |
| `ocr_pdf`    | Extract text from PDF sources |
| `tts_speech`     | Generate speech from text |
| `stt_transcribe` | Transcribe audio to text  |

### Example (Node.js client)

```javascript
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['node_modules/.bin/mistral-ai-mcp'],
  env: { MISTRAL_API_KEY: 'your-key' },
});

const client = new Client({ name: 'test', version: '1.0.0' }, { capabilities: {} });
await client.connect(transport);

// OCR
const ocrResult = await client.callTool({
  name: 'ocr_pdf_url',
  arguments: { pdf_url: 'https://example.com/doc.pdf' },
});

// TTS
const ttsResult = await client.callTool({
  name: 'tts_speech',
  arguments: { text: 'Hello!', voice_id: 'alice' },
});

// STT
const sttResult = await client.callTool({
  name: 'stt_transcribe',
  arguments: { audio_source: './audio.mp3' },
});
```

## Development

### Setup

```bash
npm install
```

### Scripts

```bash
npm run dev          # Run with tsx (watch mode)
npm run build        # Compile TypeScript
npm run clean        # Remove dist/
npm run lint         # ESLint check
npm run format       # Prettier check
npm run format:write # Prettier fix
npm run typecheck    # Type check only
npm run test         # Run tests
```

### Git Hooks

Husky hooks enforce code quality:

- **pre-commit**: Runs `npm run lint && npm run format`
- **pre-push**: Runs `npm run typecheck && npm run test`

### CI/CD

GitHub Actions workflows:

- **CI** (`.github/workflows/ci.yml`): Lint, build, typecheck on push/PR
- **Tests** (`.github/workflows/test.yml`): Run tests on push/PR

## License

ISC
