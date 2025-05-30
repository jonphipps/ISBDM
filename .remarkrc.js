module.exports = {
  plugins: [
    'remark-mdx',
    'remark-preset-lint-recommended',
    'remark-preset-prettier',
    // Add more plugins as needed
    ['remark-lint-no-duplicate-headings', false], // Disable duplicate heading check as Docusaurus uses frontmatter titles
    ['remark-lint-maximum-line-length', false], // Disable line length limits for code blocks
    ['remark-lint-no-literal-urls', false], // Allow literal URLs in MDX
  ]
};