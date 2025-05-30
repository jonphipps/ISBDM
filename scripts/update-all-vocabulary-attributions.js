const fs = require('fs');
const path = require('path');
const convertHtmlVocabularyToMdx = require('./convert-html-vocabulary-to-mdx-updated');

/**
 * Updates all converted vocabulary files to ensure they include attribution sections
 */
async function updateAllVocabularyAttributions() {
  // Files with known attributions that need updating
  const filesToUpdate = [
    '1262', '1264', '1218', '1240', '1285'
  ];
  
  const sourceDir = path.resolve(__dirname, '../ISBDM/docs/ves');
  const targetDir = path.resolve(__dirname, '../docs/ves');
  
  console.log('Updating vocabulary files with attributions...');
  
  const results = {
    success: [],
    failed: []
  };
  
  for (const fileId of filesToUpdate) {
    const htmlFile = path.join(sourceDir, `${fileId}.html`);
    const mdxFile = path.join(targetDir, `${fileId}.mdx`);
    
    // Only process if both source HTML and target MDX exist
    if (fs.existsSync(htmlFile) && fs.existsSync(mdxFile)) {
      console.log(`Processing ${fileId}.html...`);
      
      try {
        // Create a backup of the original MDX file
        const backupFile = path.join(targetDir, `${fileId}-backup.mdx`);
        fs.copyFileSync(mdxFile, backupFile);
        console.log(`  Created backup at ${backupFile}`);
        
        // Convert HTML to MDX with updated script that includes attributions
        const result = convertHtmlVocabularyToMdx(htmlFile, mdxFile);
        
        if (result.success) {
          console.log(`  Updated ${fileId}.mdx successfully`);
          results.success.push({
            fileId,
            hasAttribution: result.hasAttribution
          });
        } else {
          console.error(`  Failed to update ${fileId}.mdx: ${result.error}`);
          results.failed.push({
            fileId,
            error: result.error
          });
        }
      } catch (error) {
        console.error(`  Error processing ${fileId}: ${error.message}`);
        results.failed.push({
          fileId,
          error: error.message
        });
      }
    } else {
      console.warn(`  Missing source HTML or target MDX for ${fileId}`);
      results.failed.push({
        fileId,
        error: 'Missing source HTML or target MDX file'
      });
    }
  }
  
  // Print summary
  console.log('\nUpdate Summary:');
  console.log(`Total files processed: ${filesToUpdate.length}`);
  console.log(`Successful updates: ${results.success.length}`);
  console.log(`Failed updates: ${results.failed.length}`);
  
  if (results.success.length > 0) {
    console.log('\nSuccessfully updated files:');
    results.success.forEach(({ fileId, hasAttribution }) => {
      console.log(`  - ${fileId}.mdx ${hasAttribution ? '(attribution found)' : '(no attribution found)'}`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log('\nFailed updates:');
    results.failed.forEach(({ fileId, error }) => {
      console.log(`  - ${fileId}.mdx: ${error}`);
    });
  }
  
  return results;
}

// Run the function if this script is executed directly
if (require.main === module) {
  updateAllVocabularyAttributions()
    .then(() => console.log('Update process completed'))
    .catch(error => {
      console.error('Update process failed:', error);
      process.exit(1);
    });
}

module.exports = updateAllVocabularyAttributions;