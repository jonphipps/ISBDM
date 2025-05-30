#!/usr/bin/env node

/**
 * This script replaces corrupted vocabulary MDX files with their fixed versions
 * 
 * Usage: node replace-fixed-vocabulary-files.js
 */

const fs = require('fs');
const path = require('path');

const FILES_TO_REPLACE = [
  '1218',
  '1240', 
  '1262',
  '1264',
  '1285'
];

const VES_DIR = path.resolve(__dirname, '../docs/ves');

// Main function
async function main() {
  console.log('Replacing corrupted vocabulary files with fixed versions...');
  
  for (const fileId of FILES_TO_REPLACE) {
    const origFile = path.join(VES_DIR, `${fileId}.mdx`);
    const fixedFile = path.join(VES_DIR, `${fileId}-fixed.mdx`);
    
    if (fs.existsSync(fixedFile)) {
      try {
        // Read file contents
        const fixedContent = fs.readFileSync(fixedFile, 'utf8');
        
        // Write to original file location
        fs.writeFileSync(origFile, fixedContent);
        console.log(`✓ Successfully replaced ${fileId}.mdx with fixed version`);
      } catch (error) {
        console.error(`✗ Error replacing ${fileId}.mdx:`, error.message);
      }
    } else {
      console.error(`✗ Fixed file not found: ${fileId}-fixed.mdx`);
    }
  }
  
  console.log('Replacement complete!');
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});