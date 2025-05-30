#!/usr/bin/env node

/**
 * This script converts all HTML vocabulary files from ISBDM/docs/ves/ to MDX files in docs/ves/
 * It uses the enhanced convert-html-vocabulary-to-mdx script that properly handles OutLink components
 *
 * Usage: node convert-all-vocabularies-enhanced.js
 */

const fs = require('fs');
const path = require('path');
const convertHtmlVocabularyToMdx = require('./convert-html-vocabulary-to-mdx-enhanced');

// Paths to source and destination directories
const sourceDir = path.resolve(__dirname, '../ISBDM/docs/ves');
const destDir = path.resolve(__dirname, '../docs/ves');

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
      console.log(`  Created backup at ${backupFile}`);
    }
    
    console.log(`Converting ${htmlFile} to ${mdxFile}...`);
    
    // Run the conversion directly
    const result = convertHtmlVocabularyToMdx(htmlFile, mdxFile);
    
    if (result.success) {
      console.log(`  Successfully converted with ${result.conceptCount} concepts`);
      
      if (result.hasAttribution) {
        console.log('  Attribution note was found and included');
      }
      
      return {
        success: true,
        conceptCount: result.conceptCount,
        hasAttribution: result.hasAttribution
      };
    } else {
      console.error(`  Error: ${result.error}`);
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    console.error(`Error converting ${htmlFile}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Main function
function main() {
  console.log('Starting conversion of vocabulary files with enhanced script...');
  
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
  const results = [];
  
  for (const htmlFile of htmlFiles) {
    const fileName = path.basename(htmlFile);
    const result = convertFile(htmlFile);
    results.push({ fileName, ...result });
    
    if (result.success) {
      successCount++;
      if (result.hasAttribution) attributionCount++;
    }
  }
  
  console.log('\nConversion Summary:');
  console.log(`Total files: ${htmlFiles.length}`);
  console.log(`Successfully converted: ${successCount}`);
  console.log(`Files with attribution: ${attributionCount}`);
  
  // Log files with errors
  const failedResults = results.filter(r => !r.success);
  if (failedResults.length > 0) {
    console.log('\nFailed conversions:');
    failedResults.forEach(r => {
      console.log(`  ${r.fileName}: ${r.error}`);
    });
  }
}

// Run the main function
main();