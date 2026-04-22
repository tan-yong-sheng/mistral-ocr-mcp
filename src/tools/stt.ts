import https from 'https';
import http from 'http';
import fs from 'fs';
import { SttResponse } from './types.js';

export async function transcribeAudio(
  baseUrl: string,
  apiKey: string,
  audioSource: string,
  realtime: boolean = false,
  diarize: boolean = false,
  language?: string
): Promise<SttResponse> {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(`${baseUrl}/audio/transcriptions`);
      const protocol = url.protocol === 'https:' ? https : http;

      const model = realtime ? 'voxtral-realtime' : 'voxtral-mini-latest';

      const payload: Record<string, unknown> = {
        model,
        diarize,
      };

      if (language) {
        payload.language = language;
      }

      if (audioSource.startsWith('http://') || audioSource.startsWith('https://')) {
        payload.file_url = audioSource;
      } else {
        if (!fs.existsSync(audioSource)) {
          reject(new Error(`Audio file not found: ${audioSource}`));
          return;
        }
        const audioBuffer = fs.readFileSync(audioSource);
        payload.file = audioBuffer.toString('base64');
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
