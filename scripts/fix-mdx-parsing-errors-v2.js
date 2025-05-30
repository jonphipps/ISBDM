/**
 * Script to fix MDX parsing errors in converted files - Version 2
 * 
 * Usage:
 * node fix-mdx-parsing-errors-v2.js
 */

const fs = require('fs');
const path = require('path');

// Define target directory
const targetDir = '/Users/jonphipps/Code/ISBDM/docs/fullex/';

/**
 * Properly escapes a string value for use in MDX
 */
function escapeString(value) {
  // If the string contains quotes or curly braces, use the JSON.stringify 
  // approach to ensure proper escaping
  if (value.includes('"') || value.includes('{') || value.includes('}')) {
    return JSON.stringify(value);
  }
  return `"${value}"`;
}

/**
 * Fixes a single MDX file
 */
function fixFile(filePath) {
  console.log(`Fixing ${filePath}`);
  
  // Read the MDX file
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract each property separately and fix them
  // This is more robust than trying to use regex replacements
  
  // First split the content to get the entries array
  const [beforeEntries, entriesContent] = content.split('<ExampleTable\nentries={[');
  
  if (!entriesContent) {
    console.log(`Skipping ${filePath} - no entries found`);
    return { fileName: path.basename(filePath), fixed: false };
  }
  
  // Get the part after the entries array
  const [entriesArray, afterEntries] = entriesContent.split(']}\n/>');
  
  // Now process each entry separately
  const entries = entriesArray.split('},\n{');
  
  // Process the first entry (remove leading '{')
  entries[0] = entries[0].startsWith('{') ? entries[0].substring(1) : entries[0];
  
  // Process the last entry (remove trailing '}')
  const lastIndex = entries.length - 1;
  entries[lastIndex] = entries[lastIndex].endsWith('}') 
    ? entries[lastIndex].substring(0, entries[lastIndex].length - 1) 
    : entries[lastIndex];
  
  // Now process each entry
  const fixedEntries = entries.map(entry => {
    // Process each line in the entry
    const lines = entry.split('\n');
    const fixedLines = lines.map(line => {
      // Check if this is a value or detail line
      if (line.includes('value:') || line.includes('detail:')) {
        // Extract the property name and value
        const [propName, ...valueParts] = line.split(':');
        const propValue = valueParts.join(':').trim();
        
        // Remove any existing backticks, quotes, etc.
        let cleanValue = propValue;
        // If it starts with backtick + quote and ends with quote + backtick
        if (cleanValue.startsWith('`"') && cleanValue.endsWith('`"')) {
          cleanValue = cleanValue.substring(2, cleanValue.length - 2);
        } 
        // If it just has quotes
        else if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
          cleanValue = cleanValue.substring(1, cleanValue.length - 1);
        }
        
        // Now properly escape it
        const escapedValue = escapeString(cleanValue);
        return `${propName}: ${escapedValue}`;
      }
      
      return line;
    });
    
    return fixedLines.join('\n');
  });
  
  // Reconstruct the full content
  const fixedContent = 
    beforeEntries + 
    '<ExampleTable\nentries={[\n{' + 
    fixedEntries.join('},\n{') + 
    '}\n]}\n/>' + 
    afterEntries;
  
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