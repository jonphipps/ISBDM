#!/usr/bin/env node

/**
 * Specialized script to fix table formatting in MDX files
 */

const fs = require('fs');
const path = require('path');

// Check if file path is provided
if (process.argv.length < 3) {
  console.error('Usage: node fix-tables.js <path-to-mdx-file>');
  process.exit(1);
}

const filePath = process.argv[2];

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

// Read file content
const content = fs.readFileSync(filePath, 'utf8');

// Find all details blocks with tables
const detailsBlocks = content.match(/<details>[\s\S]*?<\/details>/g) || [];
let fixedContent = content;

detailsBlocks.forEach(block => {
  // Create a fixed version of the block
  let fixedBlock = block;
  
  // Ensure proper spacing
  fixedBlock = fixedBlock.replace(/<details>\s*\n\s*<summary>/g, '<details>\n  <summary>');
  fixedBlock = fixedBlock.replace(/<\/summary>\s*\n/g, '</summary>\n\n');
  
  // Start fresh with a proper table header
  fixedBlock = fixedBlock.replace(/<\/summary>\s*\n/g, '</summary>\n\n    | Property | Value |\n    |:---------|:------|\n');
  
  // Remove any duplicate headers
  fixedBlock = fixedBlock.replace(/\n\s*\| Property \| Value \|\s*\n\s*\|:[-]+\|:[-]+\|\s*\n\s*\| Property \| Value \|\s*\n\s*\|:[-]+\|:[-]+\|\s*\n/g, 
                               '\n    | Property | Value |\n    |:---------|:------|\n');
  fixedBlock = fixedBlock.replace(/\n\s*\| Property \| Value \|\s*\n\s*\|:[-]+\|:[-]+\|\s*\n/g, 
                               '\n    | Property | Value |\n    |:---------|:------|\n');
  
  // Fix the table rows: first completely reconstruct the tables
  
  // Find all tables in the block
  const tables = [];
  let currentTable = { header: null, rows: [] };
  
  const lines = fixedBlock.split('\n');
  let inTable = false;
  
  lines.forEach(line => {
    const trimmedLine = line.trim();
    
    // Detect table header
    if (trimmedLine.startsWith('| Property | Value |')) {
      inTable = true;
      currentTable.header = trimmedLine;
      return;
    }
    
    // Detect table separator
    if (trimmedLine.startsWith('|:') && trimmedLine.includes('---|')) {
      if (inTable) {
        currentTable.separator = trimmedLine;
      }
      return;
    }
    
    // Detect table content rows
    if (inTable && trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      const parts = trimmedLine.split('|').filter(p => p !== '');
      if (parts.length >= 2) {
        currentTable.rows.push({
          property: parts[0].trim(),
          value: parts.slice(1).join('|').trim()
        });
      }
    } 
    // End of table detection
    else if (inTable && (!trimmedLine.startsWith('|') || trimmedLine === '')) {
      if (currentTable.header && currentTable.rows.length > 0) {
        tables.push({...currentTable});
        currentTable = { header: null, rows: [] };
      }
      inTable = false;
    }
  });
  
  // Add the last table if it exists
  if (inTable && currentTable.header && currentTable.rows.length > 0) {
    tables.push({...currentTable});
  }
  
  // Reconstruct tables with proper formatting
  tables.forEach(table => {
    // Old table content as regex pattern for replacement
    const tableStartPattern = table.header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Construct new table content
    let newTableContent = '\n    | Property | Value |\n    |:---------|:------|\n';
    
    table.rows.forEach(row => {
      // Properly format the cells
      const property = row.property.trim();
      const value = row.value.trim();
      
      newTableContent += `    | ${property} | ${value} |\n`;
    });
    
    // Find the existing table in the block and try to replace it
    try {
      const tablePattern = new RegExp(`${tableStartPattern}[\\s\\S]*?\\n(\\s*\\n|\\s*\\*|\\s*<hr)`, 'g');
      const tableMatch = fixedBlock.match(tablePattern);
      
      if (tableMatch && tableMatch[0]) {
        // Preserve what comes after the table
        const afterTable = tableMatch[0].match(/(\s*\n|\s*\*|\s*<hr)$/);
        const suffix = afterTable ? afterTable[0] : '';
        
        fixedBlock = fixedBlock.replace(tableMatch[0], newTableContent + suffix);
      } else {
        // Try a different approach if the first pattern didn't match
        const simpleTableStart = '| Property | Value |';
        const startIndex = fixedBlock.indexOf(simpleTableStart);
        
        if (startIndex !== -1) {
          // Find the end of the table (next empty line or specific markers)
          let endIndex = fixedBlock.indexOf('\n\n', startIndex);
          const asteriskIndex = fixedBlock.indexOf('*[[', startIndex);
          const hrIndex = fixedBlock.indexOf('<hr', startIndex);
          
          if (asteriskIndex !== -1 && (endIndex === -1 || asteriskIndex < endIndex)) {
            endIndex = asteriskIndex;
          }
          
          if (hrIndex !== -1 && (endIndex === -1 || hrIndex < endIndex)) {
            endIndex = hrIndex;
          }
          
          if (endIndex !== -1) {
            // Get the content after the table that we want to preserve
            const afterTable = fixedBlock.substring(endIndex);
            
            // Replace the table section
            fixedBlock = fixedBlock.substring(0, startIndex) + newTableContent + afterTable;
          }
        }
      }
    } catch (err) {
      console.error('Error replacing table:', err);
    }
  });
  
  // Replace with properly indented rows
  const tableLines = fixedBlock.split('\n');
  const fixedLines = tableLines.map(line => {
    if (line.trim().startsWith('|') && !line.trim().startsWith('|:')) {
      return '    ' + line.trim();
    }
    if (line.trim().startsWith('|:')) {
      return '    ' + line.trim();
    }
    return line;
  });
  
  fixedBlock = fixedLines.join('\n');
  
  // Fix spacing around the text after tables
  fixedBlock = fixedBlock.replace(/\n\s*\*\[\[/g, '\n\n    *[[');
  fixedBlock = fixedBlock.replace(/\]\]\*\s*\n/g, ']]* \n');
  
  // Fix horizontal rules
  fixedBlock = fixedBlock.replace(/<hr \/>\s*\n/g, '\n    <hr />\n');
  
  // Replace the original block
  fixedContent = fixedContent.replace(block, fixedBlock);
});

// Fix YAML frontmatter
let frontmatterMatch = fixedContent.match(/^---\n([\s\S]*?)\n---/);
if (frontmatterMatch) {
  const frontmatter = frontmatterMatch[1];
  const cleanFrontmatter = frontmatter.trim();
  fixedContent = fixedContent.replace(frontmatterMatch[0], `---\n${cleanFrontmatter}\n---`);
}

// Write the fixed content back to the file
fs.writeFileSync(filePath, fixedContent);
console.log(`Successfully fixed tables in ${filePath}`);