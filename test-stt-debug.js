import { transcribeAudio } from './dist/tools/stt.js';

const apiKey = process.env.MISTRAL_API_KEY || 'test-key';
const baseUrl = process.env.MISTRAL_BASE_URL || 'https://api.mistral.ai/v1';

// Test w/ invalid URL
transcribeAudio(baseUrl, apiKey, 'https://invalid-domain-12345.com/audio.wav', false, 'en')
  .then((res) => console.log('Success:', res))
  .catch((err) => console.error('Error:', err.message));
