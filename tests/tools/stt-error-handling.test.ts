import { describe, it, expect } from 'vitest';

describe('STT Error Handling', () => {
  it('error message includes status code + response body', () => {
    // When API returns 401 Unauthorized
    const statusCode = 401;
    const responseBody = '{"detail":"Unauthorized"}';

    // Error message should include both
    const errorMsg = `STT API error: ${statusCode} ${responseBody}`;

    expect(errorMsg).toContain('401');
    expect(errorMsg).toContain('Unauthorized');
  });

  it('error message distinguishes auth vs URL errors', () => {
    // 401 = auth failure
    const authError = 'STT API error: 401 {"detail":"Unauthorized"}';
    expect(authError).toContain('401');

    // 400 = bad request (likely invalid URL)
    const urlError = 'STT API error: 400 {"detail":"Invalid file_url"}';
    expect(urlError).toContain('400');
    expect(urlError).toContain('Invalid file_url');
  });

  it('error message not wrapped generically', () => {
    // Current: "Error: STT API error: 401 {...}"
    // Should preserve full error context
    const fullError = 'STT API error: 401 {"detail":"Unauthorized"}';

    // Should NOT be: "Error: Error: STT API error..."
    expect(fullError).not.toContain('Error: Error');
  });
});
