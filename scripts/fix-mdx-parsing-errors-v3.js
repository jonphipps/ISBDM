/**
 * Script to fix MDX parsing errors in converted files - Version 3
 * 
 * This version uses a complete rewrite approach to ensure proper structure
 * 
 * Usage:
 * node fix-mdx-parsing-errors-v3.js
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Define target directory
const targetDir = '/Users/jonphipps/Code/ISBDM/docs/fullex/';

/**
 * Extracts entry data from HTML and converts to clean MDX format
 */
function convertHtmlFile(sourceFile) {
  // Read the HTML file
  const html = fs.readFileSync(sourceFile, 'utf8');
  const $ = cheerio.load(html);
  
  // Extract title
  const title = $('h3').first().text().trim();
  
  // Extract sidebar label
  const sidebarLabel = title.split('(')[0].trim();
  
  // Extract description paragraphs
  const paragraphs = [];
  $('div.col-md-7 p').each((index, element) => {
    paragraphs.push($(element).text().trim());
  });
  const description = paragraphs.join('\n\n');
  
  // Extract entries
  const entries = [];
  
  // Process each row in the table
  $('div.row.px-2').each((index, row) => {
    const $row = $(row);
    
    // Skip header row
    if ($row.find('.xampleHeader').length > 0) {
      return;
    }
    
    // Get the element column
    const $elementCol = $row.find('.xampleLabel');
    if ($elementCol.length === 0) {
      return;
    }
    
    // Extract element name and URL
    const $elementLink = $elementCol.find('a');
    const element = $elementLink.text().trim();
    const elementUrl = $elementLink.attr('href')?.replace('/ISBDM/docs/', '/docs/').replace('.html', '');
    
    // Get the value column
    const value = $row.find('.xampleValue').text().trim();
    
    // Check if there's a detail comment
    const $commentCol = $row.find('.xampleComment');
    const hasDetail = $commentCol.find('a.linkEdco').length > 0;
    
    let detail = '';
    if (hasDetail) {
      // Get the ID of the collapse element
      const collapseId = $commentCol.find('a.linkEdco').attr('href')?.substring(1);
      if (collapseId) {
        const $detailContent = $(`#${collapseId} .editComment`);
        detail = $detailContent.text().trim();
      }
    }
    
    // Add entry to the list if we have element and value
    if (element && value) {
      entries.push({
        element,
        elementUrl,
        value,
        detail: detail || undefined
      });
    }
  });
  
  return {
    title,
    sidebarLabel,
    description,
    entries
  };
}

/**
 * JSON stringify but with special handling for MDX safety
 */
function safeJsonStringify(value) {
  if (typeof value !== 'string') return JSON.stringify(value);
  
  // Replace any backticks with escaped backticks for safety
  const escapedValue = value.replace(/`/g, '\\`');
  return JSON.stringify(escapedValue);
}

/**
 * Builds a properly formatted MDX file
 */
function buildMdxFile(data) {
  let mdx = `---
title: ${JSON.stringify(data.title)}
sidebar_label: ${JSON.stringify(data.sidebarLabel)}
---

import { ExampleTable } from '@site/src/components/global/ExampleTable';

# ${data.title}

${data.description}

<ExampleTable
  entries={[
`;

  // Generate entries array
  data.entries.forEach((entry, index) => {
    mdx += `    {
      element: ${JSON.stringify(entry.element)},
      elementUrl: ${JSON.stringify(entry.elementUrl)}`;
    
    if (entry.value) {
      mdx += `,
      value: ${safeJsonStringify(entry.value)}`;
    }
    
    if (entry.detail) {
      mdx += `,
      detail: ${safeJsonStringify(entry.detail)}`;
    }
    
    mdx += `
    }${index < data.entries.length - 1 ? ',' : ''}
`;
  });

  mdx += `  ]}
/>
`;

  return mdx;
}

/**
 * Processes a single file by extracting data from HTML and writing clean MDX
 */
function processFile(htmlFile, mdxFile) {
  console.log(`Processing ${htmlFile} -> ${mdxFile}`);
  
  try {
    // Extract data from HTML
    const data = convertHtmlFile(htmlFile);
    
    // Build clean MDX
    const mdxContent = buildMdxFile(data);
    
    // Write the MDX file
    fs.writeFileSync(mdxFile, mdxContent);
    
    return { 
      fileName: path.basename(mdxFile),
      success: true 
    };
  } catch (error) {
    console.error(`Error processing ${htmlFile}:`, error);
    return { 
      fileName: path.basename(mdxFile),
      success: false,
      error
    };
  }
}

/**
 * Main function to process all files
 */
function processAllFiles() {
  // Get all MDX files
  const mdxFiles = fs.readdirSync(targetDir)
    .filter(file => file.endsWith('.mdx') && file !== 'index.mdx')
    .map(file => path.join(targetDir, file));
  
  console.log(`Found ${mdxFiles.length} MDX files to process`);
  
  const results = {
    success: [],
    error: []
  };
  
  // Process each file
  mdxFiles.forEach(mdxFile => {
    // Determine the original HTML file
    const baseName = path.basename(mdxFile, '.mdx');
    const htmlFile = path.join('/Users/jonphipps/Code/ISBDM/ISBDM/docs/fullex/', `${baseName}.html`);
    
    if (!fs.existsSync(htmlFile)) {
      console.error(`Source HTML file not found: ${htmlFile}`);
      results.error.push({
        fileName: path.basename(mdxFile),
        error: 'Source HTML file not found'
      });
      return;
    }
    
    // Process the file
    const result = processFile(htmlFile, mdxFile);
    
    if (result.success) {
      results.success.push(result);
    } else {
      results.error.push(result);
    }
  });
  
  console.log(`Successfully processed ${results.success.length} files`);
  if (results.error.length > 0) {
    console.log(`Failed to process ${results.error.length} files`);
    results.error.forEach(result => {
      console.log(`  - ${result.fileName}: ${result.error}`);
    });
  }
}

// Run the processing
processAllFiles();