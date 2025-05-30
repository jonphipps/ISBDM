/**
 * Script to convert HTML fullex files to MDX format
 * 
 * Usage:
 * node convert-fullex-to-mdx.js
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Define source and target directories
const sourceDir = '/Users/jonphipps/Code/ISBDM/ISBDM/docs/fullex/';
const targetDir = '/Users/jonphipps/Code/ISBDM/docs/fullex/';

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

/**
 * Extracts the title from the HTML file
 */
function extractTitle($) {
  return $('h3').first().text().trim();
}

/**
 * Extracts the sidebar label from the title
 */
function extractSidebarLabel(title) {
  // Use the first part of the title before the first parenthesis
  const match = title.match(/^([^(]+)/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return title;
}

/**
 * Extracts the description paragraphs from the HTML file
 */
function extractDescription($) {
  const paragraphs = [];
  
  // Find all paragraphs in the main content section before the example table
  $('div.col-md-7 p').each((index, element) => {
    paragraphs.push($(element).text().trim());
  });
  
  return paragraphs.join('\n\n');
}

/**
 * Extract table entries from the HTML file
 */
function extractEntries($) {
  const entries = [];
  
  // Find all rows in the example table (excluding the header row)
  $('div.row.px-2').each((index, row) => {
    const $row = $(row);
    
    // Skip header row
    if ($row.find('.xampleHeader').length > 0) {
      return;
    }
    
    // Get the element column (with the link)
    const $elementCol = $row.find('.xampleLabel');
    if ($elementCol.length === 0) {
      return;
    }
    
    // Extract element name and URL
    const $elementLink = $elementCol.find('a');
    const element = $elementLink.text().trim();
    const elementUrl = $elementLink.attr('href');
    
    // Get the value column
    const value = $row.find('.xampleValue').text().trim();
    
    // Check if there's a detail comment
    const $commentCol = $row.find('.xampleComment');
    const hasDetail = $commentCol.find('a.linkEdco').length > 0;
    
    let detail = '';
    if (hasDetail) {
      // Get the ID of the collapse element
      const collapseId = $commentCol.find('a.linkEdco').attr('href').substring(1);
      const $detailContent = $(`#${collapseId} .editComment`);
      detail = $detailContent.text().trim();
    }
    
    // Add entry to the list
    entries.push({
      element,
      elementUrl: elementUrl ? elementUrl.replace('/ISBDM/docs/', '/docs/') : '',
      value,
      detail: detail || undefined
    });
  });
  
  return entries;
}

/**
 * Converts a single HTML file to MDX format
 */
function convertFile(sourceFile, targetFile) {
  console.log(`Converting ${sourceFile} to ${targetFile}`);
  
  // Read the HTML file
  const html = fs.readFileSync(sourceFile, 'utf8');
  const $ = cheerio.load(html);
  
  // Extract data
  const title = extractTitle($);
  const sidebarLabel = extractSidebarLabel(title);
  const description = extractDescription($);
  const entries = extractEntries($);
  
  // Generate frontmatter
  let mdx = `---
title: "${title}"
sidebar_label: "${sidebarLabel}"
---

import { ExampleTable } from '@site/src/components/global/ExampleTable';

# ${title}

${description}

<ExampleTable 
  entries={[
`;

  // Generate entries array
  entries.forEach((entry, index) => {
    mdx += `    {
      element: "${entry.element}",
      elementUrl: "${entry.elementUrl}",
      value: "${entry.value}"${entry.detail ? `,
      detail: "${entry.detail}"` : ''}
    }${index < entries.length - 1 ? ',' : ''}
`;
  });

  mdx += `  ]}
/>
`;
  
  // Write the MDX file
  fs.writeFileSync(targetFile, mdx);
  
  return {
    title,
    sidebarLabel,
    fileName: path.basename(targetFile)
  };
}

/**
 * Create index.mdx file for the fullex directory
 */
function createIndexFile(files) {
  const indexPath = path.join(targetDir, 'index.mdx');
  
  let content = `---
title: "Full Examples"
sidebar_label: "Full Examples"
---

# Full Examples

These examples demonstrate how to describe various manifestations using the ISBD for Manifestation model.

`;
  
  // Sort files by title
  files.sort((a, b) => a.title.localeCompare(b.title));
  
  // Create links to all files
  files.forEach(file => {
    const href = file.fileName.replace('.mdx', '');
    content += `- [${file.title}](/docs/fullex/${href})\n`;
  });
  
  fs.writeFileSync(indexPath, content);
  console.log(`Created index file at ${indexPath}`);
}

/**
 * Main function to convert all files
 */
function convertAllFiles() {
  // Get all HTML files
  const files = fs.readdirSync(sourceDir)
    .filter(file => file.endsWith('.html') && file !== 'index.html')
    .map(file => file);
  
  console.log(`Found ${files.length} HTML files to convert`);
  
  const convertedFiles = [];
  
  // Convert each file
  files.forEach(file => {
    const sourceFile = path.join(sourceDir, file);
    const targetFile = path.join(targetDir, file.replace('.html', '.mdx'));
    
    try {
      const fileInfo = convertFile(sourceFile, targetFile);
      convertedFiles.push(fileInfo);
      console.log(`Successfully converted ${file}`);
    } catch (error) {
      console.error(`Error converting ${file}:`, error);
    }
  });
  
  // Create index file
  createIndexFile(convertedFiles);
  
  console.log(`Successfully converted ${convertedFiles.length} files`);
}

// Run the conversion
convertAllFiles();