#!/usr/bin/env node

/**
 * Verification script to compare SES HTML source files with converted MDX files
 * This script validates that content from the original HTML has been properly
 * preserved in the conversion to MDX format
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Source and target directories
const sourceDir = path.join(__dirname, '..', 'ISBDM', 'docs', 'ves');
const targetDir = path.join(__dirname, '..', 'docs', 'ses');

// Helper function to clean text for comparison
function cleanText(text) {
  if (!text) return '';
  
  return text
    .replace(/\s+/g, ' ')            // Normalize whitespace
    .replace(/"/g, '"')              // Normalize quotes
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/&quot;/g, '"')         // Convert HTML entities
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&hellip;/g, '...')
    .replace(/&amp;/g, '&')
    .replace(/\{/g, '')              // Remove React template characters
    .replace(/\}/g, '')
    .replace(/className="/g, 'class="') // Convert React attributes to HTML
    .replace(/<InLink href="[^"]+">([^<]+)<\/InLink>/g, '$1') // Remove Link components
    .replace(/<OutLink href="[^"]+">([^<]+)<\/OutLink>/g, '$1')
    .replace(/<a [^>]+>([^<]+)<\/a>/g, '$1')
    .replace(/\n/g, ' ')             // Remove newlines
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
      content += $(elem).text().trim() + ' ';
    });
    
    // Handle example sections
    $('.xamples').each((i, elem) => {
      content += $(elem).text().trim() + ' ';
    });
    
    return { title, content: cleanText(content) };
  } catch (error) {
    console.error(`Error processing HTML file ${filePath}:`, error.message);
    return { title: '', content: '' };
  }
}

// Extract content from MDX file
function extractMdxContent(filePath) {
  try {
    const mdx = fs.readFileSync(filePath, 'utf8');
    
    // Extract frontmatter title
    const titleMatch = mdx.match(/title:\s*"([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : '';
    
    // Remove frontmatter
    let content = mdx.replace(/---\n[\s\S]*?---\n/, '');
    
    // Remove heading
    content = content.replace(/^##\s+[^\n]+\n/, '');
    
    // Process content - this is simplified
    // Remove MDX component syntax while keeping content
    content = content
      .replace(/<div className="guid">\s*\n/g, '')
      .replace(/<\/div>/g, '')
      .replace(/<details>\s*\n\s*<summary>Examples<\/summary>/g, 'Examples')
      .replace(/<\/details>/g, '')
      .replace(/\|\s*Relation\s*\|\s*Example\s*\|\s*\|\s*----------\s*\|\s*----------\s*\|/g, '')
      .replace(/\|[^|]*\|[^|]*\|/g, '');
    
    return { title, content: cleanText(content) };
  } catch (error) {
    console.error(`Error processing MDX file ${filePath}:`, error.message);
    return { title: '', content: '' };
  }
}

// Function to calculate content similarity percentage
function calculateSimilarity(source, target) {
  if (!source || !target) return 0;
  
  // Simple approach - what percentage of the source words appear in the target
  const sourceWords = new Set(source.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const targetWords = new Set(target.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  
  let matches = 0;
  for (const word of sourceWords) {
    if (targetWords.has(word)) {
      matches++;
    }
  }
  
  return sourceWords.size ? Math.round((matches / sourceWords.size) * 100) : 0;
}

// Find all HTML files with "SES" in the name
console.log('Verifying SES files conversion...\n');
console.log('FILE                   | TITLE MATCH | CONTENT SIMILARITY | STATUS');
console.log('---------------------- | ----------- | ------------------ | ------');

const sesFiles = fs.readdirSync(sourceDir)
  .filter(file => file.includes('SES') && file.endsWith('.html'));

let allPassed = true;

for (const sourceFile of sesFiles) {
  const sourceFilePath = path.join(sourceDir, sourceFile);
  
  // Determine the expected MDX file name
  const baseName = path.basename(sourceFile, '.html');
  const targetFileName = `${baseName}.mdx`;
  const targetFilePath = path.join(targetDir, targetFileName);
  
  // Check if the converted file exists
  if (!fs.existsSync(targetFilePath)) {
    console.log(`${sourceFile.padEnd(22)} | ${'NOT FOUND'.padEnd(11)} | ${'0%'.padEnd(18)} | ❌ FAIL`);
    allPassed = false;
    continue;
  }
  
  // Extract content from both files
  const sourceContent = extractHtmlContent(sourceFilePath);
  const targetContent = extractMdxContent(targetFilePath);
  
  // Compare titles
  const titleMatch = sourceContent.title === targetContent.title ? 'MATCH' : 'MISMATCH';
  
  // Calculate content similarity
  const similarity = calculateSimilarity(sourceContent.content, targetContent.content);
  
  // Determine pass/fail status
  const passed = similarity >= 75; // 75% or more similarity is considered a pass
  const status = passed ? '✅ PASS' : '❌ FAIL';
  
  if (!passed) allPassed = false;
  
  console.log(`${sourceFile.padEnd(22)} | ${titleMatch.padEnd(11)} | ${similarity + '%'.padEnd(18)} | ${status}`);
  
  // Log detailed issues for failing files
  if (!passed) {
    console.log(`\nIssues detected in ${sourceFile}:`);
    console.log(`- Source title: "${sourceContent.title}"`);
    console.log(`- Target title: "${targetContent.title}"`);
    console.log(`- Content similarity: ${similarity}%`);
    
    // Output a small sample of content for comparison
    const sourceSample = sourceContent.content.substring(0, 100) + '...';
    const targetSample = targetContent.content.substring(0, 100) + '...';
    console.log(`- Source sample: "${sourceSample}"`);
    console.log(`- Target sample: "${targetSample}"`);
    console.log('');
  }
}

console.log('\nVerification Summary:');
if (allPassed) {
  console.log('✅ SUCCESS: All SES files passed verification check');
} else {
  console.log('❌ FAILURE: Some SES files failed verification check');
}

// Return appropriate exit code
process.exit(allPassed ? 0 : 1);