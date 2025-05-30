# Product Requirements Document: HTML to MDX Conversion Tool

## 1. Elevator Pitch
A one-time developer tool to accurately and losslessly convert 300+ highly structured HTML documentation pages into MDX format for use in a Docusaurus site. The tool ensures semantic fidelity, applies a predefined set of React components to reconstitute structural meaning, and logs any formatting anomalies for manual review.

## 2. Who is this app for
This tool is for developers working on the ISBDM documentation site migration. It will be run once to bootstrap a clean MDX version of the existing HTML-based prototype. The output will be edited and maintained by non-technical subject matter experts in markdown format through GitHub.

## 3. Functional Requirements
- Parse and convert each HTML file to a corresponding `.mdx` file.
- Identify and transform known structural patterns into pre-defined React components (e.g. `<Mandatory>`, `<Stipulation>`, `<ExampleBlock>`, `<ElementReference>`).
- Guarantee that no text content is lost in the conversion.
- Detect and log unexpected or unrecognized structures.
- Output logs that include warnings, errors, and transformation summaries per file.
- Halt the process if the number of errors exceeds a configurable threshold.
- Support a test mode that compares output `.mdx` files to expected results for regression verification.

## 4. User Stories
- As a developer, I want to run a single script that converts all HTML files to MDX so I can integrate them into Docusaurus.
- As a developer, I want to see a log of transformations and warnings so I can review edge cases manually.
- As a developer, I want to ensure that all visible HTML content has been included in the MDX output so we don’t lose meaning.
- As a project maintainer, I want to reuse structural patterns in the content to render components consistently in React.

## 5. User Interface
This is a CLI (command-line interface) tool with no graphical UI. It will:
- Take a directory of HTML files as input.
- Output converted `.mdx` files into a parallel directory structure.
- Generate a detailed log file per input file.
- Optionally accept a `--test` flag to compare output against expected `.mdx` files.

---

The output `.mdx` files will be human-readable, versionable in Git, and compatible with Docusaurus 3.7. Custom components will be imported at the top of each file as needed. All output will be formatted using Prettier and validated for MDX syntax compliance.

## 6. Acceptance Criteria
- ✅ All input HTML files are converted to MDX without missing visible content.
- ✅ Known semantic structures are transformed into the correct React components.
- ✅ A log file is generated for each HTML input documenting errors and transformations.
- ✅ Process halts if the number of logged errors exceeds a configurable threshold.
- ✅ The CLI can be run in test mode to validate output against known-good MDX files.
- ✅ Output MDX files are Prettier-formatted and pass MDX validation.

## 7. Implementation Notes
- Use `jsdom` for parsing the HTML DOM structure.
- Use a conversion map (class name → React component) to guide transformations.
- Implement unit tests for each known HTML pattern and its expected MDX output.
- Provide a configuration file or CLI flag to set the max allowable errors.

## 8. Test Plan
- ✔ Snapshot test: HTML input → expected `.mdx` output.
- ✔ Fuzz test: Unexpected input structures should be logged but not crash.
- ✔ Log test: Confirm logs contain accurate and complete summaries.
- ✔ Threshold test: Simulate error overflow to trigger halt behavior.
- ✔ Regression test: Re-run test suite after component or logic changes.
- ✔ Manual review of a random sample to ensure human readability and accuracy.

## 9. Roadmap & Task Prioritization

### Phase 1: Foundations (High Priority)
- [ ] Define all known structural HTML patterns and their associated React components.
- [ ] Prepare a set of 5–10 representative HTML input samples and expected MDX outputs.
- [ ] Create test harness: assert `.output.mdx` matches `.expected.mdx`.
- [ ] Build basic HTML → AST parser using `jsdom`.

### Phase 2: Component Matching & Conversion Engine
- [ ] Implement transformation logic for:
  - [ ] Paragraphs and headings
  - [ ] Lists
  - [ ] Custom blocks (`guid`, `stipulation`, `mandatory`, etc.)
  - [ ] Example blocks
  - [ ] Internal links
- [ ] Generate import statements for used components.
- [ ] Create logging system (warnings, errors, summary).

### Phase 3: Quality Assurance
- [ ] Run test harness across all samples.
- [ ] Tune component matching rules.
- [ ] Add support for fallback rendering with warning if unknown structure detected.
- [ ] Validate output formatting with Prettier and MDX parser.

### Phase 4: Finalization
- [ ] Add CLI interface with flags for dry-run, output directory, max-errors.
- [ ] Write documentation.
- [ ] Run final conversion on full HTML directory.

## 10. Input Requirements
- Source directory of HTML files (validated prototype content).
- Known-good `.mdx` examples for a subset of pages to validate correctness.
- Mapping spec from HTML structure/class → component (e.g. `div.guid` → `<Stipulation>`).
- Prettier config and MDX validation ruleset.

## 11. Output Requirements
- Converted `.mdx` files, one per HTML file, preserving filename conventions.
- MDX files include accurate imports for components used in that file.
- Logs: one log per file + one global summary (counts of warnings, errors, conversions).
- Optional: `.expected.mdx` file for testing framework to validate transformation.
