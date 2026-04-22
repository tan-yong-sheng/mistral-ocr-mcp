---
name: mistral-ai-cli
description: Mistral AI CLI + MCP server. OCR documents, TTS text-to-speech, STT speech-to-text. Outputs markdown/JSON/audio. LLM-friendly format for analysis.
---

# Mistral AI CLI

## Installation

```bash
npm install -g mistral-ai-mcp
```

## Commands

```bash
mistral-ai ocr <file-or-url>    # Extract text from documents/images
mistral-ai tts <text>            # Generate speech from text
mistral-ai stt <audio>           # Transcribe audio to text
mistral-ai config ...            # Manage configuration
```

---

# OCR

## Run OCR on Document

```bash
mistral-ai ocr <pdf-path> [--model MODEL] [--table-format markdown|html]
```

Extract text from PDF → markdown w/ YAML frontmatter.

**Input:** Local file or HTTPS URL.

**Supported formats:** PDF, DOCX, PPTX, XLSX, PNG, JPEG, AVIF

**Output format:**

```yaml
---
model: mistral-ai-latest
pages: 35
---
# Extracted markdown content

Full text with headers, lists, formatting preserved...
```

### Examples

```bash
# Local PDF
mistral-ai ocr ./document.pdf > output.md

# HTTPS URL
mistral-ai ocr https://arxiv.org/pdf/2501.00001.pdf > paper.md

# Custom model (flag)
mistral-ai ocr ./document.pdf --model mistral-ai-latest

# Custom model (env var)
MISTRAL_MODEL=mistral-ai-latest mistral-ai ocr ./document.pdf

# Table format
mistral-ai ocr ./document.pdf --table-format html

# Pipe to LLM
mistral-ai ocr ./document.pdf | claude -p "summarize this"

# Batch process
for pdf in *.pdf; do
  mistral-ai ocr "$pdf" > "${pdf%.pdf}.md"
done
```

---

# TTS (Text-to-Speech)

## Generate Speech

```bash
mistral-ai tts <text> [--voice-id ID | --ref-audio FILE] [--format mp3|wav|pcm|flac|opus]
```

Generate speech from text using Voxtral TTS.

**Options:**

- `--voice-id` - Preset voice (e.g., `alice`, `bob`, `charlie`)
- `--ref-audio` - Reference audio file for voice cloning (5-25s)
- `--format` - Output format (default: mp3)

**Requires:** Either `--voice-id` OR `--ref-audio`

### Examples

```bash
# Preset voice
mistral-ai tts "Hello, world!" --voice-id alice

# Custom voice via reference audio
mistral-ai tts "Hello from me!" --ref-audio ./my-voice.wav

# Output format
mistral-ai tts "Hello!" --voice-id bob --format wav

# Save to file
mistral-ai tts "Hello, world!" --voice-id alice > output.mp3
```

---

# STT (Speech-to-Text)

## Transcribe Audio

```bash
mistral-ai stt <audio-file-or-url> [--realtime] [--diarize] [--language LANG]
```

Transcribe audio to text using Voxtral STT.

**Options:**

- `--realtime` - Use realtime model (<200ms latency)
- `--diarize` - Enable speaker diarization
- `--language` - Language code (e.g., `en`, `fr`, `de`)

**Supported formats:** MP3, WAV, FLAC, OGG, WebM

**Modes:**

- **Batch** (default) - Best accuracy, async processing
- **Realtime** - Low latency streaming (<200ms)

### Examples

```bash
# Basic transcription
mistral-ai stt ./audio.mp3

# From URL
mistral-ai stt https://example.com/audio.mp3

# Realtime mode (low latency)
mistral-ai stt ./audio.mp3 --realtime

# Speaker diarization
mistral-ai stt ./meeting.mp3 --diarize

# Specific language
mistral-ai stt ./audio.mp3 --language en

# Combine options
mistral-ai stt ./meeting.mp3 --realtime --diarize --language en
```

---

# Configuration

## Set API Key

```bash
mistral-ai config api_key YOUR_API_KEY
```

Stores in `~/.mistral-ai/config.json`.

Or env var:

```bash
export MISTRAL_API_KEY=YOUR_API_KEY
```

## Set Base URL (Optional)

```bash
mistral-ai config base_url https://custom.api.com/v1
```

Defaults to `https://api.mistral.ai/v1` if not set.

## Set Default Model (Optional)

```bash
mistral-ai config model mistral-ai-latest
```

## Show Current Config

```bash
mistral-ai config show
```

Displays current settings + config file location.

## Config Hierarchy

Env vars override file settings.

**Env vars:**

- `MISTRAL_API_KEY` - API key (required)
- `MISTRAL_AI_CONFIG_DIR` - Config directory (default: `~/.mistral-ai`)
- `MISTRAL_BASE_URL` - API endpoint (default: `https://api.mistral.ai/v1`)
- `MISTRAL_MODEL` - OCR model (default: `mistral-ai-latest`)

**Priority (highest → lowest):**

1. `MISTRAL_MODEL` env var
2. `--model` CLI flag
3. Config file
4. Default: `mistral-ai-latest`

---

# Troubleshooting

**"MISTRAL_API_KEY required"**

- Set via CLI: `mistral-ai config api_key <key>`
- Or env var: `export MISTRAL_API_KEY=<key>`

**TTS requires voice_id or ref_audio**

- Use preset: `--voice-id alice`
- Or voice clone: `--ref-audio ./my-voice.wav`

**STT file not found**

- Ensure file exists or use HTTPS URL

**Help**

```bash
mistral-ai
```
