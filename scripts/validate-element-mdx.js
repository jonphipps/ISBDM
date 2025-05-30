#!/usr/bin/env node

/**
 * MDX Validation Script for ISBDM Element Files
 * 
 * This script validates converted MDX files for common conversion issues and
 * ensures the format matches the expected output from convert-html-element-to-mdx-final.mjs.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Validates a single MDX file for common issues
 * @param {string} filePath - Path to the MDX file to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation results with issues found
 */
function validateMdxFile(filePath, options = {}) {
  const defaultOptions = {
    verbose: false,
    reference: null // Optional reference file to use as gold standard
  };

  const opts = { ...defaultOptions, ...options };
  
  try {
    // Read MDX file
    const mdxContent = fs.readFileSync(filePath, 'utf8');
    
    // Results object to store validation findings
    const results = {
      filePath,
      valid: true,
      issues: [],
      frontmatterIssues: [],
      contentIssues: [],
      structureIssues: [],
      formatIssues: []
    };
    
    // Check for frontmatter
    if (!mdxContent.startsWith('---')) {
      results.valid = false;
      results.frontmatterIssues.push('Missing frontmatter');
    } else {
      // Extract frontmatter
      const frontmatterMatch = mdxContent.match(/^---\n([\s\S]*?)\n---/);
      
      if (!frontmatterMatch) {
        results.valid = false;
        results.frontmatterIssues.push('Malformed frontmatter');
      } else {
        try {
          const frontmatter = yaml.load(frontmatterMatch[1]);
          
          // Check required frontmatter fields
          const requiredFields = ['RDF'];
          for (const field of requiredFields) {
            if (!frontmatter[field]) {
              results.valid = false;
              results.frontmatterIssues.push(`Missing required frontmatter field: ${field}`);
            }
          }
          
          // Check RDF structure
          if (frontmatter.RDF) {
            const rdfRequiredFields = ['label', 'definition', 'domain', 'range', 'uri', 'type'];
            for (const field of rdfRequiredFields) {
              if (!frontmatter.RDF[field] && frontmatter.RDF[field] !== '') {
                results.valid = false;
                results.frontmatterIssues.push(`Missing required RDF field: ${field}`);
              }
            }
          }
        } catch (error) {
          results.valid = false;
          results.frontmatterIssues.push(`Error parsing frontmatter: ${error.message}`);
        }
      }
    }
    
    // Extract content (everything after frontmatter)
    const content = mdxContent.replace(/^---\n[\s\S]*?\n---\n/, '');
    
    // Check for required sections
    const requiredSections = [
      { pattern: /^# .+$/m, name: 'Title (H1)' },
      { pattern: /^## Element Reference$/m, name: 'Element Reference section' },
      { pattern: /<ElementReference \/>/m, name: 'ElementReference component' }
    ];
    
    for (const section of requiredSections) {
      if (!section.pattern.test(content)) {
        results.valid = false;
        results.structureIssues.push(`Missing ${section.name}`);
      }
    }
    
    // Check example format (if any examples exist)
    const examplePattern = /<details>\s*<summary>Examples<\/summary>\s*([\s\S]*?)<\/details>/g;
    const examples = [...content.matchAll(examplePattern)];
    
    if (examples.length > 0) {
      for (const example of examples) {
        const exampleContent = example[1];
        
        // Check for markdown table format
        if (!exampleContent.includes('| Property | Value |') || 
            !exampleContent.includes('|:---------|:------|')) {
          results.valid = false;
          results.formatIssues.push('Example is not using the expected markdown table format');
        }
        
        // Check for description format with double-double brackets
        const descriptionPattern = /\*\[\[\[\[(.*?)\]\]\]\]\*/g;
        const descriptions = [...exampleContent.matchAll(descriptionPattern)];
        
        if (descriptions.length === 0 && exampleContent.includes('*[')) {
          results.valid = false;
          results.formatIssues.push('Example description does not use the expected double-double bracket format (*[[[[...]]]]*)');
        }
        
        // Check for horizontal rules between examples
        if (exampleContent.includes('\n    <hr />') === false && 
            exampleContent.match(/\| Property \| Value \|/g)?.length > 1) {
          results.valid = false;
          results.formatIssues.push('Missing horizontal rule between examples');
        }
      }
    }
    
    // Check link formats
    if (content.includes('<Link ') || content.includes('<a href=')) {
      results.valid = false;
      results.formatIssues.push('Using raw HTML links instead of InLink/OutLink components');
    }
    
    // Check for other formatting issues
    const otherIssues = [
      { pattern: /{frontMatter}/g, issue: 'Using {frontMatter} prop in ElementReference component' },
      { pattern: /<ExampleTable[\s\S]*?>/g, issue: 'Using ExampleTable component instead of markdown tables' },
      { pattern: /\[\[\[(?!\[)/g, issue: 'Using triple brackets instead of double-double brackets' },
      { pattern: /\s\s+$/gm, issue: 'Contains trailing whitespace' }
    ];
    
    for (const issue of otherIssues) {
      if (issue.pattern.test(content)) {
        results.valid = false;
        results.formatIssues.push(issue.issue);
      }
    }
    
    // Compare with reference file if provided
    if (opts.reference) {
      try {
        const referenceContent = fs.readFileSync(opts.reference, 'utf8');
        
        // Extract reference content structure (count headings and components)
        const referenceSections = referenceContent.match(/^#{1,6} .+$/gm)?.length || 0;
        const contentSections = content.match(/^#{1,6} .+$/gm)?.length || 0;
        
        if (referenceSections !== contentSections) {
          results.valid = false;
          results.structureIssues.push(`Section count mismatch: expected ${referenceSections}, found ${contentSections}`);
        }
        
        // Check components used
        const referenceComponents = [...(referenceContent.matchAll(/<([A-Z][a-zA-Z0-9]*).*?\/>/g))].map(m => m[1]);
        const contentComponents = [...(content.matchAll(/<([A-Z][a-zA-Z0-9]*).*?\/>/g))].map(m => m[1]);
        
        // Check for missing components
        for (const component of new Set(referenceComponents)) {
          if (!contentComponents.includes(component)) {
            results.valid = false;
            results.structureIssues.push(`Missing component: ${component}`);
          }
        }
      } catch (error) {
        results.valid = false;
        results.issues.push(`Error comparing with reference file: ${error.message}`);
      }
    }
    
    // Add all issues to main issues array for easy access
    results.issues = [
      ...results.frontmatterIssues.map(i => `Frontmatter: ${i}`),
      ...results.contentIssues.map(i => `Content: ${i}`),
      ...results.structureIssues.map(i => `Structure: ${i}`),
      ...results.formatIssues.map(i => `Format: ${i}`)
    ];
    
    return results;
  } catch (error) {
    return {
      filePath,
      valid: false,
      issues: [`Error processing file: ${error.message}`],
      frontmatterIssues: [],
      contentIssues: [],
      structureIssues: [], 
      formatIssues: []
    };
  }
}

/**
 * Validates all MDX files in a directory
 * @param {string} directory - Directory containing MDX files to validate
 * @param {Object} options - Validation options
 * @returns {Object} Summary of validation results
 */
function validateDirectory(directory, options = {}) {
  const defaultOptions = {
    pattern: '*.mdx',
    exclude: null,
    verbose: false,
    reference: null
  };
  
  const opts = { ...defaultOptions, ...options };
  
  try {
    // Find all MDX files in the directory
    const files = fs.readdirSync(directory)
      .filter(file => file.endsWith('.mdx'))
      .filter(file => !opts.exclude || !new RegExp(opts.exclude).test(file));
    
    // Validate each file
    const results = {
      directory,
      totalFiles: files.length,
      validFiles: 0,
      filesWithIssues: 0,
      allIssues: {},
      issueTypes: {},
      validationDetails: {}
    };
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const validation = validateMdxFile(filePath, opts);
      
      // Store validation results
      results.validationDetails[file] = validation;
      
      if (validation.valid) {
        results.validFiles++;
      } else {
        results.filesWithIssues++;
        results.allIssues[file] = validation.issues;
        
        // Count issue types
        for (const issue of validation.issues) {
          const issueType = issue.split(':')[0];
          results.issueTypes[issueType] = (results.issueTypes[issueType] || 0) + 1;
        }
      }
    }
    
    return results;
  } catch (error) {
    return {
      directory,
      totalFiles: 0,
      validFiles: 0,
      filesWithIssues: 0,
      error: error.message,
      allIssues: {},
      issueTypes: {},
      validationDetails: {}
    };
  }
}

/**
 * Format validation results as a readable report
 * @param {Object} results - Validation results
 * @param {boolean} verbose - Whether to include detailed information
 * @returns {string} Formatted report
 */
function formatValidationReport(results, verbose = false) {
  let report = [];
  
  if (results.error) {
    report.push(`Error validating directory: ${results.error}`);
    return report.join('\n');
  }
  
  // Summary information
  report.push(`Validation Report for: ${results.directory}`);
  report.push(`Total files analyzed: ${results.totalFiles}`);
  report.push(`Valid files: ${results.validFiles}`);
  report.push(`Files with issues: ${results.filesWithIssues}`);
  report.push('');
  
  // Issue type summary
  if (Object.keys(results.issueTypes).length > 0) {
    report.push('Issue Types:');
    for (const [type, count] of Object.entries(results.issueTypes)) {
      report.push(`  ${type}: ${count}`);
    }
    report.push('');
  }
  
  // Detailed issues by file
  if (verbose && results.filesWithIssues > 0) {
    report.push('Details by File:');
    report.push('');
    
    for (const [file, issues] of Object.entries(results.allIssues)) {
      report.push(`File: ${file}`);
      report.push('Issues:');
      for (const issue of issues) {
        report.push(`  - ${issue}`);
      }
      report.push('');
    }
  } else if (results.filesWithIssues > 0) {
    report.push('Files with Issues:');
    for (const file of Object.keys(results.allIssues)) {
      report.push(`  - ${file} (${results.allIssues[file].length} issues)`);
    }
    report.push('');
    report.push('Use --verbose to see detailed issues');
  }
  
  // Success message if all valid
  if (results.validFiles === results.totalFiles) {
    report.push('All files are valid! ✅');
  }
  
  return report.join('\n');
}

// Main script execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  // Default options
  const options = {
    verbose: false,
    reference: null
  };
  
  // Show usage if no arguments provided
  if (args.length === 0) {
    console.log('MDX Validation Script for ISBDM Element Files');
    console.log('');
    console.log('Usage: node validate-element-mdx.js <file-or-directory> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --verbose                 Show detailed information about issues');
    console.log('  --reference <file>        Reference file to use as comparison');
    console.log('  --exclude <regex>         Exclude files matching pattern (for directories)');
    console.log('  --help                    Show this help message');
    process.exit(0);
  }
  
  // Parse arguments
  let target = null;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help') {
      console.log('MDX Validation Script for ISBDM Element Files');
      console.log('');
      console.log('Usage: node validate-element-mdx.js <file-or-directory> [options]');
      console.log('');
      console.log('Options:');
      console.log('  --verbose                 Show detailed information about issues');
      console.log('  --reference <file>        Reference file to use as comparison');
      console.log('  --exclude <regex>         Exclude files matching pattern (for directories)');
      console.log('  --help                    Show this help message');
      process.exit(0);
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--reference' && i + 1 < args.length) {
      options.reference = args[++i];
    } else if (arg === '--exclude' && i + 1 < args.length) {
      options.exclude = args[++i];
    } else if (!target) {
      target = arg;
    }
  }
  
  if (!target) {
    console.error('Error: No target file or directory specified');
    process.exit(1);
  }
  
  try {
    const stats = fs.statSync(target);
    
    if (stats.isDirectory()) {
      // Validate directory
      const results = validateDirectory(target, options);
      console.log(formatValidationReport(results, options.verbose));
      
      // Exit with error code if issues found
      if (results.filesWithIssues > 0) {
        process.exit(1);
      }
    } else {
      // Validate single file
      const validation = validateMdxFile(target, options);
      
      console.log(`Validating file: ${target}`);
      console.log(`Valid: ${validation.valid ? 'Yes ✅' : 'No ❌'}`);
      
      if (!validation.valid) {
        console.log('Issues:');
        for (const issue of validation.issues) {
          console.log(`  - ${issue}`);
        }
        process.exit(1);
      } else {
        console.log('No issues found!');
      }
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Export functions for use in other scripts
module.exports = {
  validateMdxFile,
  validateDirectory,
  formatValidationReport
};