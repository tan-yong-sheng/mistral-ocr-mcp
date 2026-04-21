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
mistral-ocr config show # Shows env var value
```