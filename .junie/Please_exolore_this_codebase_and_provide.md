
# ISBDM Project Overview

## Core Purpose and Functionality

The ISBDM (International Standard Bibliographic Description for Manifestation) project is a comprehensive documentation site for bibliographic standards maintained by IFLA (International Federation of Library Associations and Institutions). Its core purpose is to provide standardized documentation for describing bibliographic resources, particularly focusing on manifestations (the physical embodiment of an expression of a work).

The project is currently undergoing a significant modernization effort, migrating approximately 300 Bootstrap-styled HTML documentation pages to a modern Docusaurus v3.7 site while preserving the original content and enhancing it with semantic metadata capabilities.

## Problem Solved and Service Provided

The ISBDM project solves several problems:

1. **Standardization**: It provides internationally recognized standards for bibliographic description, ensuring consistency across libraries and information systems worldwide.

2. **Documentation**: It offers comprehensive documentation for librarians, catalogers, and metadata specialists on how to properly describe bibliographic resources.

3. **Modernization**: The current migration project specifically addresses the need to update the documentation platform from legacy HTML to a modern, component-based architecture.

4. **Semantic Enrichment**: By implementing an RDF (Resource Description Framework) pipeline, the project enhances the documentation with machine-readable metadata, enabling better interoperability and semantic capabilities.

## Main Components and Their Integration

The project consists of several key components:

1. **Content Modules**:
    - Introduction and About sections
    - Elements (Statements, Notes, Attributes, Relationships)
    - Values and Vocabularies
    - Glossary
    - Examples

2. **Technical Components**:
    - Global React components (Figure, InLink, OutLink, Mandatory, VocabularyTable, etc.)
    - Directory-specific HTML-to-MDX converters
    - YAML-to-RDF conversion pipeline
    - DCTAP (Dublin Core Tabular Application Profiles) validation system
    - Internationalization framework

These components work together to create a cohesive documentation system where content is authored in MDX with YAML front matter, converted to RDF for semantic enrichment, validated against DCTAP profiles, and rendered through Docusaurus with React components.

## Technologies, Frameworks, and Dependencies

The project leverages a modern tech stack:

- **Docusaurus v3.7**: Core documentation framework
- **React**: Frontend component library
- **MDX**: Markdown with JSX for content authoring
- **YAML**: Structured metadata in front matter
- **RDF**: Semantic data representation (Turtle/JSON-LD formats)
- **DCTAP**: Metadata validation profiles
- **SHACL**: RDF validation
- **SASS**: Modern styling approach
- **Crowdin**: Internationalization platform
- **Vitest/React Testing Library**: Testing framework
- **Playwright/Chromatic**: Visual regression testing

## Project Structure

The project follows a clear architectural structure:

- **Frontend Layer**: Docusaurus site with React components for rendering content
- **Content Layer**: MDX files with YAML front matter organized in a hierarchical directory structure
- **Data Layer**: RDF triples generated from YAML front matter, validated against DCTAP profiles
- **Testing Layer**: Comprehensive testing including unit tests, visual regression tests, and validation tests

## Primary User and Data Flow

The primary flow through the application:

1. Content is authored in MDX with structured YAML front matter
2. YAML front matter is automatically converted to RDF triples
3. RDF is validated against DCTAP profiles to ensure metadata quality
4. Content is rendered through Docusaurus with React components
5. Users navigate the documentation through the sidebar and navbar
6. Internationalization allows content to be presented in multiple languages (English, French, Spanish, German)

## Interesting Architectural Decisions

Several notable architectural decisions stand out:

1. **Directory-Specific Converters**: Rather than a one-size-fits-all approach, the project uses specialized converters for each content directory to handle unique structural quirks.

2. **YAML Block Extraction**: Semantic key/value tables are converted to YAML blocks rendered with custom components, improving maintainability and enabling metadata extraction.

3. **RDF Pipeline**: The integration of an RDF pipeline enables semantic enrichment of content, validation, and future template generation.

4. **Component-Based Architecture**: A well-designed component library ensures consistency across the site and enables non-technical users to focus on content rather than presentation.

5. **Internationalization First**: The project is designed from the ground up to support multiple languages, with Crowdin integration for translation workflows.

## Domain and Industry

The ISBDM project is firmly situated in the library and information science domain, specifically focusing on bibliographic standards. It serves professionals in:

- Libraries and archives
- Cataloging and metadata management
- Information retrieval systems
- Publishing and bibliographic data exchange

The standards documented in ISBDM are crucial for ensuring consistent description of published materials across different institutions and systems worldwide, facilitating resource discovery and information exchange in the global library community.
