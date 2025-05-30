# ISBDM Project Improvement Tasks

This document contains a detailed list of actionable improvement tasks for the ISBDM project, based on analysis of the codebase and requirements in specs/plan.md and specs/prd.md, with priorities aligned to the todo list in prd.md.

## Metadata and RDF Pipeline (High Priority)

1. [ ] Global settings setup for RDF properties in front matter
   - [ ] Define standard RDF properties to be included in all front matter
   - [ ] Create configuration for global RDF settings
   - [ ] Document front matter requirements for RDF generation

2. [ ] DCTAP setup from existing CSV files
   - [ ] Import and process existing DCTAP CSV files
   - [ ] Create DCTAP profiles for each content type
   - [ ] Implement profile-based validation

3. [ ] Generate JSON-LD context from DCTAP
   - [ ] Create script to generate JSON-LD context files
   - [ ] Ensure context files are properly referenced in RDF output
   - [ ] Test context with sample content

4. [ ] Verify RDF generation from front matter
   - [ ] Implement test cases for RDF generation
   - [ ] Ensure all required triples are generated
   - [ ] Validate generated RDF against schemas

5. [ ] Write RDF validator for front matter
   - [ ] Implement SHACL + DCTAP validation in CI
   - [ ] Create validation reports
   - [ ] Set up automated validation in the build process

6. [ ] Write scripts for CI to generate RDF from front matter
   - [ ] Create CLI for YAML-to-RDF conversion
   - [ ] Integrate RDF generation into CI pipeline
   - [ ] Ensure scripts are properly documented

7. [ ] Generate spreadsheet templates from DCTAP
   - [ ] Create script to generate spreadsheet templates
   - [ ] Ensure templates include all required fields
   - [ ] Document template usage

8. [ ] Script to scaffold new documents from spreadsheets
   - [ ] Create script to generate MDX from spreadsheet data
   - [ ] Ensure generated documents follow project standards
   - [ ] Test with sample spreadsheets

## Content Migration and Conversion (Medium Priority)

1. [ ] Develop directory-specific converters for each content directory
   - [ ] Create converter for introduction directory
   - [ ] Create converter for about directory
   - [ ] Create converter for examples directory
   - [ ] Create converter for relationships directory
   - [ ] Create converter for statements directory
   - [ ] Create converter for notes directory
   - [ ] Create converter for attributes directory
   - [ ] Create converter for values directory
   - [ ] Create converter for glossary directory

2. [ ] Implement content verification system
   - [ ] Develop diff-based regression tests to verify content integrity
   - [ ] Ensure tests can detect if any DOM node is silently dropped

3. [ ] Implement YAML block extraction
   - [ ] Convert semantic key/value tables to YAML blocks
   - [ ] Create custom components to render YAML blocks

4. [ ] Create one-shot conversion command
   - [ ] Develop `pnpm run convert` command
   - [ ] Create directory-specific conversion commands

## Component Architecture (Medium Priority)

5. [ ] Standardize global component library
   - [ ] Review and refactor existing global components
   - [ ] Consolidate versioned components (e.g., Figure and Figure_v1)
   - [ ] Ensure consistent props and styling across components
   - [ ] Add comprehensive JSDoc documentation to all components
   - [ ] Cleanup the components and documentation

6. [ ] Modify VocabularyTable component for glossary
   - [ ] Add URI generation/display functionality (optional)
   - [ ] Ensure component works with glossary content
   - [ ] Test with sample glossary entries

7. [ ] Implement style mapping system
   - [ ] Create mapping layer between Bootstrap classes and SASS variables/mixins
   - [ ] Ensure consistent styling in both light and dark modes

8. [ ] Set up visual regression testing
   - [ ] Implement Storybook snapshots for all components
   - [ ] Set up Playwright or Chromatic for visual diffs

## Bulk Conversion and Organization (Medium Priority)

9. [ ] Setup taskmaster/cline/roo for bulk conversions
   - [ ] Install and configure taskmaster
   - [ ] Set up cline for command-line operations
   - [ ] Configure roo for bulk processing

10. [ ] Bulk convert all non-vocabulary content
    - [ ] Convert introduction directory
    - [ ] Convert about directory
    - [ ] Convert examples directory
    - [ ] Convert relationships directory

11. [ ] Bulk convert vocabulary content
    - [ ] Convert values directory
    - [ ] Convert elements directory
    - [ ] Ensure all vocabulary content is properly structured

12. [ ] Setup sidebars
    - [ ] Configure sidebars.ts to reflect content organization
    - [ ] Ensure proper navigation structure
    - [ ] Test navigation flow

13. [ ] Build index pages for each section
    - [ ] Create index pages based on content in each section
    - [ ] Ensure consistent index page structure
    - [ ] Link index pages to main navigation

## Internationalization and Accessibility (Lower Priority)

14. [ ] Configure Crowdin integration
    - [ ] Add Crowdin-friendly markers in MDX content
    - [ ] Prepare crowdin.yml configuration
    - [ ] Test round-trip translation workflow

15. [ ] Implement accessibility compliance
    - [ ] Set up axe-core CI checks for WCAG 2.1 AA compliance
    - [ ] Fix any accessibility issues in components

## Development Workflow and CI/CD (Medium Priority)

16. [ ] Enhance CI pipeline
    - [ ] Implement comprehensive testing in CI (unit, visual, validation)
    - [ ] Set up performance monitoring
    - [ ] Configure automated deployment

17. [ ] Improve developer documentation
    - [ ] Create clear documentation for extending converters and components
    - [ ] Document development workflow and best practices
    - [ ] Add README files to key directories
    - [ ] Have A.I. write documentation for components and workflows

## Performance Optimization (Lower Priority)

18. [ ] Optimize build performance
    - [ ] Analyze and optimize build time
    - [ ] Ensure build completes in under 8 minutes in CI

19. [ ] Optimize page load performance
    - [ ] Analyze and optimize page size
    - [ ] Ensure pages are under 2 MB uncompressed

## Project Structure and Organization (Medium Priority)

20. [ ] Clean up project structure
    - [ ] Remove unused files and directories
    - [ ] Organize files according to best practices

21. [ ] Set up proper versioning
    - [ ] Configure Git-based versioning
    - [ ] Document versioning workflow

## User Experience (Medium Priority)

22. [ ] Improve documentation for content editors
    - [ ] Create guides for editing MDX + YAML
    - [ ] Document front-matter requirements
    - [ ] Provide examples of common editing tasks

23. [ ] Enhance user interface
    - [ ] Implement expand all/collapse all on sidebar
    - [ ] Adjust top navbar for '3-pillar' approach
