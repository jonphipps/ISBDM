// src/tests/fixtures/google-api-mocks.ts
// Shared mocks and fixtures for Google API tests

import { vi } from 'vitest';

export const mockServiceAccountKey = {
  type: 'service_account',
  project_id: 'test-project-12345',
  private_key_id: 'test-key-id',
  private_key: '-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY\n-----END PRIVATE KEY-----\n',
  client_email: 'test-service-account@test-project-12345.iam.gserviceaccount.com',
  client_id: '123456789',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/test-service-account%40test-project-12345.iam.gserviceaccount.com'
};

export const mockSpreadsheetResponse = {
  spreadsheetId: 'mock-spreadsheet-id',
  properties: {
    title: 'ISBDM-values',
    locale: 'en_US',
    autoRecalc: 'ON_CHANGE',
    timeZone: 'America/New_York'
  },
  sheets: [
    {
      properties: {
        sheetId: 0,
        title: 'Index',
        index: 0,
        sheetType: 'GRID',
        gridProperties: {
          rowCount: 1000,
          columnCount: 26
        }
      }
    }
  ],
  spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/mock-spreadsheet-id/edit'
};

export const mockDriveFilesListResponse = {
  kind: 'drive#fileList',
  files: [
    {
      id: 'existing-file-id',
      name: 'ISBDM-values',
      mimeType: 'application/vnd.google-apps.spreadsheet',
      createdTime: '2024-01-01T00:00:00.000Z',
      modifiedTime: '2024-01-01T00:00:00.000Z'
    }
  ]
};

export const mockDriveFileCreateResponse = {
  kind: 'drive#file',
  id: 'new-file-id',
  name: 'ISBDM-elements',
  mimeType: 'application/vnd.google-apps.spreadsheet',
  createdTime: new Date().toISOString(),
  modifiedTime: new Date().toISOString(),
  webViewLink: 'https://docs.google.com/spreadsheets/d/new-file-id/edit',
  webContentLink: null,
  parents: []
};

export const mockBatchUpdateResponse = {
  spreadsheetId: 'mock-spreadsheet-id',
  replies: [
    {
      addSheet: {
        properties: {
          sheetId: 12345,
          title: 'test-vocabulary',
          index: 1,
          sheetType: 'GRID',
          gridProperties: {
            rowCount: 1000,
            columnCount: 26
          }
        }
      }
    }
  ]
};

export const mockValuesGetResponse = {
  range: 'Index!A:E',
  majorDimension: 'ROWS',
  values: [
    ['Vocabulary Name', 'Title', 'Description', 'Languages', 'Link'],
    ['existing-vocab', 'Existing Vocabulary', 'An existing vocabulary', 'en,fr', '=HYPERLINK("https://docs.google.com/spreadsheets/d/mock-spreadsheet-id/edit#gid=11111", "Open existing-vocab")']
  ]
};

export const mockValuesUpdateResponse = {
  spreadsheetId: 'mock-spreadsheet-id',
  updatedRange: 'test-vocabulary!A1',
  updatedRows: 1,
  updatedColumns: 13,
  updatedCells: 13
};

// Mock configuration fixtures
export const validVocabularyConfig = {
  profileType: 'values' as const,
  vocabularyName: 'sensory-specification',
  title: 'Sensory Specification Vocabulary',
  description: 'A vocabulary for describing sensory characteristics in bibliographic resources',
  languages: ['en', 'fr', 'es']
};

export const validElementsConfig = {
  profileType: 'elements' as const,
  vocabularyName: 'metadata-elements',
  title: 'Metadata Elements',
  description: 'Core metadata elements for ISBDM',
  languages: ['en', 'de']
};

// Error responses
export const googleApiErrors = {
  unauthorized: {
    code: 401,
    message: 'Request had invalid authentication credentials.',
    status: 'UNAUTHENTICATED'
  },
  forbidden: {
    code: 403,
    message: 'The caller does not have permission',
    status: 'PERMISSION_DENIED'
  },
  notFound: {
    code: 404,
    message: 'Requested entity was not found.',
    status: 'NOT_FOUND'
  },
  quotaExceeded: {
    code: 429,
    message: 'Quota exceeded for quota metric',
    status: 'RESOURCE_EXHAUSTED'
  }
};

// Helper function to create mock Google API clients
export function createMockGoogleClients() {
  const mockAuth = {
    getClient: vi.fn(),
    getProjectId: vi.fn(() => 'test-project-12345'),
    getAccessToken: vi.fn(() => ({ token: 'mock-access-token' }))
  };

  const mockSheets = {
    spreadsheets: {
      get: vi.fn(() => Promise.resolve({ data: mockSpreadsheetResponse })),
      create: vi.fn(() => Promise.resolve({ data: mockSpreadsheetResponse })),
      batchUpdate: vi.fn(() => Promise.resolve({ data: mockBatchUpdateResponse })),
      values: {
        get: vi.fn(() => Promise.resolve({ data: mockValuesGetResponse })),
        update: vi.fn(() => Promise.resolve({ data: mockValuesUpdateResponse })),
        batchGet: vi.fn(),
        batchUpdate: vi.fn(),
        append: vi.fn()
      }
    }
  };

  const mockDrive = {
    files: {
      list: vi.fn(() => Promise.resolve({ data: mockDriveFilesListResponse })),
      create: vi.fn(() => Promise.resolve({ data: mockDriveFileCreateResponse })),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    permissions: {
      create: vi.fn(),
      list: vi.fn(),
      delete: vi.fn()
    }
  };

  return { mockAuth, mockSheets, mockDrive };
}

// Helper to setup environment with mock credentials
export function setupMockEnvironment() {
  process.env.GSHEETS_SA_KEY = Buffer.from(
    JSON.stringify(mockServiceAccountKey)
  ).toString('base64');
  
  process.env.GITHUB_REPOSITORY = 'test-org/ISBDM';
  process.env.GITHUB_TOKEN = 'mock-github-token';
}

// Helper to clean up environment
export function cleanupMockEnvironment() {
  delete process.env.GSHEETS_SA_KEY;
  delete process.env.GITHUB_REPOSITORY;
  delete process.env.GITHUB_TOKEN;
}