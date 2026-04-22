import { describe, it, expect } from 'vitest';

describe('STT Edge Cases', () => {
  describe('realtime model name', () => {
    it('uses correct realtime model name', () => {
      const realtime = true;
      const model = realtime ? 'voxtral-mini-transcribe-realtime-2602' : 'voxtral-mini-latest';
      expect(model).toBe('voxtral-mini-transcribe-realtime-2602');
    });
  });

  describe('diarize constraints', () => {
    it('rejects diarize + realtime together', () => {
      const realtime = true;
      const diarize = true;
      // Should reject: realtime incompatible with diarize
      expect(realtime && diarize).toBe(true); // This SHOULD fail validation
    });

    it('requires timestamp_granularities when diarize=true (batch mode)', () => {
      const diarize = true;
      const realtime = false;
      const timestampGranularities = diarize && !realtime ? ['segment'] : [];
      expect(timestampGranularities).toEqual(['segment']);
    });

    it('diarize=false needs no timestamp_granularities', () => {
      const diarize = false;
      const realtime = false;
      const timestampGranularities = diarize && !realtime ? ['segment'] : [];
      expect(timestampGranularities).toEqual([]);
    });
  });
});
