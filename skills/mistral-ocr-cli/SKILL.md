---
name: mistral-ocr-cli
description: Set up and manage Mistral OCR CLI. Initialize config, set API keys, run OCR on PDFs (local/URL). Outputs markdown with YAML frontmatter (metadata + extracted text). LLM-friendly format for analysis, summarization, Q&A.
---

# Mistral OCR CLI

## Quick Start

```bash
npm install -g mistral-ocr-mcp
mistral-ocr config api_key YOUR_API_KEY
mistral-ocr config show
mistral-ocr ocr ./document.pdf > output.md
```

## Commands

### Run OCR on PDF

```bash
mistral-ocr ocr <pdf-path> [--model MODEL]
```

Extracts text from PDF using Mistral vision model. Outputs markdown with YAML frontmatter.

`--model` optional. Defaults to `mistral-ocr-latest`. Override via `MISTRAL_MODEL` env var.

**Output format:**

```yaml
---
model: mistral-ocr-latest
pages: 35
---

# Extracted markdown content

Full text with headers, lists, formatting preserved...
```

**Examples:**

```bash
# Local file
mistral-ocr ocr ./document.pdf

# Save to markdown
mistral-ocr ocr ./document.pdf > output.md

# URL (arxiv, papers)
mistral-ocr ocr https://arxiv.org/pdf/2501.00001.pdf > paper.md

# Custom model via flag
mistral-ocr ocr ./document.pdf --model mistral-ocr-2512

# Custom model via env var
MISTRAL_MODEL=mistral-ocr-2512 mistral-ocr ocr ./document.pdf

# Pipe to LLM
mistral-ocr ocr ./document.pdf | llm -m claude-opus "summarize this"

# Batch process
for pdf in *.pdf; do
  mistral-ocr ocr "$pdf" > "${pdf%.pdf}.md"
done
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

## Configuration

Config stored in `~/.mistral-ocr/config.json`. Env vars override file settings.

**Env vars:**
- `MISTRAL_API_KEY` - API key (required)
- `MISTRAL_OCR_CONFIG_DIR` - Config directory (default: `~/.mistral-ocr`)
- `MISTRAL_BASE_URL` - API endpoint (default: `https://api.mistral.ai/v1`)
- `MISTRAL_MODEL` - OCR model (default: `mistral-ocr-latest`)

**Priority (model):**
1. `MISTRAL_MODEL` env var (highest)
2. `--model` CLI flag
3. Config file (`mistral-ocr config model`)
4. Default: `mistral-ocr-latest`

## Output Format

Markdown + YAML frontmatter. Frontmatter includes:
- `model` - OCR model used
- `pages` - Total pages extracted

Content is full markdown with preserved formatting (headers, lists, code blocks, etc). LLM-friendly for analysis, summarization, Q&A.

## Use Cases

- Extract text from PDFs for indexing/search
- Convert scanned documents to markdown
- Batch process invoices, receipts, contracts
- Feed OCR output to LLMs for analysis
- Process academic papers (arxiv, research PDFs)
- Extract structured data from forms/documents
- Archive PDFs as searchable markdown

## Troubleshooting

**"MISTRAL_API_KEY required"**
- Set via CLI: `mistral-ocr config api_key <key>`
- Or env var: `export MISTRAL_API_KEY=<key>`

**Custom API endpoint**
- `mistral-ocr config base_url https://custom.api.com/v1`

**Custom model**
- Via flag: `mistral-ocr ocr file.pdf --model mistral-ocr-2512`
- Via config: `mistral-ocr config model mistral-ocr-2512`
- Via env: `MISTRAL_MODEL=mistral-ocr-2512 mistral-ocr ocr file.pdf`
