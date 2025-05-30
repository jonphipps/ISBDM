#!/usr/bin/env node

/**
 * Enhanced script to fix repeated examples in MDX files converted from HTML.
 * This script aggressively removes duplicate truncated examples and keeps only complete ones.
 * It also cleans up any remaining formatting issues.
 */

const fs = require('fs');
const path = require('path');

// Check if file path is provided
if (process.argv.length < 3) {
  console.error('Usage: node fix-all-repeated-examples-enhanced.js <path-to-mdx-file>');
  process.exit(1);
}

const filePath = process.argv[2];

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

// Read file content
let content = fs.readFileSync(filePath, 'utf8');

/**
 * Process a details block to clean up repeated examples
 * @param {string} block - The details block content
 * @returns {string} - The cleaned details block content
 */
function cleanDetailsBlock(block) {
  let fixedBlock = block;
  
  // First attempt to find complete examples (those with full content)
  const completeExamples = block.match(/\*\[\[[^\]]+\]\]\*/g) || [];
  
  // If we have complete examples, completely replace all example sections
  if (completeExamples.length > 0) {
    // Extract the individual example sections (table and example lines)
    const tableSections = fixedBlock.match(/\s*\| Property \| Value \|\s*\n\s*\|:[-]+\|:[-]+\|\s*\n[\s\S]*?<hr \/>/g) || [];
    
    // For each table section, replace it with a cleaned version
    for (const tableSection of tableSections) {
      // Find complete examples in this section
      const sectionCompleteExamples = tableSection.match(/\*\[\[[^\]]+\]\]\*/g) || [];
      
      if (sectionCompleteExamples.length > 0) {
        // Keep only complete examples
        const cleanedTableSection = `
    | Property | Value |
    |:---------|:------|

    ${sectionCompleteExamples[0]}
    

    <hr />
`;
        fixedBlock = fixedBlock.replace(tableSection, cleanedTableSection);
      }
      else {
        // Fallback: if no complete examples, take first line
        const firstExample = tableSection.match(/\*\[\[[^\n]+/);
        if (firstExample) {
          const cleanedTableSection = `
    | Property | Value |
    |:---------|:------|

    ${firstExample[0]}
    

    <hr />
`;
          fixedBlock = fixedBlock.replace(tableSection, cleanedTableSection);
        }
      }
    }
  }
  else {
    // No complete examples found, try to clean up repeated lines
    // Find repeating patterns of unfinished example lines
    const repeatedPatterns = fixedBlock.match(/(\*\[\[[^\n]+\n\s*){2,}/g) || [];
    
    for (const pattern of repeatedPatterns) {
      // Extract the first example line
      const firstExample = pattern.match(/\*\[\[[^\n]+/);
      if (firstExample) {
        // Replace the whole pattern with just the first example line
        fixedBlock = fixedBlock.replace(pattern, firstExample[0] + '\n\n    ');
      }
    }
  }
  
  // Clean up empty tables
  fixedBlock = fixedBlock.replace(
    /\|\s*Property\s*\|\s*Value\s*\|\n\s*\|:[-]+\|:[-]+\|\n+\s*\n+\s*<hr \/>/g, 
    '<hr />'
  );
  
  // Make sure all tables have proper formatting
  fixedBlock = fixedBlock.replace(
    /\|\s*Property\s*\|\s*Value\s*\|\n\s*\|:[-]+\|:[-]+\|\n+\s*(\*\[\[)/g,
    '| Property | Value |\n    |:---------|:------|\n\n    $1'
  );
  
  // Ensure proper formatting when details tag is immediately followed by a table
  fixedBlock = fixedBlock.replace(
    /<summary>Examples<\/summary>\s*\|/g,
    '<summary>Examples</summary>\n\n    |'
  );
  
  // Fix table formatting after hr or content separators
  fixedBlock = fixedBlock.replace(
    /<hr \/>\s*\|/g,
    '<hr />\n\n    |'
  );
  
  // Add proper line breaks between consecutive tables
  fixedBlock = fixedBlock.replace(
    /\| (\*\[\[.*?\]\]\*) \|\s*\n\s*\|/g,
    '| $1 |\n\n    |'
  );
  
  // Fix formatting for details with no examples
  if (!fixedBlock.includes('*[[') && !fixedBlock.includes('| Property | Value |')) {
    return '';
  }
  
  return fixedBlock;
}

// Get all details blocks
const detailsBlocks = content.match(/<details>[\s\S]*?<\/details>/g) || [];

// Process each details block
for (const block of detailsBlocks) {
  const fixedBlock = cleanDetailsBlock(block);
  
  // If the block was cleaned to empty, remove it entirely
  if (fixedBlock === '') {
    content = content.replace(block, '');
  } 
  // Otherwise replace with the fixed version
  else if (fixedBlock !== block) {
    content = content.replace(block, fixedBlock);
  }
}

// Final cleanup
// Remove empty details blocks
content = content.replace(/<details>\s*<summary>Examples<\/summary>\s*(<hr \/>)?\s*<\/details>/g, '');

// Remove empty stipulation divs
content = content.replace(/<div className="stip">\s*<\/div>/g, '');

// Remove excessive blank lines
content = content.replace(/\n{3,}/g, '\n\n');

// Fix indentation of examples
content = content.replace(/\n\s{2}\*\[\[/g, '\n    *[[');

// Write the fixed content back to the file
fs.writeFileSync(filePath, content);
console.log(`Successfully fixed repeated examples in ${filePath}`);