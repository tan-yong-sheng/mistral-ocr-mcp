---
name: mistral-ai-cli
description: Mistral AI CLI. OCR (PDFs local/URL), TTS (text→speech w/ voice cloning), STT (audio→text w/ diarization). List voices/languages. Config API key, base URL, model. Outputs markdown w/ YAML frontmatter.
---

# Mistral AI CLI

## Installation

```bash
npm install -g mistral-ai-mcp
```

## Commands

### OCR: Extract text from PDF

```bash
mistral-ai ocr <pdf-path> [--model MODEL] [--table-format markdown|html]
```

Extract text from PDF → markdown w/ YAML frontmatter.

**Input:** Local file or HTTPS URL.

**Output format:**

```yaml
---
model: mistral-ocr-latest
pages: 35
---

# Extracted markdown content

Full text with headers, lists, formatting preserved...
```

### TTS: Text to speech

```bash
mistral-ai tts <text> [--voice-id ID | --ref-audio FILE] [--format FORMAT]
```

Voice cloning: `--ref-audio` (5-25s audio file) → custom voice. Formats: mp3, wav, pcm, flac, opus.

**Output:** Binary audio file `speech_${timestamp}.${format}` in current dir.

### List TTS voices

```bash
mistral-ai tts voices [--json]
```

Fetches available voices from API. `--json` for structured output.

### STT: Speech to text

```bash
mistral-ai stt <audio> [--realtime] [--diarize] [--language LANG]
```

`--realtime` → <200ms latency model. `--diarize` → speaker labels. `--language` → lang code (en, fr, es, etc).

### List STT languages

```bash
mistral-ai stt languages [--json]
```

Supported: en, fr, es, de, it, pt, nl, pl, ru, zh, ja, ko, ar, hi, tr.

### Examples

```bash
# OCR local PDF
mistral-ai ocr ./document.pdf > /tmp/output.md

# OCR from URL
mistral-ai ocr https://arxiv.org/pdf/2501.00001.pdf > /tmp/paper.md

# TTS w/ preset voice
mistral-ai tts "Hello world" --voice-id en_paul_neutral > /tmp/speech.mp3

# TTS w/ voice cloning
mistral-ai tts "Custom message" --ref-audio my_voice.wav > /tmp/cloned.mp3

# STT w/ diarization
mistral-ai stt meeting.wav --diarize --language en

# STT realtime (low latency)
mistral-ai stt stream.wav --realtime

# List voices as JSON
mistral-ai tts voices --json | jq '.[] | .voice_id'

# Batch OCR
for pdf in *.pdf; do
  mistral-ai ocr "$pdf" > "${pdf%.pdf}.md"
done
```

## Output Formats

**OCR:** Markdown + YAML frontmatter (model, pages). Full text w/ formatting preserved.

**TTS:** Binary audio file saved to disk (mp3/wav/pcm/flac/opus).

**STT:** Transcribed text + detected language.

## Use Cases

**OCR:** Extract PDFs for indexing, convert scanned docs, batch invoices/contracts, feed to LLMs, process papers.

**TTS:** Generate voiceovers, voice cloning, accessibility, audio content.

**STT:** Transcribe meetings, podcasts, voice commands, multilingual support.

---

## Configuration

### Set API Key

```bash
mistral-ai config api_key YOUR_API_KEY
```

Stores in `~/.mistral-ai/config.json`. Or env var: `export MISTRAL_API_KEY=YOUR_API_KEY`.

### Set Base URL

```bash
mistral-ai config base_url https://api.mistral.ai/v1
```

Defaults to `https://api.mistral.ai/v1`.

### Set Default Model

```bash
mistral-ai config model mistral-ocr-latest
```

### Show Config

```bash
mistral-ai config show
```

## Env Vars

- `MISTRAL_API_KEY` - API key (required)
- `MISTRAL_AI_CONFIG_DIR` - Config dir (default: `~/.mistral-ai`)
- `MISTRAL_BASE_URL` - API endpoint (default: `https://api.mistral.ai/v1`)
- `MISTRAL_MODEL` - OCR model (default: `mistral-ocr-latest`)

**Priority (high → low):**
1. Env var
2. CLI flag
3. Config file
4. Default

---

## MCP Tools

**ocr_pdf** - Extract text from PDFs (local/URL)
- Input: `sources` (array of paths/URLs)
- Output: Markdown (one section per source)
- Mechanism: Local → upload → signed URL → OCR

**tts_speech** - Generate speech from text
- Input: `text`, `voice_id` or `ref_audio_url`, `format`
- Output: Audio file path (`/tmp/speech_${timestamp}.${format}`)
- Voices injected into description (dynamic from API)

**stt_transcribe** - Transcribe audio to text
- Input: `audio_source`, `realtime`, `diarize`, `language`
- Output: Transcribed text + language
- Languages injected into description (15 supported)

---

## Troubleshooting

**"MISTRAL_API_KEY required"**
- `mistral-ai config api_key <key>` or `export MISTRAL_API_KEY=<key>`

**Custom endpoint**
- `mistral-ai config base_url https://custom.api.com/v1`

**Custom model**
- Flag: `mistral-ai ocr file.pdf --model mistral-ocr-latest`
- Config: `mistral-ai config model mistral-ocr-latest`
- Env: `MISTRAL_MODEL=mistral-ocr-latest mistral-ai ocr file.pdf`

**Help**
```bash
mistral-ai
```
