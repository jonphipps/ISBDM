# Adding Vocabulary Creation Button to README

Add one of these options to your README.md:

## Option 1: Direct GitHub Actions Link

```markdown
[![Create New Vocabulary](https://img.shields.io/badge/📊_Create-New_Vocabulary-blue.svg?style=for-the-badge)](https://github.com/YOUR_ORG/ISBDM/actions/workflows/create-vocabulary-sheet.yml)
```

## Option 2: HTML Button (for GitHub Pages)

```html
<a href="https://your-github-pages-site.com/create-vocabulary-form.html" style="display: inline-block; padding: 10px 20px; background-color: #0366d6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
  📊 Create New Vocabulary
</a>
```

## Option 3: Issue Template

Create `.github/ISSUE_TEMPLATE/new-vocabulary.yml`:

```yaml
name: New Vocabulary Request
description: Request creation of a new ISBDM vocabulary
title: "[VOCAB]: "
labels: ["vocabulary", "automation"]
body:
  - type: dropdown
    id: profile-type
    attributes:
      label: Profile Type
      options:
        - values
        - elements
    validations:
      required: true
  
  - type: input
    id: vocabulary-name
    attributes:
      label: Vocabulary Name
      description: Lowercase with hyphens only (e.g., sensory-specification)
      placeholder: my-vocabulary
    validations:
      required: true
  
  - type: input
    id: title
    attributes:
      label: Title
      placeholder: My Vocabulary Title
    validations:
      required: true
  
  - type: textarea
    id: description
    attributes:
      label: Description
      placeholder: Describe the purpose and scope of this vocabulary
    validations:
      required: true
  
  - type: checkboxes
    id: languages
    attributes:
      label: Languages
      options:
        - label: English (en)
          required: true
        - label: French (fr)
        - label: Spanish (es)
        - label: German (de)
        - label: Italian (it)
        - label: Portuguese (pt)
```

Then add to README:

```markdown
[📊 Create New Vocabulary](https://github.com/YOUR_ORG/ISBDM/issues/new?template=new-vocabulary.yml)
```

## Option 4: Markdown Table with Links

```markdown
## Vocabulary Management

| Action | Description |
|--------|-------------|
| [📊 Create New Vocabulary](https://github.com/YOUR_ORG/ISBDM/actions/workflows/create-vocabulary-sheet.yml) | Create a new vocabulary spreadsheet |
| [📋 View Existing Vocabularies](https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID) | Browse current vocabularies |
| [📖 Documentation](./docs/vocabulary-creation-guide.md) | Learn about the vocabulary system |
```