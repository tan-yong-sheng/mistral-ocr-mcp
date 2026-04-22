import { describe, it, expect } from 'vitest';
import {
  validateDocumentType,
  validateFileSize,
  SUPPORTED_DOCS,
  SUPPORTED_IMAGES,
  MAX_FILE_SIZE,
} from '../../src/tools/ocr.js';

describe('OCR Tools', () => {
  describe('validateDocumentType', () => {
    describe('valid document types', () => {
      it('accepts pdf', () => {
        expect(validateDocumentType('file.pdf')).toBe(true);
      });

      it('accepts docx', () => {
        expect(validateDocumentType('file.docx')).toBe(true);
      });

      it('accepts pptx', () => {
        expect(validateDocumentType('file.pptx')).toBe(true);
      });

      it('accepts xlsx', () => {
        expect(validateDocumentType('file.xlsx')).toBe(true);
      });

      it('accepts png', () => {
        expect(validateDocumentType('file.png')).toBe(true);
      });

      it('accepts jpeg', () => {
        expect(validateDocumentType('file.jpeg')).toBe(true);
      });

      it('accepts avif', () => {
        expect(validateDocumentType('file.avif')).toBe(true);
      });
    });

    describe('invalid document types', () => {
      it('rejects txt', () => {
        expect(validateDocumentType('file.txt')).toBe(false);
      });

      it('rejects doc (old format)', () => {
        expect(validateDocumentType('file.doc')).toBe(false);
      });

      it('rejects xls (old format)', () => {
        expect(validateDocumentType('file.xls')).toBe(false);
      });

      it('rejects no extension', () => {
        expect(validateDocumentType('file')).toBe(false);
      });
    });
  });

  describe('validateFileSize', () => {
    describe('valid file sizes', () => {
      it('accepts empty file', () => {
        const result = validateFileSize(0);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('accepts 1MB file', () => {
        const result = validateFileSize(1024 * 1024);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('accepts 20MB file (max)', () => {
        const result = validateFileSize(MAX_FILE_SIZE);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    describe('invalid file sizes', () => {
      it('rejects file over 20MB', () => {
        const result = validateFileSize(MAX_FILE_SIZE + 1);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error).toContain('File too large');
      });

      it('rejects 50MB file', () => {
        const result = validateFileSize(50 * 1024 * 1024);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error).toContain('20MB');
      });
    });
  });
});
