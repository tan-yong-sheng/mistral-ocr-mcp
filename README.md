# mistral-ai-mcp

Mistral OCR CLI + MCP server. Extract text from PDFs via URL using `mistral-ocr-latest` model.

## Install

```bash
npm install -g mistral-ai-mcp
```

## Setup

Set API key:

```bash
mistral-ai config api_key <your-key>
```

Optional: custom base URL (default: `https://api.mistral.ai/v1`):

```bash
mistral-ai config base_url https://custom.url/v1
```

## CLI Usage

Extract text from PDF URL:

```bash
mistral-ai ocr "https://arxiv.org/pdf/2301.00001.pdf"
```

Output: JSON with `text`, `pages`, `confidence`, `model`.

Config commands:

```bash
mistral-ai config show          # Show current config
mistral-ai config api_key <key> # Set API key
mistral-ai config base_url <url> # Set base URL
```

## MCP Server

Start server (stdio transport):

```bash
mistral-ai-mcp
```

Tool: `ocr_pdf_url`

- Input: `pdf_url` (public URL to PDF)
- Output: Extracted markdown text

Example (Node.js client):

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

const result = await client.callTool({
  name: 'ocr_pdf_url',
  arguments: { pdf_url: 'https://example.com/doc.pdf' },
});

console.log(result.content[0].text);
```

## Config Location

- Linux/macOS: `~/.mistral-ai/config.json`
- Windows: `%USERPROFILE%\.mistral-ai\config.json`

Override: `MISTRAL_AI_CONFIG_DIR` env var.

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

Hooks automatic. Bypass (not recommended):

```bash
git commit --no-verify
git push --no-verify
```

### CI/CD

GitHub Actions workflows:

- **CI** (`.github/workflows/ci.yml`): Lint, build, typecheck on push/PR
- **Tests** (`.github/workflows/test.yml`): Run tests on push/PR

## License

ISC
