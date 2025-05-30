# Element Conversion Guide

This document explains the HTML to MDX conversion workflow for ISBDM element documentation.

## Overview

The element conversion process converts HTML files from the original ISBDM documentation into properly formatted MDX files for use with Docusaurus v3. The conversion process follows project standards for:

- RDF metadata in frontmatter
- Component usage 
- MDX formatting
- Table formatting and structure

## Quick Start

To convert a single HTML element file to MDX:

```bash
# Recommended: Simple, reliable conversion
yarn convert-element-simple /path/to/element.html /path/to/output.mdx

# For verbose output
yarn convert-element-simple -v /path/to/element.html /path/to/output.mdx
```

To convert an entire directory of HTML files to MDX:

```bash
# Convert all HTML files in a directory with one command
yarn batch-convert-element /path/to/html/dir /path/to/output/dir

# Use -f to overwrite existing files without prompting
yarn batch-convert-element -f /path/to/html/dir /path/to/output/dir

# Use -v for verbose output
yarn batch-convert-element -v /path/to/html/dir /path/to/output/dir
```

## Conversion Pipeline

The complete conversion process consists of these steps:

1. **HTML Parsing**: Extract structured data from the HTML file
2. **Frontmatter Generation**: Create compliant YAML frontmatter with RDF metadata
3. **MDX Content Conversion**: Transform HTML sections to MDX with proper component usage
4. **Formatting**: Format the MDX according to project conventions
5. **Table Formatting**: Ensure tables are properly structured
6. **Linting**: Apply eslint and remark rules for final polish

## Scripts

The following scripts work together to implement the conversion pipeline:

### Main Conversion Scripts

- `convert-html-element-to-mdx-improved.mjs`: Enhanced HTML to MDX converter
- `format-mdx.js`: MDX formatter that applies project style rules
- `fix-tables.js`: Specialized formatting for MDX tables
- `convert-element-complete.sh`: All-in-one conversion script

### Usage Examples

**Converting a single file**:

```bash
yarn convert-element:improved ISBDM/docs/statements/1025.html docs/statements/1025.mdx
```

**Formatting an MDX file**:

```bash
yarn format-mdx docs/statements/1025.mdx
```

**Complete conversion**:

```bash
yarn convert-element-complete ISBDM/docs/statements/1025.html docs/statements/1025.mdx
```

## MDX Structure and Formatting

The generated MDX files follow this structure:

```mdx
---
RDF:
  label: "element name"
  definition: "Element definition"
  domain: "Domain"
  range: "Range"
  uri: "http://example.org/elements/1234"
  type: "ObjectProperty"
  elementSubType:
    - uri: "http://example.org/elements/5678"
      url: "/docs/statements/5678"
      label: "Sub-element name"
  elementSuperType: []
id: "element-name"
title: "element name"
sidebar_label: "element name"
---

# element name

## Element Reference
<ElementReference />

## Additional information
<div className="guid">Element purpose description</div>

## Element values
<div className="guid">Information about allowed values</div>

## Stipulations
<div className="stip">
  <Mandatory />
  
  Element usage rules...
  
  <details>
    <summary>Examples</summary>
    
    | Property | Value |
    |:---------|:------|
    | element name | "example value" |
    
    *[Example note]*
  </details>
</div>
```

## Component Transformations

During conversion, the following transformations are applied:

| HTML Structure | MDX Component |
|----------------|--------------|
| Reference table | `<ElementReference />` |
| Internal links | `<InLink to="/path">text</InLink>` |
| External links | `<OutLink href="url">text</OutLink>` |
| "See also" blocks | `<SeeAlso>link</SeeAlso>` |
| Mandatory indicators | `<Mandatory />` |
| Tables in examples | Properly formatted MDX tables |
| Class attributes | `className` attributes |

## Frontmatter Structure

The generated frontmatter follows the project's RDF schema:

```yaml
RDF:
  label: "element name"           # The display name
  definition: "definition text"   # Element definition
  scopeNote: "additional notes"   # Optional scope note
  domain: "Manifestation"         # Domain class
  range: "Literal"                # Range (for object properties)
  uri: "http://example.org/id"    # URI identifier
  type: "DatatypeProperty"        # ObjectProperty or DatatypeProperty
  
  # Optional relationships
  elementSubType: []              # Sub-elements
  elementSuperType: []            # Parent elements

# Docusaurus metadata
id: "element-name"                # URL-friendly identifier
title: "element name"             # Display title
sidebar_label: "element name"     # Sidebar navigation label
```

## Troubleshooting

### Common Issues

1. **Missing RDF data in frontmatter**:
   - Check the HTML source for structural issues
   - Verify the element definition is properly marked with the correct class

2. **Table formatting problems**:
   - Run the `fix-tables.js` script directly on the file
   - Check for unusual table structures in the source HTML

3. **ESLint errors after conversion**:
   - Some manual adjustment may be needed for complex MDX content
   - Check error messages and fix specific issues according to project rules

### Manual Adjustments

Sometimes manual adjustments are needed for:

1. **Complex examples**: Multi-part examples with nested tables
2. **Special formatting**: Unusual text formatting or layout
3. **Component customization**: Component props that can't be automatically inferred

## References

For more information, see:
- [COMPONENT-TRANSFORMATION-GUIDE.md](./COMPONENT-TRANSFORMATION-GUIDE.md)
- [HTML-TO-MDX-CONVERSION-RULES.md](./HTML-TO-MDX-CONVERSION-RULES.md)
- [MDX-LINTING-GUIDE.md](../docs/development/MDX-LINTING-GUIDE.md)