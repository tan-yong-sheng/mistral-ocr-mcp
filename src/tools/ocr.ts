import https from 'https';
import http from 'http';
import fs from 'fs';
import { OcrResponse } from './types.js';

export const SUPPORTED_DOCS = ['pdf', 'pptx', 'docx', 'xlsx'];
export const SUPPORTED_IMAGES = ['png', 'jpeg', 'jpg', 'avif'];
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export function validateDocumentType(filePath: string): boolean {
  const ext = filePath.split('.').pop()?.toLowerCase();
  return [...SUPPORTED_DOCS, ...SUPPORTED_IMAGES].includes(ext || '');
}

export function validateFileSize(fileSize: number): { valid: boolean; error?: string } {
  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large: ${(fileSize / 1024 / 1024).toFixed(2)}MB. Max: ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB`,
    };
  }
  return { valid: true };
}

function getMimeType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    png: 'image/png',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    avif: 'image/avif',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

export async function uploadFileToMistral(
  baseUrl: string,
  apiKey: string,
  fileBuffer: Buffer,
  fileName: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${baseUrl}/files`);
    const protocol = url.protocol === 'https:' ? https : http;

    const boundary = '----FormBoundary' + Date.now();
    const parts: Buffer[] = [];

    const mimeType = getMimeType(fileName);
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`
      )
    );
    parts.push(fileBuffer);
    parts.push(Buffer.from('\r\n'));
    parts.push(
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="purpose"\r\n\r\nocr\r\n`)
    );
    parts.push(Buffer.from(`--${boundary}--\r\n`));

    const body = Buffer.concat(parts);

    const req = protocol.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length,
          Authorization: `Bearer ${apiKey}`,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`File upload failed: ${res.statusCode} ${data}`));
          } else {
            const response = JSON.parse(data);
            resolve(response.id);
          }
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

export async function getSignedUrlFromMistral(
  baseUrl: string,
  apiKey: string,
  fileId: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${baseUrl}/files/${fileId}/url`);
    const protocol = url.protocol === 'https:' ? https : http;

    const req = protocol.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`Get signed URL failed: ${res.statusCode} ${data}`));
          } else {
            const response = JSON.parse(data);
            resolve(response.url);
          }
        });
      }
    );

    req.on('error', reject);
    req.end();
  });
}

export async function callOCRAPI(
  baseUrl: string,
  apiKey: string,
  documentUrl: string,
  model: string,
  tableFormat?: 'markdown' | 'html'
): Promise<OcrResponse> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${baseUrl}/ocr`);
    const protocol = url.protocol === 'https:' ? https : http;

    const payload: any = {
      model,
      document: {
        type: 'document_url',
        document_url: documentUrl,
      },
    };

    if (tableFormat) {
      payload.table_format = tableFormat;
    }

    const body = JSON.stringify(payload);

    const req = protocol.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          Authorization: `Bearer ${apiKey}`,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`API error: ${res.statusCode} ${data}`));
          } else {
            resolve(JSON.parse(data) as OcrResponse);
          }
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
