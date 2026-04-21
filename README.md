# mistral-ocr-mcp

Mistral OCR CLI + MCP server. Extract text from PDFs via URL using `mistral-ocr-latest` model.

## Install

```bash
npm install -g mistral-ocr-mcp
```

## Setup

Set API key:
```bash
mistral-ocr config api_key <your-key>
```

Optional: custom base URL (default: `https://api.mistral.ai/v1`):
```bash
mistral-ocr config base_url https://custom.url/v1
```

## CLI Usage

Extract text from PDF URL:
```bash
mistral-ocr ocr "https://arxiv.org/pdf/2301.00001.pdf"
```

Output: JSON with `text`, `pages`, `confidence`, `model`.

Config commands:
```bash
mistral-ocr config show          # Show current config
mistral-ocr config api_key <key> # Set API key
mistral-ocr config base_url <url> # Set base URL
```

## MCP Server

Start server (stdio transport):
```bash
mistral-ocr-mcp
```

Tool: `ocr_pdf_url`
- Input: `pdf_url` (public URL to PDF)
- Output: Extracted markdown text

Example (Node.js client):
```javascript
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["node_modules/.bin/mistral-ocr-mcp"],
  env: { MISTRAL_API_KEY: "your-key" }
});

const client = new Client({ name: "test", version: "1.0.0" }, { capabilities: {} });
await client.connect(transport);

const result = await client.callTool({
  name: "ocr_pdf_url",
  arguments: { pdf_url: "https://example.com/doc.pdf" }
});

console.log(result.content[0].text);
```

## Config Location

- Linux/macOS: `~/.mistral-ocr/config.json`
- Windows: `%USERPROFILE%\.mistral-ocr\config.json`

Override: `MISTRAL_OCR_CONFIG_DIR` env var.

## License

ISC
