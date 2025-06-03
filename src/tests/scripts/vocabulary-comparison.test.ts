/**
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { VocabularyComparisonTool } from '../../../scripts/vocabulary-comparison.mjs';
import { writeFileSync, existsSync, mkdirSync } from 'fs';

// Mock dependencies
vi.mock('fs', () => ({
    writeFileSync: vi.fn(),
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn()
}));

// Mock fetch globally
const mockFetch = vi.fn() as Mock;
global.fetch = mockFetch;

describe('VocabularyComparisonTool', () => {
    let tool: any;
    const mockApiKey = 'test-api-key';
    const mockSpreadsheetId = 'test-spreadsheet-id';

    beforeEach(() => {
        vi.clearAllMocks();
        tool = new VocabularyComparisonTool(mockApiKey, mockSpreadsheetId, {
            indexSheet: 'index',
            skipRdfCheck: true,
            markdown: false
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should initialize with correct default options', () => {
            const defaultTool = new VocabularyComparisonTool(mockApiKey, mockSpreadsheetId);
            
            expect(defaultTool.apiKey).toBe(mockApiKey);
            expect(defaultTool.spreadsheetId).toBe(mockSpreadsheetId);
            expect(defaultTool.options.indexSheet).toBe('index');
            expect(defaultTool.options.skipRdfCheck).toBe(false);
            expect(defaultTool.options.markdown).toBe(false);
            expect(defaultTool.options.outputPath).toBe('tmp/vocabulary-comparison-report.md');
        });

        it('should override default options with provided ones', () => {
            const customTool = new VocabularyComparisonTool(mockApiKey, mockSpreadsheetId, {
                indexSheet: 'custom-index',
                skipRdfCheck: true,
                markdown: true,
                outputPath: 'custom/output.md'
            });

            expect(customTool.options.indexSheet).toBe('custom-index');
            expect(customTool.options.skipRdfCheck).toBe(true);
            expect(customTool.options.markdown).toBe(true);
            expect(customTool.options.outputPath).toBe('custom/output.md');
        });
    });

    describe('getAvailableSheets', () => {
        it('should fetch and parse available sheets', async () => {
            const mockResponse = {
                ok: true,
                json: vi.fn().mockResolvedValue({
                    sheets: [
                        { properties: { title: 'Sheet1', sheetId: 123 } },
                        { properties: { title: 'Sheet2', sheetId: 456 } }
                    ]
                })
            };
            mockFetch.mockResolvedValueOnce(mockResponse);

            const result = await tool.getAvailableSheets();

            expect(result).toEqual([
                { title: 'Sheet1', sheetId: 123 },
                { title: 'Sheet2', sheetId: 456 }
            ]);
        });

        it('should throw error on failed API call', async () => {
            const mockResponse = {
                ok: false,
                statusText: 'Unauthorized'
            };
            mockFetch.mockResolvedValueOnce(mockResponse);

            await expect(tool.getAvailableSheets()).rejects.toThrow(
                'Failed to fetch spreadsheet metadata: Unauthorized'
            );
        });
    });

    describe('findMatchingSheet', () => {
        const availableSheets = [
            { title: 'index', sheetId: 1 },
            { title: 'unc_elements', sheetId: 2 },
            { title: 'elements', sheetId: 3 },
            { title: 'ISBD elements', sheetId: 4 }
        ];

        it('should find exact token match', () => {
            const result = tool.findMatchingSheet(availableSheets, 'elements', '');
            expect(result).toEqual({ title: 'elements', sheetId: 3 });
        });

        it('should find exact title match', () => {
            const result = tool.findMatchingSheet(availableSheets, 'test', 'ISBD elements');
            expect(result).toEqual({ title: 'ISBD elements', sheetId: 4 });
        });

        it('should find isbdu pattern match', () => {
            const result = tool.findMatchingSheet(availableSheets, 'isbdu', '');
            expect(result).toEqual({ title: 'unc_elements', sheetId: 2 });
        });

        it('should find isbd pattern match (not unconstrained)', () => {
            const result = tool.findMatchingSheet(availableSheets, 'isbd', '');
            expect(result).toEqual({ title: 'elements', sheetId: 3 });
        });

        it('should return null for no matches', () => {
            const result = tool.findMatchingSheet(availableSheets, 'nonexistent', '');
            expect(result).toBeUndefined();
        });
    });

    describe('parseColumnHeader', () => {
        it('should parse basic header', () => {
            const result = tool.parseColumnHeader('skos:prefLabel');
            expect(result).toEqual({
                property: 'skos:prefLabel',
                language: null,
                index: 0,
                original: 'skos:prefLabel'
            });
        });

        it('should parse header with language', () => {
            const result = tool.parseColumnHeader('skos:prefLabel@en');
            expect(result).toEqual({
                property: 'skos:prefLabel',
                language: 'en',
                index: 0,
                original: 'skos:prefLabel@en'
            });
        });

        it('should parse header with language and index', () => {
            const result = tool.parseColumnHeader('skos:altLabel@es[2]');
            expect(result).toEqual({
                property: 'skos:altLabel',
                language: 'es',
                index: 2,
                original: 'skos:altLabel@es[2]'
            });
        });

        it('should parse header with index only', () => {
            const result = tool.parseColumnHeader('skos:notation[1]');
            expect(result).toEqual({
                property: 'skos:notation',
                language: null,
                index: 1,
                original: 'skos:notation[1]'
            });
        });

        it('should return null for empty header', () => {
            const result = tool.parseColumnHeader('');
            expect(result).toBeNull();
        });
    });

    describe('organizeColumns', () => {
        it('should organize columns by property and language', () => {
            const headers = [
                'uri',
                'skos:prefLabel@en',
                'skos:prefLabel@es',
                'skos:definition@en',
                'skos:altLabel@en[0]',
                'skos:altLabel@en[1]'
            ];

            const result = tool.organizeColumns(headers);

            expect(result.get('uri')).toBeDefined();
            expect(result.get('skos:prefLabel')).toBeDefined();
            expect(result.get('skos:prefLabel').get('en')).toEqual([1]);
            expect(result.get('skos:prefLabel').get('es')).toEqual([2]);
            expect(result.get('skos:altLabel').get('en')).toEqual([4, 5]);
        });
    });

    describe('extractPropertyValues', () => {
        const columnMap = new Map([
            ['skos:prefLabel', new Map([
                ['en', [1]],
                ['es', [2]]
            ])],
            ['skos:altLabel', new Map([
                ['en', [3, 4]]
            ])]
        ]);

        it('should extract single value for specified language', () => {
            const row = ['uri1', 'English Label', 'Spanish Label', 'Alt1', 'Alt2'];
            const result = tool.extractPropertyValues(row, columnMap.get('skos:prefLabel'), 'en');
            expect(result).toEqual(['English Label']);
        });

        it('should extract multiple values for repeatable property', () => {
            const row = ['uri1', 'English Label', 'Spanish Label', 'Alt1', 'Alt2'];
            const result = tool.extractPropertyValues(row, columnMap.get('skos:altLabel'), 'en');
            expect(result).toEqual(['Alt1', 'Alt2']);
        });

        it('should fallback to default language', () => {
            const row = ['uri1', 'English Label', 'Spanish Label', 'Alt1', 'Alt2'];
            const result = tool.extractPropertyValues(row, columnMap.get('skos:prefLabel'), 'fr');
            expect(result).toEqual(['English Label']); // Falls back to 'en'
        });
    });

    describe('expandUri', () => {
        const vocab = { uri: 'http://example.org/vocab/' };

        it('should return full URI unchanged', () => {
            const result = tool.expandUri('http://example.org/full/uri', vocab);
            expect(result).toBe('http://example.org/full/uri');
        });

        it('should expand prefixed URI', () => {
            const result = tool.expandUri('ex:concept1', vocab);
            expect(result).toBe('http://example.org/vocab/concept1');
        });

        it('should handle URI ending with slash', () => {
            const vocabWithSlash = { uri: 'http://example.org/vocab/' };
            const result = tool.expandUri('ex:concept1', vocabWithSlash);
            expect(result).toBe('http://example.org/vocab/concept1');
        });

        it('should handle URI not ending with slash', () => {
            const vocabWithoutSlash = { uri: 'http://example.org/vocab' };
            const result = tool.expandUri('ex:concept1', vocabWithoutSlash);
            expect(result).toBe('http://example.org/vocab/concept1');
        });

        it('should return unchanged for non-prefixed strings', () => {
            const result = tool.expandUri('simple-string', vocab);
            expect(result).toBe('simple-string');
        });
    });

    describe('isInstructionRow', () => {
        it('should identify instruction rows', () => {
            expect(tool.isInstructionRow('Instructions:', 'some text')).toBe(true);
            expect(tool.isInstructionRow('Example data', 'example')).toBe(true);
            expect(tool.isInstructionRow('token:with:colons', '')).toBe(true);
            expect(tool.isInstructionRow('very-long-token-name-that-exceeds-fifty-characters-in-length', '')).toBe(true);
            expect(tool.isInstructionRow('valid', 'not-a-url')).toBe(true);
        });

        it('should not identify valid data rows as instructions', () => {
            expect(tool.isInstructionRow('token', 'http://example.org')).toBe(false);
            expect(tool.isInstructionRow('valid-token', '')).toBe(false);
        });
    });

    describe('hasValidRdfUri', () => {
        it('should validate RDF URIs', () => {
            expect(tool.hasValidRdfUri('http://example.org/vocab')).toBe(true);
            expect(tool.hasValidRdfUri('https://example.org/vocab')).toBe(true);
            expect(tool.hasValidRdfUri('')).toBe(false);
            expect(tool.hasValidRdfUri('not-a-url')).toBe(false);
            expect(tool.hasValidRdfUri(null)).toBe(false);
        });
    });

    describe('validateSkosStructure', () => {
        it('should validate concepts with all required properties', () => {
            const concepts = [
                { uri: 'http://example.org/1', prefLabel: 'Label 1', definition: 'Def 1' },
                { uri: 'http://example.org/2', prefLabel: 'Label 2', definition: 'Def 2' }
            ];

            const result = tool.validateSkosStructure(concepts);
            expect(result.errors).toHaveLength(0);
            expect(result.warnings).toHaveLength(0);
        });

        it('should report missing URIs as errors', () => {
            const concepts = [
                { prefLabel: 'Label 1', definition: 'Def 1' },
                { uri: 'http://example.org/2', prefLabel: 'Label 2' }
            ];

            const result = tool.validateSkosStructure(concepts);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('Missing URI');
        });

        it('should report missing labels as warnings', () => {
            const concepts = [
                { uri: 'http://example.org/1', definition: 'Def 1' },
                { uri: 'http://example.org/2', prefLabel: 'Label 2' }
            ];

            const result = tool.validateSkosStructure(concepts);
            expect(result.warnings).toHaveLength(1);
            expect(result.warnings[0]).toContain('Missing preferred label');
        });
    });

    describe('normalizeText', () => {
        it('should normalize text correctly', () => {
            expect(tool.normalizeText('  Hello   World  ')).toBe('hello world');
            expect(tool.normalizeText('UPPERCASE')).toBe('uppercase');
            expect(tool.normalizeText('')).toBe('');
            expect(tool.normalizeText(null)).toBe('');
            expect(tool.normalizeText(undefined)).toBe('');
        });
    });

    describe('escapeMarkdown', () => {
        it('should escape markdown special characters', () => {
            expect(tool.escapeMarkdown('Text with | pipe')).toBe('Text with \\| pipe');
            expect(tool.escapeMarkdown('Text with * asterisk')).toBe('Text with \\* asterisk');
            expect(tool.escapeMarkdown('Text with [brackets]')).toBe('Text with \\[brackets\\]');
            expect(tool.escapeMarkdown('')).toBe('');
            expect(tool.escapeMarkdown(null)).toBe('');
        });
    });

    describe('truncateText', () => {
        it('should truncate long text', () => {
            const longText = 'This is a very long text that should be truncated';
            const result = tool.truncateText(longText, 20);
            expect(result).toBe('This is a very long ...');
        });

        it('should not truncate short text', () => {
            const shortText = 'Short text';
            const result = tool.truncateText(shortText, 20);
            expect(result).toBe('Short text');
        });

        it('should handle empty text', () => {
            expect(tool.truncateText('', 10)).toBe('');
            expect(tool.truncateText(null, 10)).toBe('');
        });
    });

    describe('generateMarkdownReport', () => {
        beforeEach(() => {
            tool.vocabularies = [
                {
                    token: 'test1',
                    title: 'Test Vocabulary 1',
                    sheetName: 'sheet1',
                    uri: 'http://example.org/test1',
                    hasRdf: true,
                    sheetId: 123
                },
                {
                    token: 'test2',
                    title: 'Test Vocabulary 2',
                    sheetName: 'sheet2',
                    uri: 'http://example.org/test2',
                    hasRdf: false,
                    sheetId: 456
                }
            ];

            tool.availableSheets = [
                { title: 'sheet1', sheetId: 123 },
                { title: 'sheet2', sheetId: 456 }
            ];

            tool.options.markdown = true;
            tool.options.outputPath = 'test-output.md';
        });

        it('should generate markdown report successfully', () => {
            const results = {
                matches: [
                    {
                        vocabulary: 'test1',
                        uri: 'http://example.org/concept1',
                        sheetValues: { prefLabel: 'Concept 1' }
                    }
                ],
                mismatches: [],
                missing: [],
                errors: []
            };

            tool.generateMarkdownReport(results);

            expect(writeFileSync).toHaveBeenCalledWith(
                'test-output.md',
                expect.stringContaining('# Vocabulary Comparison Report')
            );
            expect(writeFileSync).toHaveBeenCalledWith(
                'test-output.md',
                expect.stringContaining('Perfect Matches | 1')
            );
        });

        it('should include error information in report', () => {
            const results = {
                matches: [],
                mismatches: [],
                missing: [],
                errors: [
                    { vocabulary: 'test1', message: 'Test error message' }
                ]
            };

            tool.generateMarkdownReport(results);

            const markdownContent = (writeFileSync as Mock).mock.calls[0][1];
            expect(markdownContent).toContain('🚨 Errors (1)');
            expect(markdownContent).toContain('Test error message');
        });

        it('should handle mismatches in report', () => {
            const results = {
                matches: [],
                mismatches: [
                    {
                        vocabulary: 'test1',
                        uri: 'http://example.org/concept1',
                        rowIndex: 2,
                        prefLabelMatch: false,
                        definitionMatch: true,
                        notationMatch: true,
                        sheetValues: {
                            prefLabel: 'Sheet Label',
                            definition: 'Sheet Definition',
                            notation: 'SN1'
                        },
                        rdfValues: {
                            prefLabel: 'RDF Label',
                            definition: 'Sheet Definition',
                            notation: 'SN1'
                        }
                    }
                ],
                missing: [],
                errors: []
            };

            tool.generateMarkdownReport(results);

            const markdownContent = (writeFileSync as Mock).mock.calls[0][1];
            expect(markdownContent).toContain('⚠️ Mismatches (1)');
            expect(markdownContent).toContain('Sheet Label');
            expect(markdownContent).toContain('RDF Label');
        });
    });

    describe('Integration: fetchSheetData', () => {
        it('should fetch sheet data via API', async () => {
            const mockResponse = {
                ok: true,
                json: vi.fn().mockResolvedValue({
                    values: [
                        ['uri', 'skos:prefLabel@en', 'skos:definition@en'],
                        ['http://example.org/1', 'Label 1', 'Definition 1'],
                        ['http://example.org/2', 'Label 2', 'Definition 2']
                    ]
                })
            };
            mockFetch.mockResolvedValueOnce(mockResponse);

            const result = await tool.fetchSheetData('test-sheet');

            expect(result).toHaveLength(3);
            expect(result[0]).toEqual(['uri', 'skos:prefLabel@en', 'skos:definition@en']);
        });

        it('should handle API errors', async () => {
            const mockResponse = {
                ok: false,
                statusText: 'Not Found'
            };
            mockFetch.mockResolvedValueOnce(mockResponse);

            await expect(tool.fetchSheetData('nonexistent-sheet')).rejects.toThrow(
                'Failed to fetch sheet nonexistent-sheet: Not Found'
            );
        });
    });
});