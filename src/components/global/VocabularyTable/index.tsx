// Main component exports
export { VocabularyTable as default, VocabularyTable } from './VocabularyTable';
export { CSVVocabulary, VocabularyTableFromCSV } from './CSVVocabulary';

// Type exports
export type {
  VocabularyTableProps,
  ConceptProps,
  MultilingualText,
  LanguageConfig,
  CSVConceptRow,
  TOCItem,
  UriCaseStyle,
  RDFMetadata
} from './types';

// Also export DEFAULT_LANGUAGE_CONFIG from types
export { DEFAULT_LANGUAGE_CONFIG } from './types';

// Utility exports
export {
  getLocalizedText,
  getAllLocalizedText,
  parseCSVToConcepts,
  createSlug,
  extractAvailableLanguages,
  generateTOCFromProps,
  exportToCSV
} from './utils';

// Hook exports
export { useCsvLoader } from './hooks/useCsvLoader';
export { useMultilingualText } from './hooks/useMultilingualText';