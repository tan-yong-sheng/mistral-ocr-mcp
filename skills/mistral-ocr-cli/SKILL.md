---
name: mistral-ocr-cli
description: Set up and manage Mistral OCR CLI configuration. Use when initializing the CLI for first-time use, setting API keys, configuring custom endpoints, or troubleshooting config issues. Covers both initial setup (npm install, api_key, base_url) and ongoing config management (show, update, override with env vars).
---

# Mistral OCR CLI

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

## Commands

### Run OCR on PDF

```bash
mistral-ocr ocr <pdf-path>
```

Extracts text from PDF using Mistral vision model. Outputs JSON with extracted text + metadata.

**Examples:**

```bash
# Local file
mistral-ocr ocr ./document.pdf

# With output file
mistral-ocr ocr ./document.pdf > output.json

# URL
mistral-ocr ocr https://example.com/document.pdf
```

**Output format:**

```json
{
  "text": "extracted text content",
  "pages": 5,
  "confidence": 0.95,
  "model": "mistral-ocr-latest"
}
```

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
# Setup
mistral-ocr config api_key sk-...
mistral-ocr config base_url https://api.mistral.ai/v1
mistral-ocr config show

# OCR workflow
mistral-ocr ocr ./invoice.pdf > invoice.json
cat invoice.json | jq '.text'

# Override with env var
export MISTRAL_API_KEY=sk-override
mistral-ocr ocr ./document.pdf
```

## Troubleshooting

**"MISTRAL_API_KEY required"**
- Set via CLI: `mistral-ocr config api_key <key>`
- Or env var: `export MISTRAL_API_KEY=<key>`

**Custom API endpoint**
- `mistral-ocr config base_url https://custom.api.com/v1`
