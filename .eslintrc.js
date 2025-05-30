module.exports = {
  extends: [
    'plugin:@docusaurus/recommended',
    'plugin:mdx/recommended'
  ],
  plugins: [
    '@docusaurus'
  ],
  rules: {
    '@docusaurus/string-literal-i18n-messages': 'error',
    '@docusaurus/no-untranslated-text': 'warn'
  },
  settings: {
    'mdx/remark': true, // This tells eslint-plugin-mdx to use your remark config
  },
  overrides: [
    {
      files: ['*.mdx', '*.md'],
      extends: ['plugin:mdx/recommended'],
      rules: {
        'react/jsx-no-undef': 'off',
        'no-unused-expressions': 'off'
      }
    }
  ]
};