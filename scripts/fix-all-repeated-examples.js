#!/usr/bin/env node

/**
 * Script to fix repeated examples in MDX files converted from HTML.
 * This script aggressively removes duplicate truncated examples and keeps only complete ones.
 */

const fs = require('fs');
const path = require('path');

// Check if file path is provided
if (process.argv.length < 3) {
  console.error('Usage: node fix-all-repeated-examples.js <path-to-mdx-file>');
  process.exit(1);
}

const filePath = process.argv[2];

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

// Read file content
let content = fs.readFileSync(filePath, 'utf8');

// Get all blocks with repeated examples
const detailsBlocks = content.match(/<details>[\s\S]*?<\/details>/g) || [];

for (const block of detailsBlocks) {
  let fixedBlock = block;
  
  // Step 1: Find sections with many truncated example lines
  const chunkedExampleSections = fixedBlock.match(/(\*\[\[[^\]]+\n)+(\s*\n)*/g) || [];
  
  for (const section of chunkedExampleSections) {
    // Identify all example lines
    const exampleLines = section.match(/\*\[\[[^\n]+/g) || [];
    
    if (exampleLines.length > 3) {
      // Find complete examples (those ending with "]]* ")
      const completeExamples = exampleLines.filter(line => line.includes(']]* '));
      
      // If we have complete examples, keep only those
      if (completeExamples.length > 0) {
        const cleanedSection = completeExamples.join('\n\n    ') + '\n\n    ';
        fixedBlock = fixedBlock.replace(section, cleanedSection);
      } 
      // Otherwise, keep just the first example
      else {
        const cleanedSection = exampleLines[0] + '\n\n    ';
        fixedBlock = fixedBlock.replace(section, cleanedSection);
      }
    }
  }
  
  // Step 2: Clean up empty tables
  fixedBlock = fixedBlock.replace(
    /\|\s*Property\s*\|\s*Value\s*\|\n\s*\|:[-]+\|:[-]+\|\n+\s*\n+\s*<hr \/>/g, 
    '<hr />'
  );
  
  // Step 3: Fix formatting for details with no examples
  if (!fixedBlock.includes('*[[') && !fixedBlock.includes('| Property | Value |')) {
    fixedBlock = fixedBlock.replace(/<details>[\s\S]*?<\/details>/g, '');
  }
  
  // Replace original block with fixed block
  content = content.replace(block, fixedBlock);
}

// Final cleanup
// Remove excessive blank lines
content = content.replace(/\n{3,}/g, '\n\n');

// Remove empty details blocks
content = content.replace(/<details>\s*<summary>Examples<\/summary>\s*<hr \/>\s*<\/details>/g, '');

// Write the fixed content back to the file
fs.writeFileSync(filePath, content);
console.log(`Successfully fixed repeated examples in ${filePath}`);