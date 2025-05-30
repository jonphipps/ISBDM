# Component Defaults Configuration

This document explains how global defaults for components are configured in the ISBDM Docusaurus site.

## Overview

To reduce duplication in front matter across similar pages (like vocabulary tables), we use the `customFields` section in `docusaurus.config.ts` to define common default values.

## Current Configuration

```typescript
// docusaurus.config.ts
const config = {
  // ... other config
  customFields: {
    // Common defaults for vocabularies
    vocabularyDefaults: {
      prefix: "isbdm",
      startCounter: 1000, 
      uriStyle: "numeric",
      caseStyle: "kebab-case",
      showFilter: true,
      filterPlaceholder: "Filter vocabulary terms...",
      showTitle: false,
      RDF: {
        "rdf:type": ["skos:ConceptScheme"]
      }
    }
  }
};
```

## How It Works

Components that support global defaults will:

1. Access the defaults from `docusaurus.config.ts` using `useDocusaurusContext()`
2. Merge these defaults with props from the front matter
3. Allow front matter to override any default value when needed

### Example: VocabularyTable

The `VocabularyTable` component uses this approach to simplify front matter:

**Before** - Requiring all properties in front matter:
```mdx
---
vocabularyId: "1275"
title: "My Vocabulary"
prefix: "isbdm"
startCounter: 1000
uriStyle: "numeric"
caseStyle: "kebab-case"
showFilter: true
filterPlaceholder: "Filter vocabulary terms..."
showTitle: false
RDF:
  rdf:type: 
    - skos:ConceptScheme
  values:
    - value: term1
      definition: Definition of first term
---
```

**After** - Using defaults:
```mdx
---
vocabularyId: "1275" 
title: "My Vocabulary"
RDF:
  values:
    - value: term1
      definition: Definition of first term
---
```

## Adding New Defaults

When adding new default configurations:

1. Update `docusaurus.config.ts` with your new defaults
2. Modify the component to merge defaults with props
3. Document the defaults in the component's example/documentation file
4. Write comprehensive tests for your default settings
5. Update this file if adding entirely new categories of defaults

## Testing Defaults

All components using global defaults should have thorough test coverage:

1. Test with site defaults (mocking `useDocusaurusContext`)
2. Test with no site defaults (fallback to hardcoded values)
3. Test with overridden defaults
4. Test with real-world examples

See the VocabularyTable tests in `/src/tests/components/VocabularyTable*.test.tsx` as examples of comprehensive testing.

## Available Default Categories

- **vocabularyDefaults**: Common properties for vocabulary tables

## Future Considerations

This pattern can be expanded to include default configurations for:

- Element pages (attributes, relationships, statements, notes)
- Example pages
- Other reusable component configurations