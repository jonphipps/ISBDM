# Comparison: isbdm-values-profile.csv vs isbdm-values-profile-revised.csv

## Key Differences:

### 1. **Shape Structure**
- **Original** (`isbdm-values-profile.csv`): 
  - Uses shapes: `Vocabulary`, `VocabularyRDF`, `VocabularyTerm`
  - Designed for the original front matter structure with nested RDF object
  
- **Revised** (`isbdm-values-profile-revised.csv`):
  - Uses shapes: `ComponentConfig`, `ConceptScheme`, `ConceptSchemeRDF`, `Concept`
  - Follows SKOS terminology more closely
  - Separates component configuration from vocabulary metadata

### 2. **Term Structure**
- **Original**: 
  - Terms are simple with properties like `value`, `definition`, `scopeNote`
  - No language tag support in the shape definition
  - No SKOS properties for individual terms
  
- **Revised**:
  - Terms are full SKOS Concepts with properties like:
    - `skos:prefLabel` (with language tags)
    - `skos:definition` (with language tags)
    - `skos:inScheme`, `skos:topConceptOf`
    - All SKOS note properties with language tag support

### 3. **Language Support**
- **Original**: Properties are simple strings without language tags
- **Revised**: Uses `langString` datatype for multilingual support

### 4. **SKOS Compliance**
- **Original**: Basic vocabulary structure, not fully SKOS-compliant
- **Revised**: Full SKOS compliance with ConceptScheme and Concept relationships

## Current Usage:
- The config references `isbdm-values-profile-revised.csv`
- The hard-coded `CONCEPT_PROFILE` matches the `Concept` shape from the revised version
- The revised version supports the CSV format used in the examples (with language tags like `@en`)

## Recommendation:
Continue using `isbdm-values-profile-revised.csv` as it:
1. Supports the multilingual features being used
2. Is fully SKOS-compliant
3. Matches the current implementation