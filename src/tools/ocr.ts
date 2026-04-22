import https from 'https';
import http from 'http';
import { OcrResponse } from './types.js';

export const SUPPORTED_DOCS = ['pdf', 'pptx', 'docx', 'xlsx'];
export const SUPPORTED_IMAGES = ['png', 'jpeg', 'jpg', 'avif'];

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

    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: application/pdf\r\n\r\n`
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

export function validateDocumentType(filePath: string): boolean {
  const ext = filePath.split('.').pop()?.toLowerCase();
  return ext ? [...SUPPORTED_DOCS, ...SUPPORTED_IMAGES].includes(ext) : false;
}
