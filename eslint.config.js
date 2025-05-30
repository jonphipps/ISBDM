// eslint.config.js - ESLint v9 flat config
const docusaurusPlugin = require('@docusaurus/eslint-plugin');
const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');

module.exports = [
  {
    ignores: [
      'build/**', 
      '.docusaurus/**', 
      '.yarn/**', 
      'node_modules/**',
      '.history/**',
      'src/tests/fixtures/**',
      '*.expected.md',
      '*.generated.md',
      '*.output.md'
    ]
  },
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      '@docusaurus': docusaurusPlugin
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      // Docusaurus rules
      '@docusaurus/string-literal-i18n-messages': 'error',
      '@docusaurus/no-untranslated-text': 'warn',
      // Turn off rules that don't work well with MDX content in general
      'react/jsx-no-undef': 'off',
      'no-unused-expressions': 'off'
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@docusaurus': docusaurusPlugin,
      '@typescript-eslint': typescriptEslint
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      // Docusaurus rules
      '@docusaurus/string-literal-i18n-messages': 'error',
      '@docusaurus/no-untranslated-text': 'warn',
      // Turn off rules that don't work well with MDX content in general
      'react/jsx-no-undef': 'off',
      'no-unused-expressions': 'off'
    }
  },
  {
    files: ['**/*.mdx', '**/*.md'],
    rules: {
      // Turn off specific rules for MDX files
      'semi': 'off',
      'quotes': 'off',
      'mdx/no-unused-expressions': 'off'
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    }
  }
];