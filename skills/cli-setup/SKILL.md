# CLI Setup

## Overview
Initialize Mistral OCR CLI configuration for first-time use.

## Quick Start
```bash
npm install -g mistral-ocr-mcp
mistral-ocr config api_key YOUR_API_KEY
mistral-ocr config base_url https://api.mistral.ai/v1 # optional
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