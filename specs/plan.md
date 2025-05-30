# ISBDM Project Improvement Plan

## 1. Executive Overview

This document outlines a comprehensive improvement plan for the ISBDM (International Standard Bibliographic Description for Manifestation) project, based on the requirements specified in the Product Requirements Document (PRD). The plan addresses the migration of approximately 300 Bootstrap-styled HTML documentation pages to a modern Docusaurus v3.7 site, with a focus on maintaining content integrity, enhancing metadata capabilities through RDF, and ensuring a seamless experience for all stakeholders.

## 2. Key Goals and Constraints

### Primary Goals
- Migrate ~300 Bootstrap-styled HTML pages to Docusaurus v3.7 while preserving the original directory hierarchy
- Convert content to clean MDX with pre-built React components
- Implement YAML-to-RDF conversion for metadata enrichment
- Ensure visual fidelity between original and converted content
- Position the repository for internationalization and versioning

### Key Constraints
- Maintain ≥99% content accuracy during conversion
- Keep visual regression under 2% pixel difference
- Ensure non-technical SMEs can edit content without developer assistance
- Complete automated conversion with zero manual fixes required
- Meet performance targets (build <8 min, page load <2 MB)
- Ensure WCAG 2.1 AA accessibility compliance

## 3. Content Migration Strategy

### Rationale
The current Bootstrap-based documentation requires modernization to leverage the benefits of a component-based architecture, improved metadata handling, and better maintainability. A systematic approach to content migration will ensure consistency and minimize content loss.

### Proposed Improvements
1. **Directory-Specific Converters**
   - Develop specialized converters for each content directory to handle unique structural quirks
   - Rationale: Different sections of the documentation have evolved with distinct HTML patterns that require targeted conversion logic

2. **Content Verification System**
   - Implement diff-based regression tests to verify content integrity
   - Rationale: Ensures no content is lost during conversion, addressing the 99% content preservation requirement

3. **YAML Block Extraction**
   - Convert semantic key/value tables to YAML blocks rendered with custom components
   - Rationale: Improves maintainability and enables metadata extraction while preserving the visual presentation

## 4. Component Architecture

### Rationale
A well-designed component architecture will ensure consistency across the site, improve maintainability, and enable non-technical users to focus on content rather than presentation.

### Proposed Improvements
1. **Global Component Library**
   - Develop standardized components for common elements (links, figures, mandatory indicators)
   - Rationale: Ensures consistency and reduces duplication across the documentation

2. **Style Mapping System**
   - Create a mapping layer between Bootstrap classes and SASS variables/mixins
   - Rationale: Preserves visual styling while transitioning to a more modern CSS approach

3. **Visual Regression Testing**
   - Implement Storybook snapshots and Playwright/Chromatic visual diffs
   - Rationale: Ensures visual fidelity meets the <2% pixel difference requirement

## 5. Metadata and RDF Pipeline

### Rationale
The RDF pipeline is a core requirement that enables semantic enrichment of content, validation, and future template generation. A robust implementation will ensure data integrity and extensibility.

### Proposed Improvements
1. **Front-Matter Standardization**
   - Define a consistent YAML header structure for all MDX files
   - Rationale: Provides a reliable source for RDF generation and improves content organization

2. **YAML-to-RDF Conversion System**
   - Evaluate and implement a YAML-to-RDF conversion tool
   - Rationale: Enables automatic generation of Turtle/JSON-LD from content metadata

3. **DCTAP Profile Development**
   - Create DCTAP profiles for each content type
   - Rationale: Provides validation rules and powers template generation for future content

4. **Validation Pipeline**
   - Implement SHACL + DCTAP validation in CI
   - Rationale: Ensures 100% of generated RDF meets quality standards

## 6. Internationalization and Accessibility

### Rationale
Preparing for internationalization from the start will reduce future rework, while ensuring accessibility compliance is essential for all users.

### Proposed Improvements
1. **Crowdin Integration**
   - Configure Crowdin-friendly markers in MDX content
   - Prepare crowdin.yml configuration
   - Rationale: Positions the repository for seamless translation workflows

2. **Accessibility Compliance**
   - Implement axe-core CI checks for WCAG 2.1 AA compliance
   - Rationale: Ensures the converted site meets accessibility standards

## 7. Development Workflow and Automation

### Rationale
Efficient development workflows and automation are essential for meeting the project timeline and ensuring consistent quality.

### Proposed Improvements
1. **Conversion Automation**
   - Develop a one-shot conversion command (`pnpm run convert`)
   - Create directory-specific conversion commands
   - Rationale: Enables efficient conversion of content with minimal manual intervention

2. **CI Pipeline Enhancement**
   - Implement comprehensive testing in CI (unit, visual, validation)
   - Rationale: Ensures quality at every stage of development

3. **Developer Documentation**
   - Create clear documentation for extending converters and components
   - Rationale: Supports the extensibility requirement of ≤30 LoC for new converters

## 8. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
1. Set up global settings and component architecture
2. Develop directory converter skeleton and CI scaffolding
3. Implement DCTAP setup and validation framework

### Phase 2: Content Conversion (Weeks 3-5)
1. Convert non-vocabulary content
2. Convert values and elements content
3. Set up sidebars and navigation structure

### Phase 3: Refinement and Validation (Weeks 5-6)
1. Implement RDF generation and validation
2. Complete visual regression testing
3. Finalize documentation and handoff for internationalization

## 9. Risk Management

| Risk Area | Mitigation Strategy |
|-----------|---------------------|
| Content Integrity | Implement comprehensive diff tests and content verification |
| Visual Fidelity | Use SASS variables/mixins and visual regression testing |
| RDF Generation | Evaluate multiple libraries and prepare fallback options |
| User Experience | Provide documentation and live preview for content editors |
| Performance | Implement performance monitoring in CI pipeline |

## 10. Success Criteria and Evaluation

The implementation will be considered successful when:
1. All 300 pages are converted with ≥99% content accuracy
2. Visual regression tests show <2% pixel difference
3. RDF generation is stable and passes validation
4. Non-technical users can edit content without developer assistance
5. The site is ready for internationalization

This plan provides a structured approach to meeting the requirements specified in the PRD while addressing potential challenges and ensuring a high-quality outcome for all stakeholders.
