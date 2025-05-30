# Vocabulary Conversion and Verification Tools

This document explains the tools available for converting HTML vocabulary files to MDX format and verifying their integrity.

## Overview

The ISBDM project contains vocabulary files in two formats:
1. Original HTML files in `/ISBDM/docs/ves/`
2. Converted MDX files in `/docs/ves/`

The conversion is handled by scripts that extract vocabulary terms from the HTML files and generate MDX files with SKOS-aligned concepts.

## Key Features

- **SKOS-Aligned Structure**: All vocabularies follow the SKOS concept model format
- **Attribution Preservation**: Attribution sections are preserved with proper links
- **Link Handling**: External links are converted to `<OutLink>` components
- **Duplicate Prevention**: Scripts detect and prevent duplicate or concatenated terms
- **Verification**: Tools to verify the integrity of converted files

## Available Scripts

### Conversion Scripts

- **`convert-vocabulary`**: Converts a single HTML vocabulary file to MDX
  ```bash
  yarn convert-vocabulary /path/to/input.html /path/to/output.mdx
  ```

- **`convert-vocabulary:improved`**: Improved conversion script that prevents concatenation issues
  ```bash
  yarn convert-vocabulary:improved /path/to/input.html /path/to/output.mdx
  ```

- **`convert-vocabulary:with-links`**: Conversion script that handles links better
  ```bash
  yarn convert-vocabulary:with-links /path/to/input.html /path/to/output.mdx
  ```

- **`convert-vocabulary:enhanced`**: Enhanced conversion script with OutLink components and attribution sections
  ```bash
  yarn convert-vocabulary:enhanced /path/to/input.html /path/to/output.mdx
  ```

- **`convert-all-vocabularies`**: Converts all HTML vocabulary files to MDX
  ```bash
  yarn convert-all-vocabularies
  ```

- **`convert-all-vocabularies:improved`**: Converts all HTML vocabulary files using the improved script
  ```bash
  yarn convert-all-vocabularies:improved
  ```

- **`convert-all-vocabularies:enhanced`**: Converts all HTML vocabulary files using the enhanced script (with OutLink components)
  ```bash
  yarn convert-all-vocabularies:enhanced
  ```

- **`convert-numeric-vocabularies`**: Converts only numeric HTML vocabulary files to MDX
  ```bash
  yarn convert-numeric-vocabularies
  ```

### Verification Scripts

- **`verify-conversion`**: Verifies the conversion of a single HTML vocabulary file to MDX
  ```bash
  yarn verify-conversion /path/to/html /path/to/mdx
  ```

- **`verify-all-conversions`**: Verifies all converted vocabulary files
  ```bash
  yarn verify-all-conversions
  ```

- **`verify-vocabulary-integrity`**: Verifies the integrity of all MDX vocabulary files
  ```bash
  yarn verify-vocabulary-integrity
  ```

### Utility Scripts

- **`update-vocabulary-attributions`**: Updates vocabulary files with attribution sections
  ```bash
  yarn update-vocabulary-attributions
  ```

- **`apply-attribution-fixes.sh`**: Applies fixed attribution sections to vocabulary files
  ```bash
  ./scripts/apply-attribution-fixes.sh
  ```
  This script:
  - Creates backups of original files in `docs/ves/backups/`
  - Replaces MDX files with their fixed versions that have proper attribution sections
  - Ensures attribution sections are wrapped in `<div className="guid">`
  - Adds proper `OutLink` components for external links

## Script Details

### Conversion Process

The conversion process:
1. Parses HTML vocabulary files using Cheerio
2. Extracts vocabulary metadata (title, description, scope note)
3. Extracts terms, definitions, and scope notes
4. Extracts attribution notes if present
5. Generates MDX content with YAML front matter
6. Adds VocabularyTable component and TOC export

The improved conversion script includes:
- Better parsing of HTML structure
- Prevention of concatenation issues
- Validation of extracted concepts
- Support for attribution sections

### Vocabulary File Structure

The MDX files follow this structure:

```mdx
---
vocabularyId: "1234"
title: ISBDM Example Value vocabulary
uri: http://iflastandards.info/ns/isbdm/values/1234
description: This value vocabulary is a source of values for a has example element.
isDefinedBy: http://iflastandards.info/ns/isbdm/values/1234
scopeNote: The vocabulary covers the full scope of the element.
concepts:
  - value: example term
    definition: This is the definition of the example term.
    scopeNote: This is an optional scope note for the term.
  # More terms...
---

import VocabularyTable from '@site/src/components/global/VocabularyTable';

# {frontMatter.title}

For use with element: [has example](/docs/attributes/1234.html)

<VocabularyTable
  {...frontMatter}
  showTitle={false}
  filterPlaceholder="Filter vocabulary terms..."
/>

---

<div className="guid">
<p>The values, definitions, and scope notes in this vocabulary are derived from the <OutLink href="https://example.com/source">Source Vocabulary</OutLink> licensed under a Creative Commons Attribution 4.0 International License.</p>
</div>

export const toc = VocabularyTable.generateTOC(frontMatter);
```

Note the following important elements:
1. The `concepts` array with SKOS-aligned properties
2. Attribution section wrapped in `<div className="guid">`
3. External links using the `OutLink` component (no import needed)

### Attribution Handling

When converting HTML to MDX, the attribution sections in the original HTML files must be preserved. These sections typically appear after the vocabulary table and contain information about the source of the vocabulary, licensing information, and copyright notices.

Attribution sections should:
1. Be wrapped in `<div className="guid">` to maintain consistent styling
2. Convert external links to use the `OutLink` component
3. No need to import OutLink since it's a global component registered in the MDXComponents.tsx file

Example:
```jsx
<div className="guid">
<p>The values, definitions, and scope notes in this vocabulary are derived from the <OutLink href="https://example.org/vocabulary">Source Vocabulary</OutLink> licensed under a Creative Commons Attribution 4.0 International License.</p>
</div>
```

This ensures that:
- Attribution sections are properly styled
- External links open in a new tab with proper security attributes
- The original source is properly credited

### Legacy Format Support

The tools also support vocabulary files in the legacy format with `RDF.values` instead of `concepts`:

```mdx
---
vocabularyId: "sample"
title: Sample Vocabulary
RDF:
  values:
    - value: Sample Term
      definition: This is a sample term.
      scopeNote: This is a scope note.
---
```

## Verification Checks

The verification scripts check for several issues:

1. **Concatenated values**: Values or definitions that are suspiciously long
2. **Duplicate values**: Multiple entries with the same value
3. **Missing values or definitions**: Entries without required fields
4. **Attribution sections**: Ensuring attribution notes are properly included

## Troubleshooting

### Common Issues

- **Concatenated values**: This happens when HTML parsing fails to separate table rows properly. Use the improved conversion script.
- **Missing attribution**: Some vocabularies have attribution sections that might not be captured. Use the `update-vocabulary-attributions` script.
- **Duplicated concepts**: This can happen when the conversion script processes the same row multiple times. Check the HTML structure.

### How to Fix Issues

1. Use the `verify-vocabulary-integrity` script to identify problems
2. For corrupted files, regenerate them using the improved conversion script
3. If you need to fix many files at once, add them to the `update-vocabulary-attributions` script

## Best Practices

1. Always verify the integrity of converted files with `verify-vocabulary-integrity`
2. Use the enhanced conversion script for all new conversions
3. When updating the component, ensure it supports both the new `concepts` format and the legacy `RDF.values` format
4. Keep backups of original files before conversion
5. Follow the testing plan in `/specs/testing plan.md` when making component changes
6. Stop the dev server before modifying files in the `docs/` directory to avoid file locking issues