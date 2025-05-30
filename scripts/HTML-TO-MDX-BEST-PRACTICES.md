# HTML to MDX Conversion Best Practices

Based on our experience with SES file conversions and the newly established linting setup, here are best practices for future HTML to MDX conversions.

## Pre-Conversion Planning

1. **Analyze Source Structure**
   - Understand the HTML structure of source files
   - Identify common patterns and special elements
   - Note any JavaScript dependencies that won't be needed in MDX

2. **Set Up Target Structure**
   - Create appropriate directories for MDX output
   - Plan for consistent frontmatter fields and values
   - Decide on component usage for special elements

## Conversion Process

1. **Start with Basic Converter**
   - Begin with a simple script that handles frontmatter and basic content
   - Test with a representative sample of files
   - Refine the script based on initial results

2. **Incremental Improvements**
   - Add handling for special cases one at a time
   - Verify each enhancement with test runs
   - Document each enhancement for future reference

3. **Batch Processing**
   - Create separate scripts for batch processing
   - Include generation of index files
   - Build in verification steps

## Post-Conversion Verification

1. **Content Validation**
   - Check for content completeness
   - Verify all links work correctly
   - Ensure proper component usage

2. **Linting and Formatting**
   - Run ESLint on converted files: `yarn lint:mdx`
   - Fix any linting issues
   - Format with remark if needed: `yarn format:mdx`

3. **Visual Verification**
   - Run the Docusaurus server to view converted files
   - Check for visual inconsistencies
   - Ensure responsive behavior

## Common Issues and Solutions

### 1. Handling Curly Braces (CRITICAL)

**Issue**: MDX interprets curly braces `{}` as JSX expressions, causing parsing errors.
**Solution**: Properly escape all curly braces based on their context.

#### In Regular Text:
```mdx
This will cause an error: {variable}
This works: `{variable}`
```

#### In Component Props:
```mdx
<Figure caption="Image showing {count} items" />  <!-- ERROR! -->

<Figure caption={"Image showing {count} items"} />  <!-- CORRECT -->
```

#### In Markdown Code Blocks:
Use triple backticks with language specification:
````mdx
```javascript
function example() {
  return { result: 'success' };  // curly braces are safe in code blocks
}
```
````

#### In Non-Markdown HTML Content:
Use HTML entities for curly braces:
```mdx
<pre>
function example() &#123;
  return &#123; result: 'success' &#125;;
&#125;
</pre>
```

**IMPORTANT**: MDX parsing errors due to unescaped curly braces are a common source of problems. Always double-check all content containing curly braces during conversion.

### 2. Class vs. className

**Issue**: HTML uses `class`, React uses `className`.
**Solution**: Convert all instances during conversion.

```html
<div class="example">Text</div>
```

Should become:

```jsx
<div className="example">Text</div>
```

### 3. Link Handling

**Issue**: Regular HTML links don't integrate with Docusaurus navigation and `.html` extensions cause problems.
**Solution**: Convert to InLink/OutLink components and remove all `.html` extensions.

```html
<a href="another-page.html">Link text</a>
```

Should become:

```jsx
<InLink href="/section/another-page">Link text</InLink>
```

**IMPORTANT**: Failing to remove `.html` extensions will cause build errors when Docusaurus tries to resolve the links. This is a common source of issues during conversion.

### 4. Example Blocks Transformation

**Issue**: Bootstrap collapsible example blocks need to be converted to semantic HTML.
**Solution**: Transform to HTML `<details>` and `<summary>` elements with Markdown tables.

**Original HTML:**
```html
<div class="xampleBlockGuid">
  <p><a class="linkEx" href="#isbdmex2" data-bs-toggle="collapse" role="button"
     aria-expanded="false" aria-controls="isbdmex2">Examples</a></p>
  <div class="collapse xamples" id="isbdmex2">
    <div>
      <div class="row px-2">
        <div class="col-6 xampleLabel">has unitary structure</div>
        <div class="col-6 xampleValue">&quot;multiple unit&quot;</div>
      </div>
      <div class="row px-2">
        <div class="col-6 xampleLabel">has sub-unit</div>
        <div class="col-6 xampleValue">&quot;myScience Canada (2008-; Scimetrica;
          online resource; English)&quot;</div>
      </div>
      <div class="row px-2">
        <div class="col editComment">[Full example: <a class="linkInline"
          href="/ISBDM/docs/fullex/fx015.html">myScience Canada...</a>]</div>
      </div>
    </div>
  </div>
</div>
```

**Converted MDX:**
```jsx
<details>
<summary>Examples</summary>
<div>

| Property              | Value                                                            |
| :-------------------- | :--------------------------------------------------------------- |
| has unitary structure | "multiple unit"                                                  |
| has sub-unit          | "myScience Canada (2008-; Scimetrica; online resource; English)" |

_[Full example: <InLink href="/docs/fullex/fx015">myScience Canada...</InLink>]_

</div>
</details>
```

### 5. Element Spacing

**Issue**: MDX is sensitive to spacing between elements, especially between closing divs and headings.
**Solution**: Always ensure proper line breaks between structural elements.

```jsx
// INCORRECT - will cause build errors
</div>## Heading

// CORRECT - with proper spacing
</div>

## Heading
```

**IMPORTANT**: Missing line breaks between JSX closing tags and Markdown elements is a common source of build errors. Always add an empty line between these elements.

### 6. Guidance and Stipulation Blocks

**Issue**: Guidance and stipulation blocks with HTML paragraphs need to be converted to a mix of JSX and Markdown.
**Solution**: Keep the outer div with className but convert inner paragraphs to Markdown.

**Original HTML:**
```html
<div class="guid">
  <p>This is a guidance paragraph that explains important information.</p>
  <p>This is a second paragraph with more explanation, possibly containing <a class="linkInline" href="another-page.html">links</a>.</p>
</div>
```

**Converted MDX:**
```jsx
<div className="guid">

This is a guidance paragraph that explains important information.

This is a second paragraph with more explanation, possibly containing <InLink href="/section/another-page">links</InLink>.

</div>
```

The same approach applies to `<div class="stip">` containers for stipulations.

### 6. Nested Ordered Lists

**Issue**: Complex nested ordered lists with multiple levels and different numbering styles need conversion to Markdown.
**Solution**: Use standard Markdown list syntax with proper indentation and alternating number/letter formats.

**Original HTML:**
```html
<ol>
  <li>First level item 1</li>
  <li>First level item 2
    <ol type="a">
      <li>Second level item a</li>
      <li>Second level item b
        <ol type="i">
          <li>Third level item i</li>
          <li>Third level item ii</li>
        </ol>
      </li>
    </ol>
  </li>
  <li>First level item 3</li>
</ol>
```

**Converted MDX:**
```markdown
1. First level item 1
2. First level item 2
   a. Second level item a
   b. Second level item b
      1. Third level item i
      2. Third level item ii
3. First level item 3
```

**Note**: While Markdown doesn't natively support letters for ordering, we use this format for readability and it will render correctly in most cases. Ensure proper indentation (3 spaces per level) for correct list nesting.

### 7. Duplicated Headers

**Issue**: Docusaurus generates a heading from frontmatter title.
**Solution**: Remove duplicated H1/H2 headings that match the title.

## Tooling and Automation

1. **Verification Scripts**
   - Create scripts to compare source and target content
   - Use similarity scoring for content integrity checks
   - Build reporting into conversion process

2. **Post-Processing Scripts**
   - Create scripts for common fixes like removing duplicated headers
   - Add tools for enhancing links or adding components
   - Use batch processing for applying fixes to multiple files

3. **Integration with Development Workflow**
   - Add npm/yarn scripts for common conversion tasks
   - Create documentation for conversion process
   - Set up linting as part of CI/CD pipeline

## Project-Specific Recommendations

1. **Component Usage**
   - Always use `<InLink>` for internal navigation
   - Use `<OutLink>` for external links
   - Use appropriate components for other specialized content

2. **Directory Organization**
   - Keep related content in same directory
   - Use consistent naming patterns
   - Create index files for sections

3. **Content Enhancement**
   - Consider adding TOC where appropriate
   - Use collapsible sections for examples
   - Add proper attribution and metadata

## Documentation

Always document your conversion process and decisions:

1. **Conversion Rules**
   - Document patterns and transformations
   - Note special cases and how they're handled
   - Provide examples of before/after conversion

2. **Script Documentation**
   - Include usage instructions
   - Document parameters and options
   - Provide examples of command usage

3. **Troubleshooting Guide**
   - Document common issues
   - Provide solutions for each issue
   - Include contact information for support