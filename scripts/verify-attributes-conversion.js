/**
 * Script to verify attribute conversions from HTML to MDX
 * 
 * This script checks that all content from HTML files has been properly converted to MDX
 * 
 * Usage:
 * node verify-attributes-conversion.js
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Define source and target directories
const sourceDir = '/Users/jonphipps/Code/ISBDM/ISBDM/docs/attributes/';
const targetDir = '/Users/jonphipps/Code/ISBDM/docs/attributes/';

/**
 * Extracts all text content from HTML
 */
function extractHtmlContent(htmlFile) {
  const html = fs.readFileSync(htmlFile, 'utf8');
  const $ = cheerio.load(html);
  
  // Remove scripts and styles
  $('script, style').remove();
  
  // Get all text content
  const text = $('body').text().trim()
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ');
  
  return text;
}

/**
 * Extracts all text content from MDX
 */
function extractMdxContent(mdxFile) {
  // Read the MDX file
  const mdx = fs.readFileSync(mdxFile, 'utf8');
  
  // Remove front matter
  let content = mdx.replace(/^---\n[\s\S]*?\n---\n/, '');
  
  // Remove import statements
  content = content.replace(/import {.*} from .*\n/g, '');
  
  // Remove component syntax
  content = content.replace(/<[^>]*>/g, '');
  
  // Remove markdown headings
  content = content.replace(/^#+\s*(.*)/gm, '$1');
  
  // Normalize whitespace
  content = content.replace(/\s+/g, ' ').trim();
  
  return content;
}

/**
 * Calculate similarity between two strings
 * Uses Levenshtein distance
 */
function calculateSimilarity(str1, str2) {
  const levDist = levenshteinDistance(str1, str2);
  const maxLen = Math.max(str1.length, str2.length);
  
  if (maxLen === 0) return 100; // Both strings are empty
  
  return ((maxLen - levDist) / maxLen) * 100;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  
  // Create a matrix of size (m+1) x (n+1)
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
  
  // Initialize the matrix
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }
  
  // Fill the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],    // Deletion
          dp[i][j - 1],    // Insertion
          dp[i - 1][j - 1] // Substitution
        );
      }
    }
  }
  
  return dp[m][n];
}

/**
 * Verify conversion for a single file
 */
function verifyFile(htmlFile, mdxFile) {
  console.log(`Verifying ${path.basename(htmlFile)} -> ${path.basename(mdxFile)}`);
  
  try {
    // Extract content from both files
    const htmlContent = extractHtmlContent(htmlFile);
    const mdxContent = extractMdxContent(mdxFile);
    
    // Calculate similarity
    const similarity = calculateSimilarity(htmlContent, mdxContent);
    
    return {
      fileName: path.basename(mdxFile),
      success: similarity >= 70, // Consider 70% similarity as acceptable
      similarity: similarity.toFixed(2),
      htmlLength: htmlContent.length,
      mdxLength: mdxContent.length
    };
  } catch (error) {
    console.error(`Error verifying ${htmlFile}:`, error);
    return {
      fileName: path.basename(mdxFile),
      success: false,
      error: error.message
    };
  }
}

/**
 * Main function to verify all files
 */
function verifyAllFiles() {
  // Get all HTML files
  const htmlFiles = fs.readdirSync(sourceDir)
    .filter(file => file.endsWith('.html') && file !== 'index.html')
    .map(file => path.join(sourceDir, file));
  
  console.log(`Found ${htmlFiles.length} HTML files to verify`);
  
  const results = {
    success: [],
    warning: [],
    error: []
  };
  
  // Verify each file
  htmlFiles.forEach(htmlFile => {
    // Determine the corresponding MDX file
    const baseName = path.basename(htmlFile, '.html');
    const mdxFile = path.join(targetDir, `${baseName}.mdx`);
    
    // Check if MDX file exists
    if (!fs.existsSync(mdxFile)) {
      console.error(`MDX file not found: ${mdxFile}`);
      results.error.push({
        fileName: path.basename(htmlFile),
        error: 'MDX file not found'
      });
      return;
    }
    
    // Verify the file
    const result = verifyFile(htmlFile, mdxFile);
    
    if (result.success) {
      if (parseFloat(result.similarity) < 85) {
        // Warning for files with similarity between 70% and 85%
        results.warning.push(result);
      } else {
        results.success.push(result);
      }
    } else {
      results.error.push(result);
    }
  });
  
  // Report results
  console.log('\nVerification Results:');
  console.log(`Successful: ${results.success.length}`);
  console.log(`Warnings: ${results.warning.length}`);
  console.log(`Errors: ${results.error.length}`);
  
  if (results.warning.length > 0) {
    console.log('\nWarnings (70-85% similarity):');
    results.warning.forEach(result => {
      console.log(`  - ${result.fileName}: ${result.similarity}% (HTML: ${result.htmlLength}, MDX: ${result.mdxLength})`);
    });
  }
  
  if (results.error.length > 0) {
    console.log('\nErrors (<70% similarity):');
    results.error.forEach(result => {
      if (result.similarity) {
        console.log(`  - ${result.fileName}: ${result.similarity}% (HTML: ${result.htmlLength}, MDX: ${result.mdxLength})`);
      } else {
        console.log(`  - ${result.fileName}: ${result.error}`);
      }
    });
  }
  
  // Return a summary of results
  return {
    total: htmlFiles.length,
    success: results.success.length,
    warning: results.warning.length,
    error: results.error.length
  };
}

// Run the verification
const summary = verifyAllFiles();

// Exit with appropriate code
process.exit(summary.error > 0 ? 1 : 0);