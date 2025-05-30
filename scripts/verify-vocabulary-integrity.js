#!/usr/bin/env node

/**
 * This script verifies the integrity of vocabulary MDX files,
 * checking for common issues like concatenated values or duplicated entries.
 * 
 * Usage: node verify-vocabulary-integrity.js
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const VES_DIR = path.resolve(__dirname, '../docs/ves');

/**
 * Checks a vocabulary file for potential issues
 * @param {string} filePath - Path to the MDX file
 * @returns {Object} - Result with status and any issues found
 */
function checkVocabularyFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContent);
    const fileName = path.basename(filePath);
    const result = {
      file: fileName,
      hasIssues: false,
      issues: []
    };

    // Get the concepts array, handling both new and legacy formats
    let conceptsArray = [];

    if (data.concepts && Array.isArray(data.concepts)) {
      // New format with concepts array
      conceptsArray = data.concepts;
    } else if (data.RDF && data.RDF.values && Array.isArray(data.RDF.values)) {
      // Legacy format with RDF.values array
      conceptsArray = data.RDF.values;
    } else {
      // If this is a sample or special file, just warn but don't consider as an error
      if (fileName.includes('sample') || fileName.includes('example')) {
        console.log(`  Note: ${fileName} is a sample/example file and may use a different format`);
        return result;
      }
      result.hasIssues = true;
      result.issues.push('Missing or invalid concepts array (neither concepts nor RDF.values found)');
      return result;
    }

    // Check for empty concepts
    if (conceptsArray.length === 0) {
      result.hasIssues = true;
      result.issues.push('Empty concepts array');
      return result;
    }

    // Keep track of values to check for duplicates
    const valueSet = new Set();
    const duplicates = [];

    // Check each concept
    conceptsArray.forEach((concept, index) => {
      // Check for missing value
      if (!concept.value) {
        result.hasIssues = true;
        result.issues.push(`Concept at index ${index} is missing a value`);
      }

      // Check for missing definition
      if (!concept.definition) {
        result.hasIssues = true;
        result.issues.push(`Concept at index ${index} is missing a definition`);
      }

      // Check for suspiciously long values (potential concatenation)
      // Adjusted threshold to 45 to account for legitimate longer values like 'cartographic tactile three-dimensional form'
      if (concept.value && concept.value.length > 45) {
        result.hasIssues = true;
        result.issues.push(`Concept "${concept.value.substring(0, 45)}..." has a suspiciously long value (possible concatenation)`);
      }

      // Check for suspiciously long definition (potential concatenation)
      if (concept.definition && concept.definition.length > 500) {
        result.hasIssues = true;
        result.issues.push(`Concept "${concept.value}" has a suspiciously long definition (possible concatenation)`);
      }

      // Check for duplicate values
      if (concept.value) {
        if (valueSet.has(concept.value)) {
          duplicates.push(concept.value);
        } else {
          valueSet.add(concept.value);
        }
      }
    });

    // Report duplicate values
    if (duplicates.length > 0) {
      result.hasIssues = true;
      result.issues.push(`Found ${duplicates.length} duplicate values: ${duplicates.join(', ')}`);
    }

    return result;
  } catch (error) {
    return {
      file: path.basename(filePath),
      hasIssues: true,
      issues: [`Error parsing file: ${error.message}`]
    };
  }
}

/**
 * Main function to check all vocabulary files
 */
async function main() {
  console.log('Verifying vocabulary file integrity...');
  
  // Get all MDX files in the ves directory
  const mdxFiles = fs.readdirSync(VES_DIR)
    .filter(file => file.endsWith('.mdx') && 
           !file.endsWith('-backup.mdx') && 
           !file.endsWith('-fixed.mdx') &&
           !file.endsWith('-updated.mdx'))
    .map(file => path.join(VES_DIR, file));
  
  console.log(`Found ${mdxFiles.length} vocabulary files to check.`);
  
  const results = [];
  
  // Check each file
  for (const filePath of mdxFiles) {
    const result = checkVocabularyFile(filePath);
    results.push(result);
    
    // Log file status immediately
    if (result.hasIssues) {
      console.log(`❌ ${result.file} has ${result.issues.length} issues`);
    } else {
      console.log(`✅ ${result.file} is valid`);
    }
  }
  
  // Summarize results
  const filesWithIssues = results.filter(r => r.hasIssues);
  
  console.log('\nVerification Summary:');
  console.log(`Total files checked: ${results.length}`);
  console.log(`Files with issues: ${filesWithIssues.length}`);
  console.log(`Valid files: ${results.length - filesWithIssues.length}`);
  
  // Output detailed issues for files with problems
  if (filesWithIssues.length > 0) {
    console.log('\nDetailed Issues:');
    
    filesWithIssues.forEach(file => {
      console.log(`\n${file.file}:`);
      file.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
    });
  }
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});