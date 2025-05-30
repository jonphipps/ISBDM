#!/usr/bin/env node

/**
 * This script checks if the converted MDX files in the intro directory
 * have all the content from their original HTML counterparts.
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const SOURCE_DIR = path.join(__dirname, '..', 'ISBDM', 'docs', 'intro');
const TARGET_DIR = path.join(__dirname, '..', 'docs', 'intro');

const files = fs.readdirSync(SOURCE_DIR)
  .filter(file => file.endsWith('.html'))
  .filter(file => file !== 'index.html'); // Exclude index.html as it may have a different structure

const report = [];

for (const htmlFile of files) {
  const baseName = htmlFile.replace('.html', '');
  const mdxFile = `${baseName}.mdx`;
  
  const htmlPath = path.join(SOURCE_DIR, htmlFile);
  const mdxPath = path.join(TARGET_DIR, mdxFile);
  
  if (!fs.existsSync(mdxPath)) {
    report.push({ file: baseName, status: 'MISSING', details: 'MDX file does not exist' });
    continue;
  }
  
  // Read the HTML file and extract main content
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(htmlContent);
  
  // Get the HTML content - focus on the main content area
  const mainContent = $('.col-md-7.border.rounded').text().trim();
  const paragraphCount = $('.guid p').length;
  const listItemCount = $('.guid li').length;
  
  // Read the MDX file
  const mdxContent = fs.readFileSync(mdxPath, 'utf8');
  
  // Count paragraphs in MDX (rough estimate)
  const mdxParagraphCount = (mdxContent.match(/<p>/g) || []).length;
  
  // Count list items in MDX (rough estimate)
  const mdxListItemCount = (mdxContent.match(/<li>/g) || []).length;
  
  // Determine completeness
  const contentRatio = (mdxParagraphCount + mdxListItemCount) / (paragraphCount + listItemCount);
  
  let status, details;
  if (contentRatio < 0.5) {
    status = 'INCOMPLETE';
    details = `MDX has significantly less content (${Math.round(contentRatio * 100)}% of HTML)`;
  } else if (contentRatio < 0.9) {
    status = 'PARTIAL';
    details = `MDX may be missing some content (${Math.round(contentRatio * 100)}% of HTML)`;
  } else {
    status = 'COMPLETE';
    details = `MDX appears to have all content (${Math.round(contentRatio * 100)}% of HTML)`;
  }
  
  report.push({
    file: baseName,
    status,
    details,
    htmlParagraphs: paragraphCount,
    htmlListItems: listItemCount,
    mdxParagraphs: mdxParagraphCount,
    mdxListItems: mdxListItemCount
  });
}

// Sort by status (INCOMPLETE first, then PARTIAL, then COMPLETE)
report.sort((a, b) => {
  const statusOrder = { 'INCOMPLETE': 0, 'PARTIAL': 1, 'COMPLETE': 2, 'MISSING': 3 };
  return statusOrder[a.status] - statusOrder[b.status];
});

// Print the report
console.log('## Intro MDX Conversion Completeness Report\n');
console.log('| File | Status | Details | HTML P/LI | MDX P/LI |');
console.log('|------|--------|---------|-----------|----------|');

for (const item of report) {
  const htmlCounts = item.htmlParagraphs !== undefined ? `${item.htmlParagraphs}/${item.htmlListItems}` : 'N/A';
  const mdxCounts = item.mdxParagraphs !== undefined ? `${item.mdxParagraphs}/${item.mdxListItems}` : 'N/A';
  
  console.log(`| ${item.file} | ${item.status} | ${item.details} | ${htmlCounts} | ${mdxCounts} |`);
}

console.log('\nSummary:');
const incomplete = report.filter(r => r.status === 'INCOMPLETE').length;
const partial = report.filter(r => r.status === 'PARTIAL').length;
const complete = report.filter(r => r.status === 'COMPLETE').length;
const missing = report.filter(r => r.status === 'MISSING').length;

console.log(`- INCOMPLETE: ${incomplete}`);
console.log(`- PARTIAL: ${partial}`);
console.log(`- COMPLETE: ${complete}`);
console.log(`- MISSING: ${missing}`);
console.log(`- TOTAL: ${report.length}`);