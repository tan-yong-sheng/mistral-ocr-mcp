import https from 'https';
import http from 'http';
import fs from 'fs';
import { TtsResponse } from './types.js';

export type AudioFormat = 'mp3' | 'wav' | 'pcm' | 'flac' | 'opus';

export async function generateSpeech(
  baseUrl: string,
  apiKey: string,
  text: string,
  voiceId?: string,
  refAudioPath?: string,
  format: AudioFormat = 'mp3'
): Promise<TtsResponse> {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(`${baseUrl}/audio/speech`);
      const protocol = url.protocol === 'https:' ? https : http;

      const payload: Record<string, unknown> = {
        model: 'voxtral-mini-tts-2603',
        input: text,
        response_format: format,
      };

      if (voiceId) {
        payload.voice_id = voiceId;
      } else if (refAudioPath) {
        if (!fs.existsSync(refAudioPath)) {
          reject(new Error(`Reference audio file not found: ${refAudioPath}`));
          return;
        }
        const audioBuffer = fs.readFileSync(refAudioPath);
        payload.ref_audio = audioBuffer.toString('base64');
      } else {
        reject(new Error('Either voice_id or ref_audio required'));
        return;
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
              reject(new Error(`TTS API error: ${res.statusCode} ${data}`));
            } else {
              const response = JSON.parse(data) as TtsResponse;
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
