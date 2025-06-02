# Claude Guidelines for ISBDM Project

## Component Development
- Create React components with TypeScript interfaces for props
- Use named exports with default export at the bottom
- Place components in appropriate directories under `src/components/global/`
- Register new components in `src/theme/MDXComponents.tsx` to make them available in MDX 
- Create example usage in `/docs/examples/` directory
- Components used in MDX must be exported with an uppercase name
- Always install components in a folder named for the component and name the component script `index.tsx` and the styles `styles.module.scss`
- Always make an example and usage guidance MDX page for each component

## Styling
- Use SCSS modules with naming convention `ComponentName.module.scss`
- Import styles with `import styles from './ComponentName.module.scss'`
- Use `clsx` for conditional class compositions
- Always test in both light and dark modes
- Follow SASS variable naming conventions in existing files
- The default theme uses Infima, which follows a BEM-like naming convention
- The source files use bootstrap and custom CSS from the `isbdm.css` file which is registered as custom CSS
- Avoid targeting hashed class names from CSS modules in global CSS, as these may change between builds
- For dark mode, use attribute selectors: `[data-theme='dark'] .purple-text { color: plum; }`
- The `<html>` element will have `data-theme="light"` or `data-theme="dark"` depending on the mode

## TypeScript
- Always use TypeScript for all code
- Define explicit interfaces for all props and data structures
- Use React.FC<PropsInterface> type for functional components
- Include JSDoc comments for props documentation
- Maintain strict type checking

## Testing
- Always write a test using Vitest that thoroughly tests the component, including edge cases
- Write tests for all components in matching folders under `src/tests/components/`
- Include tests for basic rendering, props variations, and accessibility
- Use jest-axe for accessibility testing
- Run all tests before submitting PRs

### Testing Toolchain
| Test Type | Tools | Frequency | Execution Time |
|:-:|:-:|:-:|:-:|
| Unit/Integration | Vitest + RTL | On Commit | <2 min |
| Visual Regression | Playwright + Argos | PRs | ~5 min |
| E2E | Playwright | Nightly | ~10 min |
| Snapshot | Vitest | On Component Change | <1 min |

## MDX Content
- Maintain front-matter consistency across MDX files
- Follow existing patterns for content organization
- Use custom components consistently for structured content
- Ensure semantic content preservation when converting HTML to MDX
- Always use context7 for docusaurus, jsx, sass for examples
- Properly escaping curly braces in mdx file when they're encountered in the source should always be part of your basic conversion script

## Accessibility
- Always make component HTML WCAG 2.1/2.2 Level AA compliant
- Ensure all components have appropriate ARIA attributes
- Include screen reader considerations
- Test with jest-axe in component tests

## Docusaurus Integration
- Always assume a Docusaurus environment for components
- Always assume an i18n environment and multilingual Docusaurus
- Use Docusaurus hooks like `useBaseUrl` for URL processing
- Use `useColorMode` for theme-aware components
- Follow Docusaurus best practices for versioning and internationalization
- Use `useBaseUrl` inside JSX components that generate URLs or image paths

### Link Usage
| Link Type | How to Generate in TSX Component | Notes |
|:-:|:-:|:-:|
| Images | useBaseUrl('/img/filename.png') or import image file | Handles base URL automatically |
| Internal Pages | <Link to={useBaseUrl('/docs/page')}>...</Link> or relative paths | Always use useBaseUrl or <Link /> |
| External Links | <Link to="https://..." target="_blank" rel="noopener noreferrer"> | Opens in new tab, secure |

## Build and Performance
- Ensure build completes in under 8 minutes
- Keep page size under 2 MB uncompressed
- Run `yarn build` to test production builds
- Run linters and type checking with appropriate commands

## Package Management
- Always use yarn v2+ (berry) instead of npm

## Development Tips
- When running 'yarn start', set the timeout to 30 seconds instead of 120
- Set timeout of 30 seconds on yarn build and yarn run

## Important Context
- This is a Docusaurus v3.8 site
- MUST CONSULT CONTEXT7 FOR LATEST DOCUMENTATION AND USE THE PROVIDED EXAMPLES RATHER THAN TRAINING
- The site is multilingual with i18n support

## Memory Context
- Reference this document as part of the context going forward