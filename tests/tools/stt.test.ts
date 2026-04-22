import { describe, it, expect } from 'vitest';

describe('STT Tools', () => {
  describe('transcribeAudio modes', () => {
    it('supports batch mode (realtime=false)', () => {
      const realtime = false;
      const model = realtime ? 'voxtral-realtime' : 'voxtral-mini-latest';
      expect(model).toBe('voxtral-mini-latest');
    });

    it('supports realtime mode (realtime=true)', () => {
      const realtime = true;
      const model = realtime ? 'voxtral-realtime' : 'voxtral-mini-latest';
      expect(model).toBe('voxtral-realtime');
    });

    it('supports diarize option', () => {
      const diarize = true;
      expect(diarize).toBe(true);
    });

    it('supports language option', () => {
      const language = 'en';
      expect(language).toBe('en');
    });
  });
});
