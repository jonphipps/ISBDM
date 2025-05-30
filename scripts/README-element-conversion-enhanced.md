# Enhanced HTML Element to MDX Converter

This toolset provides a complete solution for converting ISBDM HTML element files to MDX format with proper frontmatter, component usage, and example formatting. It addresses the issues in the previous versions and streamlines the conversion process.

## Features

- **Unified Conversion**: Single-step conversion process combining frontmatter generation, content conversion, and formatting fixes
- **Improved Element Reference Component**: Direct RDF data injection for reliable component rendering
- **Enhanced Example Table Formatting**: Better handling of example blocks with proper component usage
- **Sanitized Multi-line Strings**: Consistent handling of multi-line text in RDF and example data
- **Batch Processing**: Process entire directories with filter options
- **Force Mode**: Option to overwrite existing files

## Usage

### Quick Start

Use the shell script for the most convenient experience:

```bash
# Convert a single file
./scripts/convert-element-enhanced.sh ISBDM/docs/statements/1025.html docs/statements/1025.mdx

# Convert an entire directory
./scripts/convert-element-enhanced.sh --batch ISBDM/docs/statements/ docs/statements/ --force
```

### Command-line Options

- `--force`: Overwrite existing files without prompting
- `--verbose`: Show detailed output during conversion
- `--exclude <regex>`: Files to exclude (default: general.html|transcription.html|index.html)
- `--pattern <glob>`: File pattern to match (default: *.html)
- `--help`: Show help message

## MDX Output Format

### Frontmatter

The converter generates structured YAML frontmatter with two main sections:

1. **Docusaurus metadata**: ID, slug, aliases, and sidebar information
2. **RDF metadata**: Structured data for the ElementReference component

Example:
```yaml
---
# Docusaurus-specific fields
aliases:
  - /elements/P1025
sidebar_position: 1
sidebar_level: 2

# Core metadata
RDF:
  label: has manifestation statement
  definition: "Relates a manifestation to a statement that appears in a manifestation to represent aspects of itself."
  domain: Manifestation
  range: Literal
  uri: http://iflastandards.info/ns/isbdm/elements/P1025
  type: DatatypeProperty
  scopeNote: ""
  elementSubType:
    - uri: http://iflastandards.info/ns/isbdm/elements/P1029
      url: /docs/statements/1029
      label: "has manifestation statement of edition"
  elementSuperType: []
  status: Published
  isDefinedBy: http://iflastandards.info/ns/isbdm/elements/
  equivalentProperty: []
  inverseOf: []
scopeNote: ""
---
```

### Content Structure

The converter generates MDX content with the following structure:

1. **Title**: First-level heading with the element label
2. **Element Reference**: Direct component usage with RDF data
3. **Additional Information**: Optional section with guidance notes and see-also links
4. **Element Values**: Optional section with value information
5. **Stipulations**: Section with requirements and examples

Example:
```mdx
# has manifestation statement

## Element Reference

<ElementReference frontMatter={frontMatter} />

## Additional information

<div className="guid">This element supports the user task to identify the manifestation.</div>

<SeeAlso>[has note on manifestation statement](/docs/notes/1200)</SeeAlso>

## Element values

<div className="guid">The values of this element may be indexed for uncontrolled keywords to support the user task to find the manifestation.</div>

## Stipulations

<div className="stip">
  <Mandatory />
  If one or more statements appear in the manifestation in a script that can be transcribed by the cataloguing agency, record at least one occurrence of the element.

  <details>
    <summary>Examples</summary>
    
    | Property | Value |
    |:---------|:------|
    | has manifestation statement | "This catalogue is published in conjunction with the exhibition Matisse – Bonnard. "Long Live Painting!", Städel Museum, Frankfurt am Main, 13 September 2017 – 14 January 2018" |

    *[Full example: [Matisse Bonnard (2017; Städel Museum; volume)](../fullex/fx065).]*

    <hr />

    | Property | Value |
    |:---------|:------|
    | has manifestation statement | "Pete Townshend, Who I am" |

    *[The value is a statement of title and responsibility.]*
  </details>
</div>

</div>
```

## Required Component Updates

## Technical Details

1. **JSDOM & Cheerio**: Used for HTML parsing
2. **js-yaml**: For YAML frontmatter generation
3. **Sanitization**: All multi-line strings are sanitized for consistent formatting

## Troubleshooting

If you encounter issues:

1. Verify the HTML input file exists and contains the expected structure
2. Check if the output directory exists
3. Use `--verbose` to see more detailed output
4. Check the console for error messages

## License

Same license as the ISBDM project.