# Proposed VocabularyTable Component Changes

## SKOS Data Model Alignment

Based on our review of the values profile and the current component implementation, we need to better align the VocabularyTable component with the SKOS data model:

1. Each vocabulary is a `skos:ConceptScheme`
2. Each term/value is a `skos:Concept`
3. The relationships are:
   - Each concept connects to its scheme via `skos:inScheme`
   - Each scheme connects to its top concepts via `skos:hasTopConcept`
   - Each concept can connect back to its scheme via `skos:topConceptOf`

## Component Property Categories

We should clearly separate three types of properties:

1. **Component Configuration** - Properties that only affect the UI display but don't appear in RDF:
   - `startCounter`
   - `uriStyle`
   - `caseStyle`
   - `showTitle`
   - `showFilter`
   - `filterPlaceholder`

2. **ConceptScheme Properties** - Properties of the vocabulary as a whole:
   - `vocabularyId`
   - `title` (maps to `skos:prefLabel` in RDF)
   - `prefix`
   - `uri` (the URI of the ConceptScheme)
   - `description` (maps to `skos:definition` in RDF)
   - `scopeNote` (maps to `skos:scopeNote` in RDF)
   - `isDefinedBy`

3. **Concept Properties** - Properties of individual terms:
   - `uri` (generated from vocabularyId and term value)
   - `value` (maps to `skos:prefLabel` in RDF)
   - `definition` (maps to `skos:definition` in RDF)
   - `scopeNote` (maps to `skos:scopeNote` in RDF)
   - Additional notes properties
   - The `skos:inScheme` relationship will be automatically generated

## Interface Updates

The TypeScript interfaces should be updated to reflect this separation:

```typescript
// Component configuration properties
export interface VocabularyComponentConfig {
  startCounter?: number;
  uriStyle?: 'numeric' | 'slug';
  caseStyle?: UriCaseStyle;
  showTitle?: boolean;
  showFilter?: boolean;
  filterPlaceholder?: string;
}

// ConceptScheme properties
export interface ConceptSchemeProps {
  vocabularyId: string;
  title: string;
  prefix?: string;
  uri: string;
  description: string;
  scopeNote?: string;
  isDefinedBy?: string;
  'rdf:type'?: string[];  // Should always include 'skos:ConceptScheme'
  'skos:prefLabel'?: { [lang: string]: string };
  'skos:definition'?: { [lang: string]: string };
  'skos:scopeNote'?: { [lang: string]: string };
  // Other SKOS documentation properties...
}

// Concept properties
export interface ConceptProps {
  value: string;  // Maps to skos:prefLabel
  definition: string;  // Maps to skos:definition
  scopeNote?: string;  // Maps to skos:scopeNote
  notation?: string;
  example?: string;
  changeNote?: string;
  historyNote?: string;
  editorialNote?: string;
  // Generated properties not in front matter
  uri?: string;  // Generated
  id?: string;   // For HTML anchors
}

// Updated main interface
export interface VocabularyTableProps extends VocabularyComponentConfig, ConceptSchemeProps {
  concepts: ConceptProps[];  // Renamed from 'values' to 'concepts' for clarity
}
```

## Component Logic Updates

1. When generating RDF or JSON-LD:
   - The vocabulary itself should be represented as a `skos:ConceptScheme`
   - Each term should be represented as a `skos:Concept`
   - Add `skos:inScheme` pointing from each concept to the scheme
   - Add `skos:hasTopConcept` pointing from the scheme to each concept
   - Add `skos:topConceptOf` pointing from each concept to the scheme

2. Use Docusaurus's current locale for language tagging:
   - Leverage `i18n.currentLocale` to add the appropriate language tag to literals
   - No need to specify language tags in front matter
   - Default to 'en' when no locale is set

3. URI generation should remain configurable but with more explicit documentation

## Implementation Strategy

1. Update the existing VocabularyTable component since it hasn't been used in production
2. Use Docusaurus's i18n system for language tags - no need to specify language in front matter
3. Update example documentation with the new structure
4. Maintain TOC support
5. Add sample implementation MDX for the new component structure

## Front Matter Example

```yaml
---
vocabularyId: "1275"
title: "ISBDM Extent of Unitary Structure value vocabulary"
uri: "http://iflastandards.info/ns/isbdm/values/1275"
description: "A vocabulary of terms for describing the extent of the unitary structure."
scopeNote: "Use for physical description of the item."
# Component configuration
startCounter: 1275001
uriStyle: "numeric"
showTitle: true
# The ConceptScheme's RDF (can include any SKOS properties)
conceptScheme:
  rdf:type: 
    - "skos:ConceptScheme"
  skos:prefLabel:
    en: "ISBDM Extent of Unitary Structure value vocabulary"
  skos:definition:
    en: "A vocabulary of terms for describing the extent of the unitary structure."
# The actual concepts/terms
concepts:
  - value: "activity card"
    definition: "A card or other small sheet with printed text, images, or both, used for teaching, information, or entertainment."
    scopeNote: "Use only for cards that are intended for activities."
  - value: "atlas"
    definition: "A bound volume of maps, charts, or plates."
    scopeNote: "For other types of cartographic resources, see related vocabularies."
  # ...more concepts
---
```