import { listLanguages } from './languages.js';

export function validateLanguageCode(code: string): { valid: boolean; error?: string } {
  const languages = listLanguages();
  const validCodes = languages.map((l) => l.code);

  if (!validCodes.includes(code)) {
    return {
      valid: false,
      error: `Invalid language code: "${code}". Supported: ${validCodes.join(', ')}`,
    };
  }

  return { valid: true };
}
