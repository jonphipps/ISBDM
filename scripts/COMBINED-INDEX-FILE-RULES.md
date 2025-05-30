# Rules for Creating Combined Index Files

This document outlines the process for consolidating multiple HTML source files into a single MDX index file while preserving the hierarchical structure from the original sidebar.

## Overview

In some sections of the documentation, we need to combine multiple separate HTML files into a single consolidated MDX index file. This approach improves navigation and organization in the Docusaurus site.

## Step-by-Step Process

### 1. Convert the Source Index File First

- Begin by converting the directory's main index.html file to MDX
- Create proper front matter for this file (id, title, slug)
- This becomes the scaffold for the combined file

### 2. Convert Other Files in the Directory

- Convert each additional file in the directory to MDX
- Rename these files with a leading underscore (e.g., `file.html` → `_file.mdx`)
  - This makes them invisible to the Docusaurus compiler
- **Do not add front matter** to these auxiliary files - they'll be concatenated to the index file
- Convert the content only, preserving headings and structure
- Make sure each file starts with the appropriate heading level and an extra newline

### 3. Use Sidebar for Structure

- The sidebar serves two critical purposes:
  1. **Determining hierarchy**: The heading level is denoted by the number of arrows/indentation
  2. **Establishing file order**: The order of files in the sidebar determines the sequence for the combined index file
- The heading level is denoted by the number of arrows (>) preceding the entry in the sidebar:
  - No arrows = H1 (top level)
  - One arrow (>) = H2
  - Two arrows (>>) = H3
  - Three arrows (>>>) = H4
  - And so on
- Adjust the heading levels in the converted files accordingly

### 4. Front Matter Considerations

- For the index file, include standard front matter (id, title, slug)
- For individual file conversions:
  - Use the file's actual title in the `title` field of front matter
  - Add `sidebar_label` field with the original label text from the sidebar
  - Set `hide_title: true` to suppress duplicate title output
  - Do not include these files in navigation by using the underscore prefix
- Example front matter:
  ```yml
  ---
  title: "Mandatory Elements"
  sidebar_label: "Mandatory elements"
  hide_title: true
  ---
  ```

### 5. Verify Conversions

- Review all converted files to ensure:
  - Content is complete and accurate
  - Links are properly converted to InLink/OutLink components
  - Images and other assets are properly referenced
  - Heading levels match the sidebar structure
  
### 6. Documentation and Reference

- When you need information about Docusaurus, React, SASS, or TypeScript, use Context7 through MCP tools
- Example:
  ```
  mcp__Context7__resolve-library-id libraryName: "docusaurus"
  mcp__Context7__get-library-docs context7CompatibleLibraryID: "vercel/docusaurus"
  ```
- This ensures you have the most up-to-date information for components and styling

### 7. Combine Files

- Concatenate the content from the auxiliary files to the index file using bash:
  ```bash
  cat _file1.mdx _file2.mdx _file3.mdx >> index.mdx
  ```
- Maintain the same order as shown in the original sidebar
- Ensure proper spacing between sections is maintained during concatenation
- Verify that heading levels create a logical document structure after combining

### 8. Post-Combination Verification

- Check for missing line breaks between sections, especially between `</div>` tags and headings
- Verify all `.html` extensions have been removed from `<InLink>` and `<OutLink>` components
- Run a build test to catch any MDX parsing errors before finalizing
- Fix any errors found during the build process

### 9. Final Review

- Verify the combined index file displays correctly in Docusaurus
- Check that the table of contents reflects the original sidebar structure
- Ensure all internal links work correctly
- Test navigation and readability in both light and dark modes

## Example

**Original sidebar structure:**
```
- Section Name
  - Introduction (index.html)
  > Topic A (a.html)
  > Topic B (b.html)
  >> Subtopic B1 (b1.html)
  > Topic C (c.html)
```

**Conversion steps:**
1. Convert index.html to index.mdx with front matter
2. Convert other files with appropriate heading levels:
   - a.html → _a.mdx (using H2)
   - b.html → _b.mdx (using H2)
   - b1.html → _b1.mdx (using H3)
   - c.html → _c.mdx (using H2)
3. Combine all files into index.mdx in the sidebar order

**Final combined index.mdx structure:**
```mdx
---
id: section-name
title: Section Name
slug: /section-name
---

# Introduction
[Content from index.html]

## Topic A
[Content from a.html]

## Topic B
[Content from b.html]

### Subtopic B1
[Content from b1.html]

## Topic C
[Content from c.html]
```

## Notes

- This approach preserves the hierarchical structure while creating a single consolidated document
- The resulting table of contents in Docusaurus will reflect the original sidebar structure
- The underscore prefix ensures auxiliary files aren't processed by Docusaurus
- Once the combined file is verified, the auxiliary files can be kept for reference, but are not used by the site