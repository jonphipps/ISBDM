#!/usr/bin/env node

/**
 * This script verifies all HTML to MDX conversions to ensure they retained all vocabulary terms.
 * It runs the verify-conversion.js script for each numeric HTML/MDX pair.
 * 
 * Usage: node verify-all-conversions.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths to source and destination directories
const sourceDir = path.resolve(__dirname, '../ISBDM/docs/ves');
const destDir = path.resolve(__dirname, '../docs/ves');
const verifyScript = path.resolve(__dirname, 'verify-conversion.js');

// Get numeric HTML files in the source directory
function getNumericHtmlFiles(directory) {
  try {
    return fs.readdirSync(directory)
      .filter(file => file.endsWith('.html') && /^\d+\.html$/.test(file))
      .map(file => path.basename(file, '.html'));
  } catch (error) {
    console.error(`Error reading directory ${directory}:`, error);
    return [];
  }
}

// Verify conversion for a file pair
function verifyFile(baseName) {
  try {
    const htmlFile = path.join(sourceDir, `${baseName}.html`);
    const mdxFile = path.join(destDir, `${baseName}.mdx`);
    
    // Check if both files exist
    if (!fs.existsSync(htmlFile) || !fs.existsSync(mdxFile)) {
      console.error(`Missing file for ${baseName}!`);
      return false;
    }
    
    console.log(`Verifying ${baseName}...`);
    
    // Run the verification script
    execSync(`node ${verifyScript} "${htmlFile}" "${mdxFile}"`, {
      stdio: 'inherit' // Show output in console
    });
    
    return true;
  } catch (error) {
    console.error(`Error verifying ${baseName}:`, error);
    return false;
  }
}

// Main function
function main() {
  console.log('Starting verification of all conversions...');
  
  // Get all numeric HTML files
  const baseNames = getNumericHtmlFiles(sourceDir);
  
  if (baseNames.length === 0) {
    console.log('No numeric HTML files found to verify.');
    return;
  }
  
  console.log(`Found ${baseNames.length} numeric files to verify.`);
  
  // Verify each file
  let successCount = 0;
  let failureCount = 0;
  
  for (const baseName of baseNames) {
    try {
      // Run verification and capture the exit code
      execSync(`node ${verifyScript} "${path.join(sourceDir, baseName + '.html')}" "${path.join(destDir, baseName + '.mdx')}"`, { 
        stdio: 'inherit' 
      });
      successCount++;
    } catch (error) {
      console.error(`Verification failed for ${baseName}`);
      failureCount++;
    }
    
    // Add a separator between files
    console.log('\n' + '-'.repeat(80) + '\n');
  }
  
  console.log(`Verification complete. ${successCount} succeeded, ${failureCount} failed.`);
  
  // Exit with failure if any verification failed
  process.exit(failureCount > 0 ? 1 : 0);
}

// Run the main function
main();