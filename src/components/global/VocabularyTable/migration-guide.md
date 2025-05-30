# VocabularyTable Migration Guide

This guide will help you migrate from the single-file VocabularyTable component to the new organized folder structure.

## Quick Summary

✅ **Good News**: All existing usage continues to work unchanged!  
✅ **Import paths stay the same**  
✅ **All props work exactly as before**  
✅ **Backward compatibility maintained**  

## Step-by-Step Migration

### 1. **Backup Your Current Component**

```bash
# Create backup of existing component
cp -r src/components/global/VocabularyTable.tsx src/components/global/VocabularyTable.tsx.backup
cp -r src/components/global/VocabularyTable/ src/components/global/VocabularyTable.backup/
```

### 2. **Replace with New Folder Structure**

Create the new folder structure:

```bash
mkdir -p src/components/global/VocabularyTable/hooks
mkdir -p src/components/global/VocabularyTable/__tests__
```

Then place the new files from the artifacts:

- `src/components/global/VocabularyTable/index.tsx`
- `src/components/global/VocabularyTable/VocabularyTable.tsx`
- `src/components/global/VocabularyTable/CSVVocabulary.tsx`
- `src/components/global/VocabularyTable/types.ts`
- `src/components/global/VocabularyTable/utils.ts`
- `src/components/global/VocabularyTable/styles.module.scss`
- `src/components/global/VocabularyTable/hooks/useCsvLoader.ts`
- `src/components/global/VocabularyTable/hooks/useMultilingualText.ts`
- `src/components/global/VocabularyTable/__tests__/VocabularyTable.test.tsx`

### 3. **Remove Old Files**

```bash
# Remove old single-file component (only after verifying new one works)
rm src/components/global/VocabularyTable.tsx
rm src/components/global/VocabularyTable.test.tsx  # if it exists
rm src/components/global/styles.module.scss  # if it exists in global
```

### 4. **Install Additional Dependencies** (if needed)

The component uses Papa Parse for CSV processing:

```bash
npm install papaparse
npm install --save-dev @types/papaparse
```

### 5. **Update Your Docusaurus Config** (Optional)

Add multilingual defaults to your `docusaurus.config.ts`:

```typescript
export default {
  // ... existing config
  customFields: {
    vocabularyDefaults: {
      prefix: "isbdm",
      startCounter: 1000,
      uriStyle: "numeric",
      caseStyle: "kebab-case",
      showFilter: true,
      filterPlaceholder: "Filter vocabulary terms...",
      showTitle: false,
      showLanguageSelector: true,
      defaultLanguage: "en",
      availableLanguages: ["en", "fr", "es", "de", "it", "ru", "zh"]
    }
  }
};
```

### 6. **Test Your Existing Components**

All your existing vocabulary pages should continue working:

```mdx
<!-- This continues to work unchanged -->
---
vocabularyId: "1275"
title: "ISBDM Extent of Unitary Structure value vocabulary"
concepts:
  - value: "activity card"
    definition: "A unit of extent..."
---

<VocabularyTable {...frontMatter} />
```

### 7. **Start Using New Features** (Optional)

Now you can use the new features:

#### CSV File Loading
```mdx
<!-- New simplified CSV usage -->
<VocabularyTable csvFile="vocabularies/csv/sensoryspecification.csv" />
```

#### Multilingual Content
```mdx
---
title:
  en: "English Title"
  fr: "Titre français"
concepts:
  - value:
      en: "term"
      fr: "terme"
    definition:
      en: "English definition"
      fr: "Définition française"
---

<VocabularyTable {...frontMatter} />
```

## Troubleshooting

### Import Errors

**Problem**: `Module not found: Can't resolve '@site/src/components/global/VocabularyTable'`

**Solution**: Make sure `index.tsx` exists in the VocabularyTable folder and exports the component properly.

### CSS/Styling Issues

**Problem**: Styles are not loading or look different

**Solution**: 
1. Ensure `styles.module.scss` is in the VocabularyTable folder
2. Check that the import path in `VocabularyTable.tsx` is correct: `import styles from './styles.module.scss';`

### TypeScript Errors

**Problem**: Type errors after migration

**Solution**:
1. Make sure all files from the artifacts are properly placed
2. Check that `types.ts` exports are correct
3. Verify imports in component files

### CSV Loading Not Working

**Problem**: CSV files are not loading

**Solution**:
1. Install Papa Parse: `npm install papaparse @types/papaparse`
2. Ensure CSV files are in the `static/` directory or accessible via public URLs
3. Check browser console for fetch errors

## Verification Steps

### 1. **Test Basic Functionality**
```bash
npm start
```
Visit a page with VocabularyTable and verify:
- ✅ Component renders
- ✅ Filtering works
- ✅ Expandable details work
- ✅ URIs are generated correctly

### 2. **Test New CSV Feature**
Create a test CSV file and verify:
- ✅ CSV loads successfully
- ✅ Loading state appears
- ✅ Error handling works for invalid files

### 3. **Test Multilingual Features**
If you have multilingual content:
- ✅ Language selector appears
- ✅ Language switching works
- ✅ Fallback languages work correctly

### 4. **Test Static Methods**
```javascript
// In browser console
VocabularyTable.generateTOC(props);  // Should work
VocabularyTable.exportToCSV(props); // Should work
```

## Rollback Plan

If something goes wrong, you can quickly rollback:

```bash
# Restore backup
rm -rf src/components/global/VocabularyTable/
cp src/components/global/VocabularyTable.tsx.backup src/components/global/VocabularyTable.tsx

# Restart development server
npm start
```

## What's New vs. What's Changed

### ✨ **New Features Available**
- CSV file loading with `csvFile` prop
- Multilingual content support
- Locale-aware language detection
- Enhanced error handling
- Loading states for CSV files
- Custom hooks for better performance
- Comprehensive test coverage

### 🔄 **What Changed Internally**
- Code split into multiple files for maintainability
- Better TypeScript support
- Custom hooks for state management
- Enhanced CSS with better responsive design

### 📦 **What Stayed the Same**
- All existing props work unchanged
- Import paths remain the same
- All existing functionality preserved
- Performance characteristics
- API compatibility

## Need Help?

If you encounter issues during migration:

1. **Check the backup files** to compare old vs. new
2. **Review the test files** for usage examples
3. **Check browser console** for error messages
4. **Verify file structure** matches the expected layout
5. **Test with a simple example** first before migrating complex vocabularies

The migration should be seamless, but the new structure provides much better maintainability and new features for future development!
