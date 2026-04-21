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
mistral-ocr ocr <pdf-path>
```

Extracts text from PDF using Mistral vision model. Outputs markdown with YAML frontmatter.

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
- `MISTRAL_OCR_BASE_URL` - API endpoint (default: `https://api.mistral.ai/v1`)

**Priority:**
1. Environment variables (highest)
2. Config file
3. Defaults (base_url only)

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
