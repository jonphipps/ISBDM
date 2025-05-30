# String Encoding Scheme (SES) HTML to MDX Conversion

This document describes the tools and processes for converting String Encoding Scheme (SES) HTML files to MDX format for the ISBDM project.

## Introduction

The ISBDM project requires conversion of String Encoding Scheme (SES) HTML files from the original `/ISBDM/docs/ves/` directory to MDX format for the Docusaurus documentation in the `/docs/ses/` directory. These scripts facilitate this conversion while preserving content integrity and ensuring proper formatting in MDX.

## Available Scripts

### 1. `convert-ses-html-to-mdx.js`

This script converts a single SES HTML file to MDX format.

**Usage:**
```bash
node convert-ses-html-to-mdx.js <source-html-file> <target-mdx-file>
```

**Example:**
```bash
node convert-ses-html-to-mdx.js "/Users/jonphipps/Code/ISBDM/ISBDM/docs/ves/ISBDMSESCol.html" "/Users/jonphipps/Code/ISBDM/docs/ses/ISBDMSESCol.mdx"
```

**Features:**
- Extracts title and creates appropriate frontmatter
- Converts HTML content to MDX format
- Handles special formatting for code blocks with curly braces
- Preserves `guid` divs but converts them to use `className` instead of `class`
- Converts Bootstrap-style example sections to MDX `<details>` elements
- Processes internal links to use `<InLink>` component
- Handles external links with proper formatting
- Removes unnecessary HTML elements like the Bootstrap example collapse links

### 2. `convert-all-ses-files.js`

This script batch converts all SES HTML files from the source directory to MDX format.

**Usage:**
```bash
node convert-all-ses-files.js
```

**Features:**
- Scans the source directory for all SES HTML files
- Converts each file to MDX using `convert-ses-html-to-mdx.js`
- Creates a properly formatted index file at `/docs/ses/index.mdx`
- Special cases the main ISBDMSES.html file as an "Overview" with appropriate ID and slug
- Formats numeric IDs with an "ID" prefix for better readability
- Reports conversion statistics (successes and failures)

## Conversion Details

### Front Matter

Each converted MDX file includes front matter with:
- `id`: Derived from the filename (e.g., "col" from "ISBDMSESCol.html")
- `title`: The title extracted from the H3 element in the source
- `slug`: Path based on the ID (e.g., "/ses/col")

Example:
```yaml
---
id: col
title: "Collective Agent SES"
slug: "/ses/col"
---
```

### Special Handling for ISBDMSES.html

The main ISBDMSES.html file is handled specially:
- ID is set to "overview" instead of an empty string
- Slug is set to "/ses/overview" for proper routing
- It's listed as "Overview" in the index file

### Content Conversion

The following transformations are applied:

1. **className Attribute**: HTML `class` attributes are converted to `className` for React/JSX compatibility:
   ```html
   <div class="guid">
   ```
   becomes:
   ```jsx
   <div className="guid">
   ```

2. **Code Formatting**: Text with curly braces (like template examples) is wrapped in backticks:
   ```
   {has title proper}
   ```
   becomes:
   ```
   `{has title proper}`
   ```

3. **Internal Links**: Internal links are converted to use the `<InLink>` component:
   ```html
   <a class="linkInline" href="/ISBDM/docs/relationships/1007.html">has collective agent...</a>
   ```
   becomes:
   ```jsx
   <InLink href="/relationships/1007.html">has collective agent...</InLink>
   ```

4. **Example Sections**: Bootstrap collapse elements are converted to MDX `<details>` elements:
   ```html
   <div class="xampleBlockGuid">
     <p><a class="linkEx" href="#isbdmex1">Examples</a></p>
     <div class="collapse xamples" id="isbdmex1">
       ...
     </div>
   </div>
   ```
   becomes:
   ```jsx
   <details>
     <summary>Examples</summary>
     ...
   </details>
   ```

5. **Tables**: Example data is converted to Markdown tables:
   ```
   | Relation | Example |
   |----------|----------|
   | has publisher collective agent | "Thames & Hudson" |
   ```

6. **Example Links**: Full example links are converted to Markdown links:
   ```
   *Full example*: [Charles Rennie Mackintosh (2002; Thames & Hudson; volume; perfect binding)](/fullex/fx072.html)
   ```

### Index File

The script creates an index file that lists all available SES files:

```markdown
---
id: ses-index
title: "String Encoding Schemes"
slug: "/ses"
---

# String Encoding Schemes

This section contains the String Encoding Schemes (SES) used in ISBDM:

- [Overview](/ses/overview)
- [ID 1023 SES](/ses/1023)
- [ID 1037 SES](/ses/1037)
- [Age SES](/ses/age)
- [Col SES](/ses/col)
...
```

## Error Handling

The scripts include error handling for:
- Missing source files
- Target directory creation
- Content verification to ensure no empty files
- Warnings for small file sizes that might indicate conversion issues

## Requirements

These scripts require:
- Node.js
- Cheerio (for HTML parsing)
- fs and path modules (for file operations)

## Content Validation

It's recommended to validate the converted files by:
1. Running a Docusaurus build to ensure there are no MDX compilation errors
2. Visually comparing the rendered MDX to the original HTML
3. Checking internal links are working correctly