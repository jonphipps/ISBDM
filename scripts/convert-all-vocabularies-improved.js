#!/usr/bin/env node

/**
 * This script converts all HTML vocabulary files from ISBDM/docs/ves/ to MDX files in docs/ves/
 * It uses the improved convert-html-vocabulary-to-mdx script that prevents concatenation issues.
 *
 * Usage: node convert-all-vocabularies-improved.js
 */

const fs = require('fs');
const path = require('path');
const convertHtmlVocabularyToMdx = require('./convert-html-vocabulary-to-mdx-improved');

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
    
    // Run the conversion directly (avoids shell issues with quotes)
    const result = convertHtmlVocabularyToMdx(htmlFile, mdxFile);
    
    if (result.success) {
      console.log(`  Successfully converted with ${result.conceptCount} concepts`);
      
      if (result.hasAttribution) {
        console.log('  Attribution note was found and included');
      }
      
      if (result.validationWarnings && result.validationWarnings.length > 0) {
        console.warn(`  Warning: ${result.validationWarnings.join(', ')}`);
      }
      
      return {
        success: true,
        conceptCount: result.conceptCount,
        hasAttribution: result.hasAttribution,
        warnings: result.validationWarnings || []
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
  console.log('Starting conversion of vocabulary files with improved script...');
  
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
  let warningCount = 0;
  const results = [];
  
  for (const htmlFile of htmlFiles) {
    const fileName = path.basename(htmlFile);
    const result = convertFile(htmlFile);
    results.push({ fileName, ...result });
    
    if (result.success) {
      successCount++;
      if (result.hasAttribution) attributionCount++;
      if (result.warnings && result.warnings.length > 0) warningCount++;
    }
  }
  
  console.log('\nConversion Summary:');
  console.log(`Total files: ${htmlFiles.length}`);
  console.log(`Successfully converted: ${successCount}`);
  console.log(`Files with attribution: ${attributionCount}`);
  console.log(`Files with warnings: ${warningCount}`);
  
  // Log files with warnings
  if (warningCount > 0) {
    console.log('\nFiles with warnings:');
    results
      .filter(r => r.success && r.warnings && r.warnings.length > 0)
      .forEach(r => {
        console.log(`  ${r.fileName}: ${r.warnings.join(', ')}`);
      });
  }
  
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