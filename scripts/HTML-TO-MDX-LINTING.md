# HTML to MDX Linting Setup

This document outlines the linting setup for MDX files in the ISBDM project, with a focus on compatibility with Docusaurus v3.

## Current Setup

### Tools Installed

1. **ESLint with Docusaurus Plugin**
   - `eslint`: Core linting engine
   - `@docusaurus/eslint-plugin`: Docusaurus-specific linting rules

2. **Compatibility Note**
   While MDX v3 linting support is still evolving, we've adopted a simplified approach that focuses on:
   - Using Docusaurus's built-in ESLint rules
   - Disabling problematic rules for MDX files
   - Manual verification of MDX files

### Recommended Workflow

For HTML to MDX conversion, we recommend a phased approach:

1. **Initial Conversion**
   - Convert HTML to MDX using the established conversion scripts
   - Follow the conversion rules from HTML-TO-MDX-CONVERSION-RULES.md

2. **Manual Review**
   - Visually inspect converted files in the Docusaurus site
   - Check for rendering issues, broken links, or formatting problems

3. **Basic Linting**
   - Run `yarn lint:mdx` to catch obvious issues
   - Fix any errors that are reported

4. **Content Validation**
   - Use verification scripts to compare original HTML with converted MDX
   - Ensure all content is preserved

## Best Practices for MDX Files

### Front Matter

Always include proper front matter with these fields:
```mdx
---
id: unique-identifier
title: "Clear Title"
slug: "/section/page-name"
---
```

### JSX in MDX

- Use `className` instead of `class` for HTML elements
- Wrap components in curly braces: `<InLink href="/page">Link</InLink>`
- Use backticks for template strings with curly braces: `` `{template}` ``

### Links

- Use `<InLink>` for internal links
- Use `<OutLink>` for external links
- Ensure all links have proper `href` attributes

### Content Organization

- Use headings appropriately (avoid duplicating title)
- Structure content logically with paragraphs and sections
- Use appropriate components for special content

## Troubleshooting

### MDX Parsing Errors

Common causes:
- Unescaped curly braces in content
- Malformed JSX syntax
- Missing or incomplete component imports

Solution:
- Check for curly braces and wrap in backticks
- Verify component syntax
- Ensure all components are properly registered in MDXComponents.tsx

### Missing Content

If content is missing after conversion:
- Check the original HTML structure
- Verify the conversion script's content extraction logic
- Look for nested elements that might be skipped

### Docusaurus Build Errors

- Check console errors in development mode
- Verify that components are imported correctly
- Look for invalid front matter

## Future Improvements

As MDX v3 tooling matures, we plan to:
- Add more sophisticated MDX linting rules
- Implement automated formatting for MDX
- Create pre-commit hooks for MDX validation
- Expand test coverage for MDX components

In the meantime, consistent manual review and following the established conversion rules will ensure high-quality MDX content.