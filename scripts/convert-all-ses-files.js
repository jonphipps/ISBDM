#!/usr/bin/env node

/**
 * Script to convert all ISBDM SES HTML files to MDX
 * 
 * This script finds and converts all String Encoding Scheme (SES) HTML files from 
 * the ISBDM docs/ves directory to MDX format in the docs/ses directory.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Source and target directories
const sourceDir = '/Users/jonphipps/Code/ISBDM/ISBDM/docs/ves';
const targetDir = '/Users/jonphipps/Code/ISBDM/docs/ses';

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`Created directory: ${targetDir}`);
}

// Find all SES HTML files
const sesFiles = fs.readdirSync(sourceDir)
  .filter(file => file.startsWith('ISBDMSES') && file.endsWith('.html'));

if (sesFiles.length === 0) {
  console.log('No SES HTML files found in the source directory.');
  process.exit(0);
}

console.log(`Found ${sesFiles.length} SES HTML files to convert.`);

// Convert each file
let successCount = 0;
let failCount = 0;

for (const file of sesFiles) {
  const sourceFile = path.join(sourceDir, file);
  const targetFile = path.join(targetDir, file.replace('.html', '.mdx'));
  
  try {
    console.log(`Converting ${file}...`);
    
    // Run the conversion script
    execSync(`node ${path.join(__dirname, 'convert-ses-html-to-mdx.js')} ${sourceFile} ${targetFile}`, {
      stdio: 'inherit'
    });
    
    successCount++;
  } catch (error) {
    console.error(`Error converting ${file}: ${error.message}`);
    failCount++;
  }
}

console.log(`\nConversion completed.`);
console.log(`Successfully converted: ${successCount} files`);
if (failCount > 0) {
  console.log(`Failed to convert: ${failCount} files`);
}

// Create index.mdx file with proper links
console.log('Creating index.mdx file...');

const indexContent = `---
id: ses-index
title: "String Encoding Schemes"
slug: "/ses"
---

# String Encoding Schemes

This section contains the String Encoding Schemes (SES) used in ISBDM:

${sesFiles.map(file => {
  // Special case for the main SES file
  if (file === 'ISBDMSES.html') {
    return `- [Overview](/ses/overview)`;
  }
  
  const id = file.replace('ISBDMSES', '').replace('.html', '').toLowerCase();
  let name;
  
  // Special handling for numeric IDs
  if (/^\d+$/.test(id)) {
    // Format numeric IDs differently (e.g., "ID 1023" instead of "1023")
    name = `ID ${id}`;
  } else {
    // Capitalize properly (e.g., "Age", "Col", "Person")
    name = id.charAt(0).toUpperCase() + id.slice(1);
  }
  
  return `- [${name} SES](/ses/${id})`;
}).join('\n')}
`;

fs.writeFileSync(path.join(targetDir, 'index.mdx'), indexContent);
console.log('Updated index.mdx file.');