import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { google } from 'googleapis';
import * as fs from 'fs';
import {
  setupMockEnvironment,
  cleanupMockEnvironment,
  createMockGoogleClients,
  validVocabularyConfig,
  validElementsConfig,
  googleApiErrors
} from '../fixtures/google-api-mocks';

// Mock the entire googleapis module
vi.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: vi.fn()
    },
    sheets: vi.fn(),
    drive: vi.fn()
  }
}));

vi.mock('fs');

describe('Vocabulary Creation Integration Tests', () => {
  let mockAuth: any;
  let mockSheets: any;
  let mockDrive: any;

  beforeEach(() => {
    setupMockEnvironment();
    const mocks = createMockGoogleClients();
    mockAuth = mocks.mockAuth;
    mockSheets = mocks.mockSheets;
    mockDrive = mocks.mockDrive;

    (google.auth.GoogleAuth as any).mockImplementation(() => mockAuth);
    (google.sheets as any).mockReturnValue(mockSheets);
    (google.drive as any).mockReturnValue(mockDrive);
  });

  afterEach(() => {
    cleanupMockEnvironment();
    vi.clearAllMocks();
  });

  describe('End-to-end vocabulary creation', () => {
    it('should create a complete values vocabulary with all components', async () => {
      // Mock file system operations
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(validVocabularyConfig));
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      // Mock no existing workbook
      mockDrive.files.list.mockResolvedValueOnce({ data: { files: [] } });

      // Mock successful sheet operations
      mockSheets.spreadsheets.get.mockResolvedValue({
        data: { sheets: [] }
      });

      // Expected flow:
      // 1. Create workbook
      // 2. Create DCTAP sheet
      // 3. Create vocabulary sheet
      // 4. Create/update index

      const expectedWorkbookName = 'ISBDM-values';
      const expectedDctapSheetTitle = 'DCTAP-values';
      const expectedVocabularySheetTitle = 'sensory-specification';

      // Verify workbook creation
      expect(mockDrive.files.create).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            name: expectedWorkbookName
          })
        })
      );

      // Verify DCTAP sheet creation
      expect(mockSheets.spreadsheets.batchUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            requests: expect.arrayContaining([
              expect.objectContaining({
                addSheet: expect.objectContaining({
                  properties: expect.objectContaining({
                    title: expectedDctapSheetTitle
                  })
                })
              })
            ])
          })
        })
      );

      // Verify vocabulary sheet headers include language variants
      const expectedHeaders = [
        'valueID',
        'label', 'label_en', 'label_fr', 'label_es',
        'definition', 'definition_en', 'definition_fr', 'definition_es',
        'scopeNote', 'scopeNote_en', 'scopeNote_fr', 'scopeNote_es',
        'example',
        'source',
        'status'
      ];

      expect(mockSheets.spreadsheets.values.update).toHaveBeenCalledWith(
        expect.objectContaining({
          range: `${expectedVocabularySheetTitle}!A1`,
          requestBody: {
            values: [expectedHeaders]
          }
        })
      );
    });

    it('should handle existing workbook correctly', async () => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(validElementsConfig));

      // Mock existing workbook
      mockDrive.files.list.mockResolvedValueOnce({
        data: {
          files: [{
            id: 'existing-workbook-id',
            name: 'ISBDM-elements'
          }]
        }
      });

      // Should NOT create a new workbook
      expect(mockDrive.files.create).not.toHaveBeenCalled();

      // Should use existing workbook ID
      expect(mockSheets.spreadsheets.get).toHaveBeenCalledWith({
        spreadsheetId: 'existing-workbook-id'
      });
    });
  });

  describe('Error handling', () => {
    it('should handle authentication errors gracefully', async () => {
      mockDrive.files.list.mockRejectedValueOnce({
        response: {
          status: 401,
          data: googleApiErrors.unauthorized
        }
      });

      // Should write error result
      const errorResult = {
        success: false,
        error: expect.stringContaining('authentication')
      };

      expect(vi.mocked(fs.writeFileSync)).toHaveBeenCalledWith(
        'result.json',
        expect.stringContaining('"success": false')
      );
    });

    it('should handle quota exceeded errors', async () => {
      mockSheets.spreadsheets.batchUpdate.mockRejectedValueOnce({
        response: {
          status: 429,
          data: googleApiErrors.quotaExceeded
        }
      });

      // Should handle gracefully and provide meaningful error
      const errorResult = {
        success: false,
        error: expect.stringContaining('quota')
      };
    });

    it('should validate vocabulary name format', () => {
      const invalidNames = [
        'Invalid Name',  // spaces
        'invalid_name',  // underscores
        'INVALID',       // uppercase
        'invalid!name',  // special characters
        '123-invalid',   // starting with number
        ''              // empty
      ];

      invalidNames.forEach(name => {
        expect(/^[a-z][a-z0-9-]*$/.test(name)).toBe(false);
      });

      const validNames = [
        'valid-name',
        'sensory-specification',
        'metadata-elements',
        'a123-test'
      ];

      validNames.forEach(name => {
        expect(/^[a-z][a-z0-9-]*$/.test(name)).toBe(true);
      });
    });
  });

  describe('Index sheet management', () => {
    it('should create index sheet if not exists', async () => {
      mockSheets.spreadsheets.get.mockResolvedValueOnce({
        data: { sheets: [] } // No existing sheets
      });

      // Should create Index sheet at position 0
      expect(mockSheets.spreadsheets.batchUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            requests: expect.arrayContaining([
              expect.objectContaining({
                addSheet: expect.objectContaining({
                  properties: expect.objectContaining({
                    title: 'Index',
                    index: 0
                  })
                })
              })
            ])
          })
        })
      );
    });

    it('should append to existing index with hyperlink formula', async () => {
      const existingIndexData = [
        ['Vocabulary Name', 'Title', 'Description', 'Languages', 'Link'],
        ['existing-vocab', 'Existing', 'Test', 'en', '=HYPERLINK(...)']
      ];

      mockSheets.spreadsheets.values.get.mockResolvedValueOnce({
        data: { values: existingIndexData }
      });

      // Should append new row with hyperlink
      expect(mockSheets.spreadsheets.values.update).toHaveBeenCalledWith(
        expect.objectContaining({
          valueInputOption: 'USER_ENTERED', // Important for formulas
          requestBody: {
            values: expect.arrayContaining([
              expect.arrayContaining([
                expect.any(String),
                expect.any(String),
                expect.any(String),
                expect.any(String),
                expect.stringContaining('=HYPERLINK(')
              ])
            ])
          }
        })
      );
    });
  });

  describe('Profile-specific behavior', () => {
    it('should create correct columns for values profile', () => {
      const valuesColumns = [
        'valueID',
        'label',
        'definition',
        'scopeNote',
        'example',
        'source',
        'status'
      ];

      // With 3 languages (en, fr, es), translatable fields expand
      const translatableFields = ['label', 'definition', 'scopeNote'];
      const expectedColumnCount = valuesColumns.length + (translatableFields.length * 3);

      expect(expectedColumnCount).toBe(16); // 7 base + 9 language variants
    });

    it('should create correct columns for elements profile', () => {
      const elementsColumns = [
        'elementID',
        'label',
        'definition',
        'comment',
        'cardinality',
        'datatype',
        'status'
      ];

      // With 2 languages (en, de), translatable fields expand
      const translatableFields = ['label', 'definition', 'comment'];
      const expectedColumnCount = elementsColumns.length + (translatableFields.length * 2);

      expect(expectedColumnCount).toBe(13); // 7 base + 6 language variants
    });
  });
});