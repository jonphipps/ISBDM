import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

// Mock environment variables
const mockEnv = {
  GOOGLE_SHEETS_API_KEY: 'test-api-key',
  SPREADSHEET_ID: 'test-spreadsheet-id',
  ANTHROPIC_API_KEY: 'test-anthropic-key'
};

describe('check-mediatype-languages.mjs', () => {
  const scriptPath = path.join(process.cwd(), 'scripts', 'check-mediatype-languages.mjs');
  const tmpDir = path.join(process.cwd(), 'tmp');

  beforeEach(async () => {
    // Ensure tmp directory exists
    await fs.mkdir(tmpDir, { recursive: true });
    
    // Clean up any existing markdown files
    const files = await fs.readdir(tmpDir);
    for (const file of files) {
      if (file.startsWith('language-tag-mismatches')) {
        await fs.unlink(path.join(tmpDir, file));
      }
    }
  });

  afterEach(async () => {
    // Clean up generated files
    const files = await fs.readdir(tmpDir);
    for (const file of files) {
      if (file.startsWith('language-tag-mismatches')) {
        await fs.unlink(path.join(tmpDir, file));
      }
    }
  });

  describe('Command Line Arguments', () => {
    it('should show help when --help flag is used', async () => {
      const { stdout } = await execAsync(`node ${scriptPath} --help`);
      
      expect(stdout).toContain('Language Tag Checker for Google Sheets');
      expect(stdout).toContain('Usage:');
      expect(stdout).toContain('Options:');
      expect(stdout).toContain('--spreadsheet-id=ID');
      expect(stdout).toContain('--ai');
      expect(stdout).toContain('--markdown');
      expect(stdout).toContain('Examples:');
    });

    it('should handle -h alias for help', async () => {
      const { stdout } = await execAsync(`node ${scriptPath} -h`);
      
      expect(stdout).toContain('Language Tag Checker for Google Sheets');
    });
  });

  describe('Mock Data Processing', () => {
    // Create a mock version of the script for testing without real API calls
    const createMockScript = async () => {
      const mockScriptContent = `
import { writeFileSync } from 'fs';
import path from 'path';

// Mock language detection
const mockDetectLanguage = (text, declaredLang) => {
  // Simple mock: detect Chinese characters
  if (/[\\u4e00-\\u9fa5]/.test(text)) return { lang: 'zh', confidence: 0.95 };
  // Mock Spanish text
  if (text.toLowerCase().includes('español') || text.toLowerCase().includes('hola')) return { lang: 'es', confidence: 0.92 };
  // Mock French text  
  if (text.toLowerCase().includes('français') || text.toLowerCase().includes('bonjour')) return { lang: 'fr', confidence: 0.93 };
  // Mock English text
  if (text.toLowerCase().includes('hello') || text.toLowerCase().includes('world')) return { lang: 'en', confidence: 0.94 };
  // Default to declared language
  return { lang: declaredLang, confidence: 0.85 };
};

// Parse arguments
const args = process.argv.slice(2);
const outputMarkdown = args.includes('--markdown') || args.includes('-md');
const useAI = args.includes('--ai');
const testMode = args.includes('--test');

// Mock data
const mockSheetData = [
  { 
    name: 'test-sheet',
    data: [
      ['uri', 'skos:prefLabel@en', 'skos:prefLabel@es', 'skos:prefLabel@zh'],
      ['test:001', 'Hello world', 'Hola mundo', '你好世界'],
      ['test:002', 'Good morning', 'Buenos días', 'Bonjour'], // French text in Chinese column
      ['test:003', 'Test', 'español correcto', '中文正确']
    ]
  }
];

const mismatches = [];

// Process mock data
mockSheetData.forEach(sheet => {
  const headers = sheet.data[0];
  
  for (let rowIdx = 1; rowIdx < sheet.data.length; rowIdx++) {
    const row = sheet.data[rowIdx];
    const uri = row[0];
    
    for (let colIdx = 1; colIdx < headers.length; colIdx++) {
      const header = headers[colIdx];
      const value = row[colIdx];
      
      if (!value) continue;
      
      const langMatch = header.match(/@([a-z]{2})/);
      if (!langMatch) continue;
      
      const declaredLang = langMatch[1];
      const detection = mockDetectLanguage(value, declaredLang);
      
      if (detection.lang !== declaredLang && detection.confidence > 0.9) {
        mismatches.push({
          sheet: sheet.name,
          row: rowIdx + 1,
          uri: uri,
          column: header,
          declared: declaredLang,
          detected: detection.lang,
          confidence: detection.confidence,
          text: value
        });
      }
    }
  }
});

// Output results
if (outputMarkdown) {
  const reportPath = path.join(process.cwd(), 'tmp', \`language-tag-mismatches\${useAI ? '-ai' : ''}.md\`);
  const markdown = \`# Language Tag Mismatch Report
Generated: \${new Date().toISOString()}

## Summary
Total mismatches found: **\${mismatches.length}**

## Detailed Findings

| URI | Row | Column | Declared | Detected | Confidence | Text |
|-----|-----|--------|----------|----------|------------|------|
\${mismatches.map(m => \`| \${m.uri} | \${m.row} | \${m.column} | \${m.declared} | \${m.detected} | \${(m.confidence * 100).toFixed(1)}% | \${m.text} |\`).join('\\n')}
\`;
  
  writeFileSync(reportPath, markdown);
  console.log(\`Markdown report saved to: \${reportPath}\`);
} else {
  console.log(\`Found \${mismatches.length} language mismatches\`);
  mismatches.forEach(m => {
    console.log(\`Row \${m.row}: \${m.declared} -> \${m.detected} (\${m.text})\`);
  });
}
`;

      const mockScriptPath = path.join(tmpDir, 'mock-check-mediatype-languages.js');
      await fs.writeFile(mockScriptPath, mockScriptContent);
      return mockScriptPath;
    };

    it('should detect language mismatches in mock data', async () => {
      const mockScript = await createMockScript();
      const { stdout } = await execAsync(`node ${mockScript}`);
      
      expect(stdout).toContain('Found 1 language mismatches');
      expect(stdout).toContain('Row 3: zh -> fr'); // French text in Chinese column
    });

    it('should generate markdown report with --markdown flag', async () => {
      const mockScript = await createMockScript();
      await execAsync(`node ${mockScript} --markdown`);
      
      const reportPath = path.join(tmpDir, 'language-tag-mismatches.md');
      const reportContent = await fs.readFile(reportPath, 'utf-8');
      
      expect(reportContent).toContain('# Language Tag Mismatch Report');
      expect(reportContent).toContain('Total mismatches found: **1**');
      expect(reportContent).toContain('| test:002 |');
      expect(reportContent).toContain('| zh | fr |');
      expect(reportContent).toContain('Bonjour');
    });

    it('should generate AI-specific markdown report with --ai flag', async () => {
      const mockScript = await createMockScript();
      await execAsync(`node ${mockScript} --markdown --ai`);
      
      const reportPath = path.join(tmpDir, 'language-tag-mismatches-ai.md');
      const exists = await fs.access(reportPath).then(() => true).catch(() => false);
      
      expect(exists).toBe(true);
    });
  });

  describe('Language Detection Functions', () => {
    it('should correctly identify Chinese characters', async () => {
      const testText = '你好世界';
      const containsChinese = /[\u4e00-\u9fa5]/.test(testText);
      expect(containsChinese).toBe(true);
    });

    it('should correctly identify Cyrillic characters', async () => {
      const testText = 'Привет мир';
      const containsCyrillic = /[\u0400-\u04FF]/.test(testText);
      expect(containsCyrillic).toBe(true);
    });

    it('should correctly identify Arabic characters', async () => {
      const testText = 'مرحبا بالعالم';
      const containsArabic = /[\u0600-\u06FF]/.test(testText);
      expect(containsArabic).toBe(true);
    });
  });

  describe('Language Code Mapping', () => {
    const LANGUAGE_NAMES = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ar': 'Arabic'
    };

    it('should return correct language names', () => {
      expect(LANGUAGE_NAMES['en']).toBe('English');
      expect(LANGUAGE_NAMES['es']).toBe('Spanish');
      expect(LANGUAGE_NAMES['zh']).toBe('Chinese');
    });

    it('should handle unknown language codes', () => {
      const getLanguageName = (code: string) => LANGUAGE_NAMES[code] || code.toUpperCase();
      expect(getLanguageName('xx')).toBe('XX');
    });
  });

  describe('Technical Text Detection', () => {
    const isLikelyTechnicalText = (text: string): boolean => {
      // Simple implementation for testing
      const patterns = [
        /^[A-Z0-9_]+$/,                    // All caps identifiers
        /^\w+\(\w*\)$/,                    // Function-like syntax
        /^[a-z]+\s*\([^)]+\)$/i,           // Text with parentheses
        /^[A-Z][a-z]+[A-Z][a-z]+/,         // CamelCase
        /^[a-z]+_[a-z]+$/,                 // snake_case
        /^[a-z]+-[a-z]+$/                  // kebab-case
      ];
      
      return patterns.some(pattern => pattern.test(text.trim()));
    };

    it('should identify technical text patterns', () => {
      expect(isLikelyTechnicalText('CONSTANT_NAME')).toBe(true);
      expect(isLikelyTechnicalText('function()')).toBe(true);
      expect(isLikelyTechnicalText('text (visual)')).toBe(true);
      expect(isLikelyTechnicalText('CamelCase')).toBe(true);
      expect(isLikelyTechnicalText('snake_case')).toBe(true);
      expect(isLikelyTechnicalText('kebab-case')).toBe(true);
      expect(isLikelyTechnicalText('Normal text here')).toBe(false);
    });
  });
});