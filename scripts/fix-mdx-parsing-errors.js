/**
 * Script to fix MDX parsing errors in converted files
 * 
 * Usage:
 * node fix-mdx-parsing-errors.js
 */

const fs = require('fs');
const path = require('path');

// Define target directory
const targetDir = '/Users/jonphipps/Code/ISBDM/docs/fullex/';

/**
 * Fixes a single MDX file
 */
function fixFile(filePath) {
  console.log(`Fixing ${filePath}`);
  
  // Read the MDX file
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Fix the issues that cause acorn parsing errors
  let fixedContent = content
    // Replace problematic quotes with proper backtick escaping for values
    .replace(/value: "("[^"]+)"/g, 'value: "`$1`"')
    
    // Fix nested quotes in details
    .replace(/detail: "(\[[^"]+)"/g, 'detail: "`$1`"')
    
    // Fix any remaining quotes that might cause issues
    .replace(/(value|detail): "([^"]*[{}][^"]*)"/g, (match, prop, value) => {
      return `${prop}: \`${value}\``;
    });
  
  // Write the fixed file
  fs.writeFileSync(filePath, fixedContent);
  
  return { 
    fileName: path.basename(filePath),
    fixed: content !== fixedContent
  };
}

/**
 * Main function to fix all files
 */
function fixAllFiles() {
  // Get all MDX files
  const files = fs.readdirSync(targetDir)
    .filter(file => file.endsWith('.mdx') && file !== 'index.mdx')
    .map(file => path.join(targetDir, file));
  
  console.log(`Found ${files.length} MDX files to fix`);
  
  const fixedFiles = [];
  
  // Fix each file
  files.forEach(file => {
    try {
      const fileInfo = fixFile(file);
      if (fileInfo.fixed) {
        fixedFiles.push(fileInfo);
      }
      console.log(`Processed ${path.basename(file)}`);
    } catch (error) {
      console.error(`Error fixing ${file}:`, error);
    }
  });
  
  console.log(`Successfully fixed ${fixedFiles.length} files`);
}

// Run the fixing process
fixAllFiles();