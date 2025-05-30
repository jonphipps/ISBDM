# VocabularyTable Component

A comprehensive multilingual vocabulary table component for Docusaurus with CSV import/export capabilities.

## Folder Structure

```
src/components/global/VocabularyTable/
├── index.tsx                     # Main exports and public API
├── VocabularyTable.tsx          # Core component implementation
├── CSVVocabulary.tsx           # CSV wrapper components
├── types.ts                    # TypeScript interfaces and types
├── utils.ts                    # Helper functions and utilities
├── styles.module.scss          # Component styles
├── hooks/                      # Custom React hooks
│   ├── useCsvLoader.ts        # CSV file loading logic
│   └── useMultilingualText.ts # Multilingual text processing
├── __tests__/                 # Test files
│   ├── VocabularyTable.test.tsx
│   ├── VocabularyTableMultilingual.test.tsx
│   ├── VocabularyTableDefaults.test.tsx
│   ├── VocabularyTableNoDefaults.test.tsx
│   └── VocabularyTableRealExamples.test.tsx
└── README.md                  # This file
```

## Key Files

### `index.tsx`
Main export file providing the public API. Import the component from this file:

```typescript
import VocabularyTable, { 
  CSVVocabulary, 
  VocabularyTableProps 
} from '@site/src/components/global/VocabularyTable';
```

### `VocabularyTable.tsx`
Core component implementation with all the main functionality:
- Multilingual content support
- CSV file loading
- Locale-aware language detection
- Filtering and search
- Expandable details
- URI generation

### `CSVVocabulary.tsx`
Simplified wrapper components for CSV-only usage:
- `CSVVocabulary` - React component wrapper
- `VocabularyTableFromCSV` - Function-based wrapper

### `types.ts`
All TypeScript interfaces and type definitions:
- `VocabularyTableProps` - Main component props
- `ConceptProps` - Individual concept/term structure
- `MultilingualText` - Multilingual content type
- `LanguageConfig` - Language configuration
- `CSVConceptRow` - CSV data structure

### `utils.ts`
Helper functions and utilities:
- `getLocalizedText()` - Extract text in specific language
- `parseCSVToConcepts()` - Convert CSV data to concepts
- `createSlug()` - Generate URI slugs
- `extractAvailableLanguages()` - Detect languages from data
- `generateTOCFromProps()` - Generate table of contents
- `exportToCSV()` - Export vocabulary to CSV format

### `hooks/useCsvLoader.ts`
Custom hook for loading CSV files:
- Handles fetch operations
- Parses CSV with Papa Parse
- Manages loading and error states
- Returns parsed data

### `hooks/useMultilingualText.ts`
Custom hook for multilingual text processing:
- Localizes all concepts to current language
- Detects available languages
- Provides language display name function
- Manages language fallbacks

## Usage Examples

### Basic Usage
```tsx
import VocabularyTable from '@site/src/components/global/VocabularyTable';

<VocabularyTable 
  vocabularyId="my-vocab"
  title="My Vocabulary"
  description="A sample vocabulary"
  concepts={[
    {
      value: "term1",
      definition: "Definition of term 1"
    }
  ]}
/>
```

### CSV File Usage
```tsx
import VocabularyTable from '@site/src/components/global/VocabularyTable';

// Ultra-simple CSV usage
<VocabularyTable csvFile="vocabularies/csv/terms.csv" />

// With custom configuration
<VocabularyTable 
  csvFile="vocabularies/csv/terms.csv"
  showTitle={true}
  showURIs={false}
/>
```

### Multilingual Usage
```tsx
<VocabularyTable 
  vocabularyId="multilingual-vocab"
  title={{
    en: "English Title",
    fr: "Titre français",
    es: "Título español"
  }}
  description={{
    en: "English description",
    fr: "Description française",
    es: "Descripción española"
  }}
  concepts={[
    {
      value: {
        en: "term",
        fr: "terme",
        es: "término"
      },
      definition: {
        en: "English definition",
        fr: "Définition française",
        es: "Definición española"
      }
    }
  ]}
/>
```

### Using CSV Wrapper
```tsx
import { CSVVocabulary } from '@site/src/components/global/VocabularyTable';

<CSVVocabulary 
  csvFile="vocabularies/csv/terms.csv"
  title="CSV Vocabulary"
  showURIs={false}
/>
```

## Testing

The component includes comprehensive test coverage:

```bash
# Run all tests
npm test VocabularyTable

# Run specific test file
npm test VocabularyTable.test.tsx

# Run tests in watch mode
npm test VocabularyTable -- --watch
```

### Test Files
- `VocabularyTable.test.tsx` - Basic functionality tests
- `VocabularyTableMultilingual.test.tsx` - Multilingual feature tests
- `VocabularyTableDefaults.test.tsx` - Site config defaults tests
- `VocabularyTableNoDefaults.test.tsx` - Fallback behavior tests
- `VocabularyTableRealExamples.test.tsx` - Real-world usage tests

## Development

### Adding New Features

1. **Add types to `types.ts`** if new interfaces are needed
2. **Add utilities to `utils.ts`** for reusable logic
3. **Create custom hooks in `hooks/`** for complex state management
4. **Update main component in `VocabularyTable.tsx`**
5. **Add tests in `__tests__/`** for new functionality
6. **Update exports in `index.tsx`** if new public APIs are added

### Modifying Styles

All styles are in `styles.module.scss` using CSS Modules:
- Follow BEM naming convention
- Include dark mode support with `[data-theme='dark']`
- Add responsive breakpoints as needed
- Include RTL support for right-to-left languages

### Custom Hooks

The component uses custom hooks for better separation of concerns:
- `useCsvLoader` - Handles all CSV file operations
- `useMultilingualText` - Manages multilingual content processing

You can create additional hooks in the `hooks/` directory for new functionality.

## Migration from Previous Version

### If upgrading from the single-file version:

1. **Update imports:**
   ```typescript
   // Old
   import VocabularyTable from '@site/src/components/global/VocabularyTable';
   
   // New (same - no change needed!)
   import VocabularyTable from '@site/src/components/global/VocabularyTable';
   ```

2. **All existing props work the same** - no breaking changes
3. **New features are automatically available** - CSV loading, multilingual support, etc.

### Benefits of New Structure

- **Better maintainability** - Code is organized into logical modules
- **Easier testing** - Each piece can be tested independently
- **Better performance** - Custom hooks optimize re-renders
- **More extensible** - Easy to add new features without bloating main component
- **Better TypeScript support** - Dedicated types file with comprehensive interfaces
- **Reusable utilities** - Helper functions can be used in other components

## Configuration

The component respects Docusaurus site configuration:

```typescript
// docusaurus.config.ts
export default {
  customFields: {
    vocabularyDefaults: {
      prefix: "isbdm",
      startCounter: 1000,
      uriStyle: "numeric",
      caseStyle: "kebab-case",
      showFilter: true,
      filterPlaceholder: "Filter vocabulary terms...",
      showTitle: false,
      showLanguageSelector: true,
      defaultLanguage: "en",
      availableLanguages: ["en", "fr", "es", "de"]
    }
  }
};
```

All these defaults can be overridden on a per-component basis via props.
