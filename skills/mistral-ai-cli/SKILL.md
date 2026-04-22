---
name: mistral-ai-cli
description: Set up and manage Mistral OCR CLI. Initialize config, set API keys, run OCR on PDFs (local/URL). Outputs markdown with YAML frontmatter (metadata + extracted text). LLM-friendly format for analysis, summarization, Q&A.
---

# Mistral OCR CLI

## Installation

```bash
npm install -g mistral-ai-mcp
```

## Core: Run OCR on PDF

```bash
mistral-ai ocr <pdf-path> [--model MODEL]
```

Extract text from PDF → markdown w/ YAML frontmatter.

**Input:** Local file or HTTPS URL.

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

````bash
# Local PDF
mistral-ai ocr ./document.pdf > output.md

# HTTPS URL
mistral-ai ocr https://arxiv.org/pdf/2501.00001.pdf > paper.md

# Custom model (flag)
mistral-ai ocr ./document.pdf --model mistral-ai-latest

# Custom model (env var)
MISTRAL_MODEL=mistral-ai-latest mistral-ai ocr ./document.pdf

# Pipe to LLM (note: OCR ~5-6s + LLM inference time)
```bash
mistral-ai ocr ./document.pdf | claude -p "summarize this"
# or you could use other cli coding agent like `codex`, `gemini`, `pi` if they are supporting non-interactive mode

# Or save to file first
mistral-ai ocr ./document.pdf > /tmp/output.md
claude -p "summarize this" < /tmp/output.md
````

# Batch process

for pdf in \*.pdf; do
mistral-ai ocr "$pdf" > "${pdf%.pdf}.md"
done

````

## Output Format

Markdown + YAML frontmatter:
- `model` - OCR model used
- `pages` - Total pages extracted

Content: full markdown w/ preserved formatting (headers, lists, code blocks, etc). LLM-friendly for analysis, summarization, Q&A.

## Use Cases

- Extract text from PDFs for indexing/search
- Convert scanned documents to markdown
- Batch process invoices, receipts, contracts
- Feed OCR output to LLMs for analysis
- Process academic papers (arxiv, research PDFs)
- Extract structured data from forms/documents
- Archive PDFs as searchable markdown

---

## Authentication & Configuration

### Set API Key

```bash
mistral-ai config api_key YOUR_API_KEY
````

Stores in `~/.mistral-ai/config.json`.

Or env var:

```bash
export MISTRAL_API_KEY=YOUR_API_KEY
```

### Set Base URL (Optional)

```bash
mistral-ai config base_url https://custom.api.com/v1
```

Defaults to `https://api.mistral.ai/v1` if not set.

### Set Default Model (Optional)

```bash
mistral-ai config model mistral-ai-latest
```

### Show Current Config

```bash
mistral-ai config show
```

Displays current settings + config file location.

## Configuration

Config stored in `~/.mistral-ai/config.json`. Env vars override file settings.

**Env vars:**

- `MISTRAL_API_KEY` - API key (required)
- `MISTRAL_OCR_CONFIG_DIR` - Config directory (default: `~/.mistral-ai`)
- `MISTRAL_BASE_URL` - API endpoint (default: `https://api.mistral.ai/v1`)
- `MISTRAL_MODEL` - OCR model (default: `mistral-ai-latest`)

**Model priority (highest → lowest):**

1. `MISTRAL_MODEL` env var
2. `--model` CLI flag
3. Config file (`mistral-ai config model`)
4. Default: `mistral-ai-latest`

---

## Troubleshooting

**"MISTRAL_API_KEY required"**

- Set via CLI: `mistral-ai config api_key <key>`
- Or env var: `export MISTRAL_API_KEY=<key>`

**Custom API endpoint**

- `mistral-ai config base_url https://custom.api.com/v1`

**Custom model**

- Via flag: `mistral-ai ocr file.pdf --model mistral-ai-latest`
- Via config: `mistral-ai config model mistral-ai-latest`
- Via env: `MISTRAL_MODEL=mistral-ai-latest mistral-ai ocr file.pdf`

**Help**

```bash
mistral-ai
```
