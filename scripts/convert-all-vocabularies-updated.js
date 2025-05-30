#!/usr/bin/env node

/**
 * This script converts all HTML vocabulary files from ISBDM/docs/ves/ to MDX files in docs/ves/
 * It uses the convert-html-vocabulary-to-mdx-updated.js script to convert each file.
 * This version properly handles attribution sections that may appear after the vocabulary table.
 *
 * Usage: node convert-all-vocabularies-updated.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths to source and destination directories
const sourceDir = path.resolve(__dirname, '../ISBDM/docs/ves');
const destDir = path.resolve(__dirname, '../docs/ves');
const converterScript = path.resolve(__dirname, 'convert-html-vocabulary-to-mdx-updated.js');

// Get all HTML files in the source directory
function getHtmlFiles(directory) {
  try {
    return fs.readdirSync(directory)
      .filter(file => file.endsWith('.html'))
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
    
    // Create a backup if the MDX file already exists
    if (fs.existsSync(mdxFile)) {
      const backupFile = path.join(destDir, `${baseName}-backup.mdx`);
      fs.copyFileSync(mdxFile, backupFile);
      console.log(`Created backup at ${backupFile}`);
    }
    
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
  console.log('Starting conversion of vocabulary files with attribution support...');
  
  // Make sure the destination directory exists
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  // Get all HTML files
  const htmlFiles = getHtmlFiles(sourceDir);
  
  if (htmlFiles.length === 0) {
    console.log('No HTML files found to convert.');
    return;
  }
  
  console.log(`Found ${htmlFiles.length} HTML files to convert.`);
  
  // Convert each file
  let successCount = 0;
  let attributionCount = 0;
  
  for (const htmlFile of htmlFiles) {
    // Check if the file has an attribution section
    const htmlContent = fs.readFileSync(htmlFile, 'utf8');
    const hasAttribution = htmlContent.includes('class="row mt-2"') && 
                          (htmlContent.includes('licensed under') || 
                           htmlContent.includes('copyright'));
    
    if (hasAttribution) {
      attributionCount++;
      console.log(`File ${path.basename(htmlFile)} has attribution section`);
    }
    
    if (convertFile(htmlFile)) {
      successCount++;
    }
  }
  
  console.log(`Conversion complete. Successfully converted ${successCount} of ${htmlFiles.length} files.`);
  console.log(`Found ${attributionCount} files with attribution sections.`);
}

// Run the main function
main();