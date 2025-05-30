# HTML to MDX Conversion Rules

This document outlines the rules and guidelines to follow when converting HTML files to MDX format for the ISBDM Docusaurus project. These rules ensure consistency, preserve content integrity, and maintain proper functionality.

## General Conversion Rules

1. **Front Matter Structure**
   - Include `id`, `title`, and `slug` in all front matter
   - Generate `id` from filename (lowercase, without extension)
   - Use original HTML `<title>` content for the MDX `title` field
   - Create `slug` as `/section-name/filename-without-extension`

2. **HTML to JSX Attribute Conversion**
   - Convert `class` → `className`
   - Convert `for` → `htmlFor`
   - Ensure all closing tags are properly formatted (`<br>` → `<br/>`)
   - Use valid JSX syntax for boolean attributes (`checked` → `checked={true}`)
   - For `<div class="guid">` or `<div class="stip">` containers, convert to `<div className="guid">` but transform paragraphs inside to standard Markdown paragraphs (removing `<p>` tags)

3. **Link Handling**
   - Convert internal links to `<InLink>` components
   - Convert external links to `<OutLink>` components
   - **CRITICAL**: Remove `.html` extensions from all link paths (e.g., `href="/docs/intro/i001.html"` → `href="/docs/intro/i001"`)
   - Update directory references to match the new structure
   - Remove any Bootstrap-specific link attributes
   - Ensure proper spacing in the document around InLink/OutLink components

4. **Special Character Handling in JSX Props and Content**
   - **CRITICAL: All curly braces in content must be escaped** to prevent MDX parsing errors:
     - In regular content text: Wrap with backticks: `{variable}` 
     - In JSX component props: Use string literals or JSON.stringify()
     - In code blocks: Use additional backticks or fenced code blocks
   - Always use proper JSON escaping for values passed to React components
   - Use `JSON.stringify()` for all prop values, especially those containing:
     - Quotes (single or double)
     - Curly braces
     - Line breaks or special whitespace
   - Example: `value: "Text with {curly braces}"` → `value: {"Text with {curly braces}"}`
   - Example: `value: "Text with \"quotes\""` → `value: {"Text with \"quotes\""}`
   - This prevents MDX parsing errors with expressions and ensures proper JSX syntax

5. **Content Structure**
   - Preserve the original content hierarchy
   - Maintain original headings (but don't duplicate titles)
   - Keep original paragraph breaks and lists
   - Structure complex content blocks in appropriate divs
   - For complex nested numbered lists, use standard Markdown list syntax with alternating number and letter formats:
     ```markdown
     1. First item
        a. Sub-item A
           1. Nested item 1
           2. Nested item 2
        b. Sub-item B
     2. Second item
     ```

6. **Special Elements**
   - Convert Bootstrap panels to details/summary elements
   - Convert HTML tables to Markdown tables where possible
   - Convert collapsible sections appropriately
   - Handle code blocks with proper syntax highlighting

## Content Validation

1. **Post-Conversion Verification**
   - Compare original HTML and converted MDX for content completeness
   - Verify all links work and point to correct resources
   - Check that all images render properly
   - Ensure proper component usage

2. **Common Issues to Check**
   - Missing content due to non-standard HTML structure
   - Duplicate headers
   - MDX parsing errors due to unescaped curly braces
   - Broken links due to incorrect path transformations
   - Missing images or incorrect image paths

## Component-Specific Rules

1. **InLink Component**
   - Use for all internal documentation links
   - Pass relative paths without `.html` extension
   - Example: `<InLink href="/ses/overview">Overview</InLink>`

2. **OutLink Component**
   - Use for all external links
   - Always include full URL including protocol
   - Example: `<OutLink href="https://example.com">Example Site</OutLink>`

3. **ElementReference Component**
   - Use for referencing elements within the documentation
   - Example: `<ElementReference id="1023">ID 1023</ElementReference>`

4. **Figure Component**
   - Use for all images with captions
   - Example: `<Figure src="/img/example.png" alt="Example" caption="Figure 1: Example diagram" />`

5. **Table Component**
   - Use either Markdown tables or the `<table>` JSX element
   - Ensure proper header cell identification

6. **Example Blocks**
   - Convert collapsible examples to using the HTML `<details>` and `<summary>` tags
   - Transform example rows into Markdown tables with property/value columns
   - Keep edit comments as italicized text with `_[comment]_` format
   - Example:
   ```mdx
   <details>
   <summary>Examples</summary>
   <div>
   
   | Property              | Value                                                            |
   | :-------------------- | :--------------------------------------------------------------- |
   | has unitary structure | "multiple unit"                                                  |
   | has sub-unit          | "myScience Canada (2008-; Scimetrica; online resource; English)" |
   | has sub-unit          | "myScience Canada (2008-; Scimetrica; online resource; French)"  |
   
   _[Full example: <InLink href="/docs/fullex/fx015">myScience Canada (2008-; Scimetrica; online resource)</InLink>. The URLs of the English and French versions share the same root URL and are distinct: "https://www.myscience.ca/" (Home page in English); "https://www.myscience.ca/en" (English version sub-unit); "https://www.myscience.ca/fr" (French version sub-unit).]_
   
   </div>
   </details>
   ```

## File Organization

1. **Directory Structure**
   - Organize files in appropriate section directories
   - Maintain consistent naming conventions across sections
   - Create appropriate index files for each section

2. **Combined Index Files**
   - For sections requiring consolidation of multiple files into a single index
   - Follow the detailed process in [COMBINED-INDEX-FILE-RULES.md](./COMBINED-INDEX-FILE-RULES.md)
   - Use heading levels based on the original sidebar structure
   - Combine files in the same order as the original sidebar

3. **Navigation Integration**
   - Update sidebar configuration to include new sections
   - Organize navigation logically based on content relationships
   - Use category labels that match documentation terminology

## Conversion Scripts

When developing conversion scripts, ensure they:

1. Handle each of the rules above consistently
2. Include proper error handling for edge cases
3. Report conversion status and issues
4. Validate output for completeness
5. Create a consistent navigation structure

## Example Conversion Patterns

### Guidance and Stipulation Blocks

**Original HTML:**
```html
<div class="guid">
  <p>This is a paragraph with a <a class="linkInline" href="another-page.html">link</a> to another page.</p>
  <p>This contains a template {variable}.</p>
</div>
```

**Converted MDX:**
```jsx
<div className="guid">

This is a paragraph with a <InLink href="/section/another-page">link</InLink> to another page.

This contains a template `{variable}`.

</div>
```

Notice how:
1. The outer `<div>` has `class` converted to `className`
2. The inner `<p>` tags are removed to use Markdown-style paragraphs
3. Links are converted to `<InLink>` components
4. Template variables in curly braces are wrapped in backticks
5. Empty lines are added between paragraphs for proper Markdown formatting

## Special Case Handling

1. **Main Section Files**
   - Main section overview files should be named `index.mdx`
   - Set slug to the section path (e.g., `/ses` not `/ses/index`)

2. **Files with Special Elements**
   - Files containing tables need special handling to maintain structure
   - Files with complex nested structures may need manual review
   - Example sections often need custom handling

## Post-Conversion Review Checklist

- [ ] All content preserved from original HTML
- [ ] Front matter correctly formatted
- [ ] Links working and using proper components
- [ ] No duplicated headers
- [ ] No MDX parsing errors
- [ ] Proper component usage throughout
- [ ] Consistent styling and formatting
- [ ] Navigation correctly configured

By following these rules consistently, the conversion process will produce high-quality, maintainable MDX content that works properly in the Docusaurus site.