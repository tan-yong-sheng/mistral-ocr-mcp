import { describe, it, expect } from 'vitest';
import { validateDocumentType, SUPPORTED_DOCS, SUPPORTED_IMAGES } from '../../src/tools/ocr.js';

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
});
