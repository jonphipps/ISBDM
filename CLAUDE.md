# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
ISBDM (International Standard Bibliographic Description for Manifestation) is a Docusaurus v3.8 documentation site for IFLA library standards with integrated RDF vocabulary management. This project converts legacy HTML documentation to modern MDX while preserving semantic metadata.

## Essential Commands

```bash
# Development
yarn start:patched      # Start dev server with image-size ArrayBuffer fix
yarn build:patched      # Build with image-size fix
yarn test              # Run Vitest tests
yarn typecheck         # TypeScript type checking
yarn lint              # Run ESLint
yarn test:watch        # Run tests in watch mode

# Vocabulary Management
yarn vocabulary:create  # Create new vocabulary via Google Sheets integration
yarn rdf:to-csv        # Convert RDF files to CSV format
yarn check:languages   # Check for missing language translations
yarn compare:vocabulary # Compare vocabularies (use --help for options)
yarn detect:language-mismatches-local # Detect language mismatches in local files

# Content Validation
yarn check:language-tags:ai:md # Check language tags with AI assistance in markdown
yarn lint:mdx          # Lint MDX files

# Deployment
yarn deploy            # Deploy to GitHub Pages
```

## High-Level Architecture

### Content Organization
The project maintains a parallel structure between source HTML (`ISBDM/`) and MDX documentation (`docs/`):
- **Element Documentation**: Organized by type (attributes, statements, notes, relationships)
- **Value Vocabularies** (`/ves/`): String encoding schemes with RDF metadata
- **Examples** (`/fullex/`): Full bibliographic examples numbered fx001-fx088

### Key Architectural Patterns

1. **RDF Integration**: All MDX files include RDF front matter that maps to the project's vocabulary system. This enables:
   - Content negotiation for vocabularies
   - DCTAP (Dublin Core Tabular Application Profiles) support
   - Automated vocabulary generation from spreadsheets

2. **Component Registration**: Custom React components must be:
   - Placed in `src/components/global/ComponentName/index.tsx`
   - Registered in `src/theme/MDXComponents.tsx`
   - Documented with examples in `/docs/examples/`

3. **Global Configuration**: Component defaults are centralized in `docusaurus.config.ts` under `customFields.vocabularyDefaults` to reduce front matter duplication across MDX files.

4. **Image-Size ArrayBuffer Fix**: The project uses patched start/build commands to handle a Node.js ArrayBuffer conversion issue in the image-size module (see IMAGE-SIZE-FIX.md).

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
- Always put test output into the tmp folder

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

### MDX Front Matter Structure
Elements include RDF metadata:
```yaml
uri: http://iflastandards.info/ns/isbd/elements/P1025
namespace: elements
prefLabel: has statement of coordinates and equinox
```

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
- Run `yarn build:patched` to test production builds (not `yarn build`)
- Run linters and type checking with appropriate commands

## Package Management
- Always use yarn v2+ (berry) instead of npm
- Always use yarn to manage node packages
- Traditional node_modules mode (not PnP) due to image-size compatibility

## Development Tips
- When running 'yarn start', set the timeout to 30 seconds instead of 120
- Set timeout of 30 seconds on yarn build and yarn run
- Use `yarn start:patched` and `yarn build:patched` for ArrayBuffer fix

## Important Context
- This is a Docusaurus v3.8 site with experimental_faster enabled
- MUST CONSULT CONTEXT7 FOR LATEST DOCUMENTATION AND USE THE PROVIDED EXAMPLES RATHER THAN TRAINING
- The site is multilingual with i18n support
- Original HTML source in `ISBDM/` serves as reference for conversion accuracy

## Memory Context
- Reference this document as part of the context going forward