# Mistral OCR MCP Server

## Quick Start

Make sure to set up your environment variables first:
- `MISTRAL_API_KEY` (required, get this from your Mistral API settings)

## Installation

### 1. Using with Claude Desktop 

Add the server config to your Claude Desktop configuration file:

Add the following configuration to the `mcpServers` object in your Claude configuration file:

#### For Local Installation (on Windows)

```json
"mistral-ocr-mcp": {
  "command": "cmd",
  "args": [
    "/k",
    "npx",
    "-y",
    "mistral-ocr-mcp"
  ],
  "env": {
    "MISTRAL_API_KEY": "<YOUR_MISTRAL_API_KEY>"
  }
}
```

#### For Local installation (on Linux/MacOS)

```json
"mistral-ocr-mcp": {
  "command": "npx",
  "args": [
    "-y",
    "mistral-ocr-mcp"
  ],
  "env": {
    "MISTRAL_API_KEY": "<YOUR_MISTRAL_API_KEY>"
  }
}
```

#### For Development (on Windows / Linux / MacOS)

```bash
cd /path/to/mistral-ocr-mcp
npm run build
```

```json
"mistral-ocr-mcp": {
  "command": "node",
  "args": [
    "/path/to/mistral-ocr-mcp/dist/index.js"
  ],
  "env": {
    "MISTRAL_API_KEY": "<YOUR_MISTRAL_API_KEY>"
  }
}
```

Location of the configuration file:
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`
- MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

### 2. Alternative Installation Methods

You can also run this server directly using `npx`:

```bash
npx mistral-ocr-mcp
```

Or set your API key as an environment variable:

```bash
export MISTRAL_API_KEY="YOUR_MISTRAL_API_KEY"
npx mistral-ocr-mcp
```

## Available Tools

The server provides the following tools for OCR operations:

- `ocr_for_local_pdf` - Perform OCR on a local PDF file
  - Requires: file_path (string) - The local path to the PDF file
  - Process: Uploads the file to Mistral API, gets a signed URL, and performs OCR

- `ocr_for_pdf_url` - Perform OCR on a PDF file from a public URL
  - Requires: pdf_url (string) - The public URL of the PDF file
  - Process: Directly processes the PDF from the provided URL using Mistral's OCR API

## Development

If you want to contribute or modify the server:

```bash
# Clone the repository
git clone https://github.com/tan-yong-sheng/mistral-ocr-mcp.git

# Install dependencies
npm install

# Build the server
npm run build

# For development with auto-rebuild
npm start
