import https from 'https';
import http from 'http';

export interface Voice {
  voice_id: string;
  name: string;
  language?: string;
}

let cachedVoices: Voice[] | null = null;

export async function listVoices(baseUrl: string, apiKey: string): Promise<Voice[]> {
  if (cachedVoices !== null) {
    return cachedVoices as Voice[];
  }

  return new Promise((resolve, reject) => {
    try {
      const url = new URL(`${baseUrl}/audio/voices`);
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
              reject(new Error(`Voices API error: ${res.statusCode} ${data}`));
            } else {
              const response = JSON.parse(data);
              cachedVoices = response.voices || [];
              resolve(cachedVoices as Voice[]);
            }
          });
        }
      );

      req.on('error', reject);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

export function clearVoicesCache(): void {
  cachedVoices = null;
}
