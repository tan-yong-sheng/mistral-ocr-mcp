import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { SttResponse } from './types.js';

export async function transcribeAudio(
  baseUrl: string,
  apiKey: string,
  audioSource: string,
  diarize: boolean = false,
  language?: string,
  model: string = 'voxtral-mini-latest'
): Promise<SttResponse> {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(`${baseUrl}/audio/transcriptions`);
      const protocol = url.protocol === 'https:' ? https : http;

      // Batch transcription only. Realtime requires WebSocket/streaming.

      // Build multipart/form-data body
      const boundary = '----FormBoundary' + Date.now();
      const parts: Buffer[] = [];

      // Add model field
      parts.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\n${model}\r\n`
        )
      );

      // Add diarize field
      parts.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="diarize"\r\n\r\n${diarize ? 'true' : 'false'}\r\n`
        )
      );

      // Add timestamp_granularities when diarize=true (batch mode only)
      if (diarize) {
        parts.push(
          Buffer.from(
            `--${boundary}\r\nContent-Disposition: form-data; name="timestamp_granularities"\r\n\r\nsegment\r\n`
          )
        );
      }

      // Add language if provided
      if (language) {
        parts.push(
          Buffer.from(
            `--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\n${language}\r\n`
          )
        );
      }

      // Add file or file_url
      if (audioSource.startsWith('http://') || audioSource.startsWith('https://')) {
        parts.push(
          Buffer.from(
            `--${boundary}\r\nContent-Disposition: form-data; name="file_url"\r\n\r\n${audioSource}\r\n`
          )
        );
      } else {
        if (!fs.existsSync(audioSource)) {
          reject(new Error(`Audio file not found: ${audioSource}`));
          return;
        }
        const audioBuffer = fs.readFileSync(audioSource);
        const fileName = path.basename(audioSource);
        parts.push(
          Buffer.from(
            `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: audio/mpeg\r\n\r\n`
          )
        );
        parts.push(audioBuffer);
        parts.push(Buffer.from('\r\n'));
      }

      // Add closing boundary
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
              console.error(`[STT] API error ${res.statusCode}:`, data);
              reject(new Error(`STT API error: ${res.statusCode} ${data}`));
            } else {
              const response = JSON.parse(data) as SttResponse;
              resolve(response);
            }
          });
        }
      );

      req.on('error', reject);
      req.write(body);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}
