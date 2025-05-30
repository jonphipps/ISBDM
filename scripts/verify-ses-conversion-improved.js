#!/usr/bin/env node

/**
 * Improved verification script to compare SES HTML source files with converted MDX files
 * This script validates that content from the original HTML has been properly
 * preserved in the conversion to MDX format, with better handling of examples and tables
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Source and target directories
const sourceDir = path.join(__dirname, '..', 'ISBDM', 'docs', 'ves');
const targetDir = path.join(__dirname, '..', 'docs', 'ses');

// Special case for index file
const indexMapping = {
  'ISBDMSES.html': 'index.mdx'
};

// Helper function to clean text for comparison
function cleanText(text) {
  if (!text) return '';
  
  return text
    .replace(/\s+/g, ' ')               // Normalize whitespace
    .replace(/"/g, '"')                 // Normalize quotes
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/&quot;/g, '"')            // Convert HTML entities
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&hellip;/g, '...')
    .replace(/&amp;/g, '&')
    .replace(/\{/g, '{')                // Keep template characters but normalize
    .replace(/\}/g, '}')
    .replace(/className="/g, 'class="') // Convert React attributes to HTML
    .replace(/<InLink href="[^"]+">([^<]+)<\/InLink>/g, '$1') // Remove Link components
    .replace(/<OutLink href="[^"]+">([^<]+)<\/OutLink>/g, '$1')
    .replace(/<a [^>]+>([^<]+)<\/a>/g, '$1')
    .replace(/\|[^|]*\|[^|]*\|/g, '')   // Remove table formatting
    .replace(/\n/g, ' ')                // Remove newlines
    .replace(/\s*\*Full example\*:\s*/g, 'Full example: ')  // Normalize example formatting
    .replace(/\.html/g, '')             // Remove .html extensions
    .replace(/\/ISBDM\/docs\//g, '/')   // Normalize paths
    .trim();
}

// Extract main content from HTML file
function extractHtmlContent(filePath) {
  try {
    const html = fs.readFileSync(filePath, 'utf8');
    const $ = cheerio.load(html);
    
    // Get the title
    const title = $('h3').text().trim();
    
    // Get the content from guid divs
    let content = '';
    $('.guid').each((i, elem) => {
      // Process paragraphs and content
      $(elem).find('p, ol, ul').each((j, child) => {
        content += $(child).text().trim() + ' ';
      });
    });
    
    // Process examples separately
    let examples = '';
    $('.xampleBlockGuid').each((i, elem) => {
      examples += 'Examples ';
      $(elem).find('.xampleLabel, .xampleValue, .editComment').each((j, ex) => {
        examples += $(ex).text().trim() + ' ';
      });
    });
    
    return { 
      title, 
      content: cleanText(content),
      examples: cleanText(examples),
      full: cleanText(content + ' ' + examples)
    };
  } catch (error) {
    console.error(`Error processing HTML file ${filePath}:`, error.message);
    return { title: '', content: '', examples: '', full: '' };
  }
}

// Extract content from MDX file
function extractMdxContent(filePath) {
  try {
    const mdx = fs.readFileSync(filePath, 'utf8');
    
    // Extract frontmatter title
    const titleMatch = mdx.match(/title:\s*"([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : '';
    
    // Remove frontmatter and heading
    let mainContent = mdx
      .replace(/---\n[\s\S]*?---\n/, '')
      .replace(/^##\s+[^\n]+\n/, '');
    
    // Extract main content (excluding examples in details blocks)
    let content = '';
    let examples = '';
    
    // Split content by details blocks to separate examples from main content
    const parts = mainContent.split(/<details>/);
    
    // First part is main content
    if (parts.length > 0) {
      content = parts[0];
      
      // Process remaining parts as examples
      for (let i = 1; i < parts.length; i++) {
        const exampleBlock = parts[i];
        examples += 'Examples ' + exampleBlock
          .replace(/<summary>Examples<\/summary>/g, '')
          .replace(/<\/details>/g, '');
      }
    }
    
    // Clean up div tags
    content = content.replace(/<div className="guid">\s*\n/g, '').replace(/<\/div>/g, '');
    
    return { 
      title, 
      content: cleanText(content),
      examples: cleanText(examples),
      full: cleanText(content + ' ' + examples)
    };
  } catch (error) {
    console.error(`Error processing MDX file ${filePath}:`, error.message);
    return { title: '', content: '', examples: '', full: '' };
  }
}

// Function to calculate content similarity percentage
function calculateSimilarity(source, target) {
  if (!source || !target) return 0;
  
  // More sophisticated approach with weighted keywords
  const sourceWords = source.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const targetWords = target.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  
  // Create word frequency maps
  const sourceFreq = {};
  const targetFreq = {};
  
  sourceWords.forEach(word => {
    sourceFreq[word] = (sourceFreq[word] || 0) + 1;
  });
  
  targetWords.forEach(word => {
    targetFreq[word] = (targetFreq[word] || 0) + 1;
  });
  
  // Count matches with frequency consideration
  let matches = 0;
  let totalWords = 0;
  
  for (const word in sourceFreq) {
    const sourceCount = sourceFreq[word];
    const targetCount = targetFreq[word] || 0;
    
    matches += Math.min(sourceCount, targetCount);
    totalWords += sourceCount;
  }
  
  return totalWords ? Math.round((matches / totalWords) * 100) : 0;
}

// Find all HTML files with "SES" in the name
console.log('Verifying SES files conversion...\n');
console.log('FILE                   | TITLE | CONTENT | EXAMPLES | OVERALL | STATUS');
console.log('---------------------- | ----- | ------- | -------- | ------- | ------');

const sesFiles = fs.readdirSync(sourceDir)
  .filter(file => file.includes('SES') && file.endsWith('.html'));

let passedCount = 0;
let failedCount = 0;

for (const sourceFile of sesFiles) {
  const sourceFilePath = path.join(sourceDir, sourceFile);
  
  // Determine the expected MDX file name
  let targetFileName = `${path.basename(sourceFile, '.html')}.mdx`;
  
  // Handle special case for index file
  if (indexMapping[sourceFile]) {
    targetFileName = indexMapping[sourceFile];
  }
  
  const targetFilePath = path.join(targetDir, targetFileName);
  
  // Check if the converted file exists
  if (!fs.existsSync(targetFilePath)) {
    console.log(`${sourceFile.padEnd(22)} | NONE  | 0%      | 0%       | 0%      | ❌ FAIL`);
    failedCount++;
    continue;
  }
  
  // Extract content from both files
  const sourceContent = extractHtmlContent(sourceFilePath);
  const targetContent = extractMdxContent(targetFilePath);
  
  // Compare titles
  const titleMatch = sourceContent.title === targetContent.title ? 'MATCH' : 'DIFF';
  
  // Calculate similarities for different content parts
  const contentSimilarity = calculateSimilarity(sourceContent.content, targetContent.content);
  const examplesSimilarity = calculateSimilarity(sourceContent.examples, targetContent.examples);
  const overallSimilarity = calculateSimilarity(sourceContent.full, targetContent.full);
  
  // Determine pass/fail status - we consider it passing if overall similarity is above 60%
  // This is more lenient because our text cleaning isn't perfect
  const passed = overallSimilarity >= 60; 
  const status = passed ? '✅ PASS' : '❌ FAIL';
  
  if (passed) {
    passedCount++;
  } else {
    failedCount++;
  }
  
  // Format percentages for display
  const contentPercent = contentSimilarity + '%';
  const examplesPercent = examplesSimilarity + '%';
  const overallPercent = overallSimilarity + '%';
  
  console.log(`${sourceFile.padEnd(22)} | ${titleMatch.padEnd(5)} | ${contentPercent.padEnd(7)} | ${examplesPercent.padEnd(8)} | ${overallPercent.padEnd(7)} | ${status}`);
  
  // Log detailed issues for failing files
  if (!passed) {
    console.log(`\nIssues detected in ${sourceFile}:`);
    console.log(`- Source title: "${sourceContent.title}"`);
    console.log(`- Target title: "${targetContent.title}"`);
    console.log(`- Content similarity: ${contentSimilarity}%`);
    console.log(`- Examples similarity: ${examplesSimilarity}%`);
    
    // If examples have very low similarity, it might indicate missing examples
    if (examplesSimilarity < 40) {
      console.log('- WARNING: Very low examples similarity suggests missing or improperly formatted examples');
      
      // Output word counts for source and target examples
      const sourceWordCount = sourceContent.examples.split(/\s+/).filter(w => w.length > 0).length;
      const targetWordCount = targetContent.examples.split(/\s+/).filter(w => w.length > 0).length;
      console.log(`- Source examples word count: ${sourceWordCount}`);
      console.log(`- Target examples word count: ${targetWordCount}`);
    }
    
    // Output a small sample of content for comparison if content similarity is low
    if (contentSimilarity < 70) {
      const sourceSample = sourceContent.content.substring(0, 100) + '...';
      const targetSample = targetContent.content.substring(0, 100) + '...';
      console.log(`- Source content sample: "${sourceSample}"`);
      console.log(`- Target content sample: "${targetSample}"`);
    }
    
    console.log('');
  }
}

console.log('\nVerification Summary:');
console.log(`✅ PASSED: ${passedCount} files`);
console.log(`❌ FAILED: ${failedCount} files`);

// Determine the overall result
const allPassed = failedCount === 0;

if (allPassed) {
  console.log('\n✅ SUCCESS: All SES files passed verification check');
} else {
  console.log('\n❌ WARNING: Some SES files did not meet the verification threshold.');
  console.log('   This may be due to formatting differences rather than missing content.');
  console.log('   Manual review is recommended for failed files.');
}

// Return appropriate exit code
process.exit(allPassed ? 0 : 1);