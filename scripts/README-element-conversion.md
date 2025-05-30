# HTML Element to MDX Conversion Tool

This directory contains a unified tool for converting ISBDM HTML element files to MDX format with standardized frontmatter and formatting according to project requirements.

## Overview

The element conversion tool takes HTML files from the original ISBDM documentation and converts them to MDX format with:

1. **Standardized Frontmatter** - Generates metadata following the DCTAP profile standards
2. **Proper Component Usage** - Converts HTML elements to appropriate React components
3. **Consistent Formatting** - Ensures tables, examples, and other content is properly formatted
4. **Cleaned Duplicates** - Removes repeated truncated examples that appear in the HTML source

## Quick Start

```bash
# Convert a single file
yarn convert-element /path/to/source.html /path/to/output.mdx

# Convert a directory of files
yarn convert-element:batch /path/to/source/dir /path/to/output/dir [options]

# Advanced options
yarn convert-element:batch /path/to/source/dir /path/to/output/dir --force --verbose --exclude "general.html|transcription.html"
```

## Features

### Frontmatter Generation

The tool extracts metadata from the HTML files and generates standardized frontmatter following the specification in `docs/development/Element Front matter.md`. Key features include:

- **Docusaurus-specific fields**:
  - `id`: Element ID (e.g., "1025")
  - `slug`: Path in docs (e.g., "/docs/statements/1025")
  - `aliases`: Alternative paths including element paths and kebab-case labels
  - `sidebar_label`: Label for sidebar navigation
  - `sidebar_position` and `sidebar_level`: Navigation hierarchy placement

- **Core RDF metadata**:
  - `label`: Human-readable name
  - `uri`: Standard URI with "P" prefix
  - `type`: DatatypeProperty or ObjectProperty
  - `definition`: Element definition
  - `domain`/`range`: Type constraints
  - `scopeNote`: Additional descriptive text (empty string if not present)

- **Relationship metadata**:
  - `elementSubType`: Child elements with URIs, URLs, and labels
  - `elementSuperType`: Parent elements (empty array if none)
  - `equivalentProperty` and `inverseOf`: Always provided as empty arrays

- **Status information**:
  - `status`: Publication status (default "Published")
  - `isDefinedBy`: Vocabulary URI

### Content Conversion

The tool performs the following conversions on the HTML content:

1. **Structure**:
   - Adds proper heading hierarchy (h1, h2, h3)
   - Preserves section divisions (Additional information, Element values, Stipulations)
   - Handles subsections like Agents, Places, Time-spans

2. **Components**:
   - `<ElementReference />` for element reference blocks
   - `<SeeAlso>` for related elements
   - `<Mandatory />` for mandatory elements
   - `<InLink>` and `<OutLink>` for internal/external links

3. **Formatting**:
   - Converts examples to proper MDX details/summary blocks
   - Formats tables with proper Markdown syntax
   - Handles comments and special formatting
   - Transforms HTML styling to Markdown (bold, italic)
   - Preserves whitespace for readability

4. **Example Cleanup**:
   - Identifies and removes duplicated truncated examples
   - Preserves complete examples with proper formatting
   - Ensures consistent table headers and alignment

## Usage Details

### Single File Conversion

```bash
yarn convert-element /Users/jonphipps/Code/ISBDM/ISBDM/docs/statements/1025.html /Users/jonphipps/Code/ISBDM/docs/statements/1025.mdx
```

This will:
1. Read the HTML file and extract metadata
2. Generate standardized frontmatter
3. Convert HTML elements to MDX
4. Clean up formatting and repeated examples
5. Save the result to the output path

### Batch Processing

```bash
yarn convert-element:batch /Users/jonphipps/Code/ISBDM/ISBDM/docs/statements /Users/jonphipps/Code/ISBDM/docs/statements
```

Options:
- `--force` - Overwrite existing MDX files
- `--verbose` - Show detailed output
- `--exclude <regex>` - Files to exclude (default: `general.html|transcription.html|index.html`)
- `--pattern <glob>` - File pattern to match (default: `*.html`)

## Implementation Details

The unified converter is implemented in `/scripts/convert-html-element-to-mdx-unified.mjs` with these key functions:

1. `extractInformation(html, filePath)` - Parse HTML and extract metadata
2. `convertContentToMdx(document, label)` - Convert HTML to MDX structure
3. `convertSectionToMdx(sectionHeader)` - Process section content
4. `convertHtmlStringToMdx(html)` - Transform HTML tags to MDX
5. `cleanRepeatedExamples(content)` - Fix duplicated examples
6. `fixTableFormatting(content)` - Ensure proper table formatting

## Troubleshooting

If you encounter issues:

- Check for malformed HTML in the source files (especially in tables)
- Verify the output MDX has proper frontmatter syntax
- Ensure the ElementReference component works with the generated frontmatter
- Check that URI paths use the "P" prefix (e.g., P1025)
- Verify examples are properly formatted in details/summary blocks

## Sample Input/Output

Input: HTML file with element definition, examples, and stipulations

Output:
```
---
id: "1025"
slug: /docs/statements/1025
aliases:
  - /elements/P1025
  - /statements/has-manifestation-statement
sidebar_label: has manifestation statement
sidebar_position: 1
sidebar_level: 2
language: en
label: has manifestation statement
uri: http://iflastandards.info/ns/isbdm/elements/P1025
type: DatatypeProperty
definition: "Relates a manifestation to a statement that appears in a manifestation to represent aspects of itself."
domain: Manifestation
range: Literal
status: Published
isDefinedBy: http://iflastandards.info/ns/isbdm/elements/
scopeNote: ""
elementSubType:
  - uri: http://iflastandards.info/ns/isbdm/elements/P1029
    url: /docs/statements/1029
    label: "has manifestation statement of edition"
elementSuperType: []
equivalentProperty: []
inverseOf: []
---

# has manifestation statement
## Element Reference
<ElementReference />
## Additional information
<div className="guid">This element supports the user task to identify the manifestation.</div>
```