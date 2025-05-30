#!/usr/bin/env node

/**
 * This script converts numeric HTML vocabulary files from ISBDM/docs/ves/ to MDX files in docs/ves/
 * It uses the convert-html-vocabulary-to-mdx.js script to convert each file.
 *
 * Usage: node convert-numeric-vocabularies.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths to source and destination directories
const sourceDir = path.resolve(__dirname, '../ISBDM/docs/ves');
const destDir = path.resolve(__dirname, '../docs/ves');
const converterScript = path.resolve(__dirname, 'convert-html-vocabulary-to-mdx.js');

// Get numeric HTML files in the source directory
function getNumericHtmlFiles(directory) {
  try {
    return fs.readdirSync(directory)
      .filter(file => file.endsWith('.html') && /^\d+\.html$/.test(file))
      .map(file => path.join(directory, file));
  } catch (error) {
    console.error(`Error reading directory ${directory}:`, error);
    return [];
  }
}

// Convert an HTML file to MDX
function convertFile(htmlFile) {
  try {
    const baseName = path.basename(htmlFile, '.html');
    const mdxFile = path.join(destDir, `${baseName}.mdx`);
    
    console.log(`Converting ${htmlFile} to ${mdxFile}...`);
    
    // Run the conversion script
    execSync(`node ${converterScript} "${htmlFile}" "${mdxFile}"`, {
      stdio: 'inherit' // Show output in console
    });
    
    return true;
  } catch (error) {
    console.error(`Error converting ${htmlFile}:`, error);
    return false;
  }
}

// Main function
function main() {
  console.log('Starting conversion of numeric vocabulary files...');
  
  // Make sure the destination directory exists
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  // Get all numeric HTML files
  const htmlFiles = getNumericHtmlFiles(sourceDir);
  
  if (htmlFiles.length === 0) {
    console.log('No numeric HTML files found to convert.');
    return;
  }
  
  console.log(`Found ${htmlFiles.length} numeric HTML files to convert.`);
  
  // Convert each file
  let successCount = 0;
  for (const htmlFile of htmlFiles) {
    if (convertFile(htmlFile)) {
      successCount++;
    }
  }
  
  console.log(`Conversion complete. Successfully converted ${successCount} of ${htmlFiles.length} files.`);
}

// Run the main function
main();