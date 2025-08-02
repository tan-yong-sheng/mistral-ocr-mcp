#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from "zod";
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || "YOUR_MISTRAL_API_KEY";

const server = new McpServer({
  name: "Mistral OCR MCP",
  version: "1.0.0"
});

server.tool(
  'ocr_for_local_pdf',
  'Performs OCR on a local PDF file by uploading it to Mistral API.',
  {
    file_path: z.string().describe("The local path to the PDF file.")
  },
  async ({ file_path }) => {
    try {
      // Step 1: Upload the file
      const form = new FormData();
      form.append('purpose', 'ocr');
      form.append('file', fs.createReadStream(file_path));

      const uploadResponse = await fetch('https://api.mistral.ai/v1/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MISTRAL_API_KEY}`,
          ...form.getHeaders()
        },
        body: form
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        return {
          content: [
            {
              type: "text",
              text: `Upload Error: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`
            }
          ]
        };
      }

      const uploadResult = await uploadResponse.json() as { id: string };
      const fileId = uploadResult.id;

      // Step 2: Retrieve a Signed URL
      const urlResponse = await fetch(`https://api.mistral.ai/v1/files/${fileId}/url?expiry=24`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${MISTRAL_API_KEY}`
        }
      });

      if (!urlResponse.ok) {
        const errorText = await urlResponse.text();
        return {
          content: [
            {
              type: "text",
              text: `Signed URL Error: ${urlResponse.status} ${urlResponse.statusText} - ${errorText}`
            }
          ]
        };
      }

      const urlResult = await urlResponse.json() as { url: string };
      const signedUrl = urlResult.url;

      // Step 3: Send that URL to the OCR Endpoint
      const ocrResponse = await fetch('https://api.mistral.ai/v1/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MISTRAL_API_KEY}`
        },
        body: JSON.stringify({
          model: 'mistral-ocr-latest',
          document: {
            type: 'document_url',
            document_url: signedUrl
          }
        })
      });

      if (!ocrResponse.ok) {
        const errorText = await ocrResponse.text();
        return {
          content: [
            {
              type: "text",
              text: `OCR API Error: ${ocrResponse.status} ${ocrResponse.statusText} - ${errorText}`
            }
          ]
        };
      }

      const ocrResult = await ocrResponse.json();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(ocrResult, null, 2)
          }
        ]
      };

    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error performing OCR on local file: ${error.message}`
          }
        ]
      };
    }
  }
);

server.tool(
  'ocr_for_pdf_url',
  'Performs OCR on a PDF file from a public URL.',
  {
    pdf_url: z.string().url().describe("The public URL of the PDF file.")
  },
  async ({ pdf_url }) => {
    try {
      const response = await fetch('https://api.mistral.ai/v1/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MISTRAL_API_KEY}`
        },
        body: JSON.stringify({
          model: 'mistral-ocr-latest',
          document: {
            type: 'document_url',
            document_url: pdf_url
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          content: [
            {
              type: "text",
              text: `API Error: ${response.status} ${response.statusText} - ${errorText}`
            }
          ]
        };
      }

      const ocrResult = await response.json();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(ocrResult, null, 2)
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error performing OCR: ${error.message}`
          }
        ]
      };
    }
  }
);

const transport = new StdioServerTransport();
server.connect(transport);
