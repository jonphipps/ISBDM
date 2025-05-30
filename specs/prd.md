# PRD — "Bootstrap → Docusaurus Conversion & RDF Pipeline"

## 1. Executive Summary

Migrate \~300 Bootstrap‑styled HTML documentation pages into a modern Docusaurus v3.7 site that:

* keeps the original directory hierarchy,
* converts content to clean MDX that leverages pre‑built React components,
* extracts table data as YAML key\:value blocks rendered inline,
* stores page front‑matter in YAML **and** auto‑derives valid RDF triples,
* ships DCTAP profiles to validate that RDF and power future page/spreadsheet templates,
* preserves visual styling (light + dark) closely enough that SMEs see "no difference,"
* positions the repo for seamless Crowdin i18n and Git‑based versioning.

## 2. Objectives & Success Metrics

| Objective               | Success Metric                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| Accurate conversion     | ≥ 99 % of textual content and media elements present after diff‑based regression tests           |
| Style fidelity          | Visual regression tests < 2 % pixel diff against baseline snapshots                              |
| Author friendliness     | SMEs can edit MDX + YAML without dev help; < 1 support ticket per 20 pages edited in first month |
| RDF validity            | 100 % of generated RDF passes SHACL + DCTAP validation CI job                                    |
| Automation completeness | One‑shot `pnpm run convert` (or yarn) produces a build‑ready docs tree with zero manual fixes    |
| i18n readiness          | Crowdin sync job round‑trips at least one language without merge conflicts                       |

## 3. Scope

### In‑Scope

* **Per‑directory Node scripts** that parse each HTML page, apply the agreed conversion rules, and write `*.mdx`.
* **Content verification tests** (jest/vitest) that ensure no node of the original DOM is silently dropped.
* **Style mapping** to SASS (variables/mixins) for Bootstrap classes still referenced in MDX.
* **YAML‑to‑RDF converter** CLI that consumes MDX front‑matter, emits Turtle/JSON‑LD, and runs in GitHub Actions.
* **DCTAP profile authoring** for each page type + spreadsheet template generator.
* **Crowdin config** stub plus docs for translators.

### Out of Scope (Phase 2+)

* Live site deployment, search/Algolia wiring, analytics dashboards, and editorial workflow UI.

## 4. User Personas

| Persona                         | Needs                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------ |
| **SME Editor** (non‑technical)  | Update prose, adjust YAML tables, preview instantly, trust that RDF is handled |
| **Doc Maintainer** (tech‑savvy) | Run conversion scripts, review PRs, diagnose RDF/DCTAP failures                |
| **Translator**                  | Pull Crowdin strings, translate, push back without touching code               |
| **Metadata Engineer**           | Validate RDF, extend DCTAP, generate vocab releases                            |

## 5. Content Inventory & Directory Model

* `docs/` root mirrors original site:

    * `introduction/`, `about/`, `examples/`, `relationships/`, etc.
* Each folder gets a **folder‑specific converter** because structural quirks differ (e.g., `.guid` wrappers, nested outlines).

## 6. Functional Requirements

1. **HTML → MDX Conversion**

    * Respect the live rule‑set (latest kept in `conversion‑rules.md`).
    * Preserve `<div class="guid">` blocks; flatten other non‑semantic divs.
    * Map Bootstrap tables that are semantically "key / value" to fenced YAML blocks rendered with `<YamlBlock />`.
2. **React Component Insertion**

    * Internal links → `<InLink/>`; external → `<OutLink/>`; figures → `<Figure/>`; mandatory indicators → `<Mandatory/>`; etc.
3. **Front‑Matter Enrichment**

    * YAML header includes id, title, nav label, version, language.
    * Converter CLI pipes each MDX through `yaml2rdf` (leveraging existing libs like `yaml‑rdf` or `rdf‑ext`) to produce `rdf/{slug}.ttl`.
4. **Validation Pipeline**

    * SHACL + DCTAP tests run on every PR. Failure blocks merge.
5. **DCTAP & Template Generation**

    * `pnpm run make:dctap` emits `.csv` and `.dctap.ttl` per content type.
6. **Visual Regression**

    * Storybook snapshots for every global component.
    * Playwright or Chromatic to diff converted pages vs a cleaned baseline of the original site.
7. **Internationalization Hooks**

    * MDX text wrapped in Crowdin‐friendly markers (no React props in strings).
    * `crowdin.yml` prepared but disabled until Phase 2.

## 7. Non‑Functional Requirements

* **Performance:** Build < 8 min in CI, page load < 2 MB uncompressed per doc.
* **Accessibility:** Converted markup must pass WCAG 2.1 AA via `axe-core` CI check.
* **Extensibility:** Adding a new directory conversion script must require ≤ 30 LoC.
* **Compatibility:** Node v22, Yarn Berry, Vitest, Docusaurus v3.7, SASS.

## 8. Technical Architecture

```text
HTML file
   └─> Directory‑specific converter (Node, cheerio)
         ├─> MDX file (components, YAML front‑matter)
         └─> YAML front‑matter
                  └─> yaml2rdf CLI  ──> Turtle/JSON‑LD
CI pipeline
   ├─ Vitest unit + snapshot tests
   ├─ Playwright visual diffs
   ├─ SHACL/DCTAP validation
   └─ Crowdin sync (disabled in Phase 1)
```

## 9. User Stories / Acceptance Criteria

1. **As an SME,** I can open any converted `.mdx` in VS Code or the GitHub editor, change text, and commit without breaking the build.
   *AC:* CI passes; preview site renders the change.
2. **As a Doc Maintainer,** I can run `yarn convert:introduction` and generate MDX for that folder only.
   *AC:* Script completes with no missing‑content warnings.
3. **As a Metadata Engineer,** I can run `yarn rdf:build` and get a `/rdf` folder of up‑to‑date Turtle that validates against DCTAP.
   *AC:* SHACL validation passes with zero violations.

(Add additional detailed stories as needed.)

## 10. Milestones & Timeline

| Date (T‑weeks) | Deliverable                                        |
| -------------- | -------------------------------------------------- |
| T0 (Kickoff)   | PRD signed off in Taskmaster                       |
| T+1 week       | Directory converters skeleton + CI scaffolding     |
| T+3 weeks      | 100 pages converted, validation pipeline green     |
| T+5 weeks      | All 300 pages converted, RDF generation stable     |
| T+6 weeks      | Visual regression approval, hand‑off to i18n phase |

## 11. Risks & Mitigations

| Risk                                    | Likelihood | Impact | Mitigation                                   |
| --------------------------------------- | ---------- | ------ | -------------------------------------------- |
| HTML edge‑cases drop content            | Med        | High   | Diff tests comparing DOM node counts         |
| Bootstrap class mismatch in dark mode   | Med        | Med    | SASS variables/mixins + cypress a11y audit  |
| RDF libs don't cover some YAML patterns | Low        | High   | Fallback: custom transform using `rdflib.js` |
| SME editors overwhelmed by MDX syntax   | Med        | Med    | Provide live preview plugin + doc examples   |

## 12. Dependencies

* Existing React components, tests, and docs (already built).
* Open‑source YAML→RDF tool (e.g., `yaml‑rdf`, `rdf‑ext`) or custom adapter.
* GitHub Actions runners with Node 22 + Java 17 (for SHACL).
* Crowdin API credentials (phase 2).

## 13. Open Questions

1. Which YAML→RDF library meets license/feature requirements, or do we fork?
2. Final decision on visual regression tool (Chromatic vs Playwright snapshots)?
3. Any directories whose structure deviates so much they need manual pass?

## 14. Appendix

* **Conversion Rules:** See `specs/conversion‑rules.md` (living spec).
* **Component Catalog:** See Storybook at `/storybook/`.
* **🔲 TODO‑LIST‑INSERT** *(paste your granular tasks here so Taskmaster can auto‑chunk them).*
- [ ] Global settings setup selected rdf properties in front matter
- [ ] DCTAP setup from existing csv files
- [ ] JSON-LD context from DCTAP
- [ ] verify that we can create RDF from front matter
- [ ] Write RDF validator for front matter
- [ ] Modify vocabularytable component for glossary (uri generation/display optional)
- [ ] Build index pages for each section from index on any page in that section
- [ ] Adjust top navbar for '3-pillar' approach
- [ ] Setup taskmaster/cline/roo for bulk conversions
- [ ] Bulk Convert all the non-vocabs
- [ ] Bulk Convert the values
- [ ] Bulk convert the elements
- [ ] Setup sidebars
- [ ] Write scripts for use by CI to generate RDF from front matter
- [ ] Cleanup the components and documentation
- [ ] Have A.I. write documentation
- [ ] Generate spreadsheet templates from DCTAP
- [ ] Script to scaffold new documents from spreadsheets