/**
 * Script to convert HTML attribute files to MDX format
 * 
 * This script converts HTML files from the 'attributes' directory to MDX format
 * Uses the lessons learned from the fullex conversion
 * 
 * Usage:
 * node convert-attributes-to-mdx.js
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Define source and target directories
const sourceDir = '/Users/jonphipps/Code/ISBDM/ISBDM/docs/attributes/';
const targetDir = '/Users/jonphipps/Code/ISBDM/docs/attributes/';

/**
 * Extracts title from HTML
 */
function extractTitle($) {
  // Try to find the main heading
  const heading = $('h1, h2, h3').first().text().trim();
  if (heading) {
    return heading;
  }
  
  // If no heading found, use the document title
  return $('title').text().trim();
}

/**
 * Extract sidebar label from title
 */
function extractSidebarLabel(title) {
  // Use the first part of the title as the sidebar label
  return title.split('(')[0].trim();
}

/**
 * Extracts description paragraphs from HTML
 */
function extractDescription($) {
  const paragraphs = [];
  
  // Extract introduction paragraphs
  $('div.elementDescription p, div.col-md-12 p').each((index, element) => {
    const text = $(element).text().trim();
    if (text) {
      paragraphs.push(text);
    }
  });
  
  return paragraphs.join('\n\n');
}

/**
 * Extracts possible values for attributes
 */
function extractValues($) {
  const values = [];
  
  // Extract value items
  $('div.valueList li').each((index, element) => {
    const $item = $(element);
    
    const value = $item.find('strong, b').first().text().trim();
    
    // Extract description
    let description = '';
    $item.contents().each((i, node) => {
      if (node.type === 'text') {
        description += $(node).text().trim();
      }
    });
    
    // Clean up description
    description = description.replace(/^\s*:\s*/, '').trim();
    
    if (value) {
      values.push({
        value,
        description: description || undefined
      });
    }
  });
  
  return values;
}

/**
 * Extract examples from HTML
 */
function extractExamples($) {
  const examples = [];
  
  // Extract examples
  $('div.examples li').each((index, element) => {
    const text = $(element).text().trim();
    if (text) {
      examples.push(text);
    }
  });
  
  return examples;
}

/**
 * Extract notes from HTML
 */
function extractNotes($) {
  const notes = [];
  
  // Extract notes
  $('div.notes li, div.notes p').each((index, element) => {
    const text = $(element).text().trim();
    if (text) {
      notes.push(text);
    }
  });
  
  return notes;
}

/**
 * Extract "see also" references
 */
function extractSeeAlso($) {
  const seeAlso = [];
  
  // Extract see also references
  $('div.seeAlso a').each((index, element) => {
    const $link = $(element);
    const text = $link.text().trim();
    const href = $link.attr('href');
    
    if (text && href) {
      // Convert href to proper format
      const formattedHref = href
        .replace('/ISBDM/docs/', '/docs/')
        .replace('.html', '');
      
      seeAlso.push({
        text,
        href: formattedHref
      });
    }
  });
  
  return seeAlso;
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
 * Builds a properly formatted MDX file for attribute documentation
 */
function buildMdxFile(data) {
  let mdx = `---
title: ${JSON.stringify(data.title)}
sidebar_label: ${JSON.stringify(data.sidebarLabel)}
---

import { VocabularyTable } from '@site/src/components/global/VocabularyTable';
import { SeeAlso } from '@site/src/components/global/SeeAlso';

# ${data.title}

${data.description}

`;

  // Add values if available
  if (data.values && data.values.length > 0) {
    mdx += `## Values

<VocabularyTable
  values={[
`;

    // Generate values array
    data.values.forEach((item, index) => {
      mdx += `    {
      value: ${safeJsonStringify(item.value)}`;
      
      if (item.description) {
        mdx += `,
      description: ${safeJsonStringify(item.description)}`;
      }
      
      mdx += `
    }${index < data.values.length - 1 ? ',' : ''}
`;
    });

    mdx += `  ]}
/>

`;
  }

  // Add examples if available
  if (data.examples && data.examples.length > 0) {
    mdx += `## Examples

`;
    
    data.examples.forEach(example => {
      mdx += `- ${example}\n`;
    });
    
    mdx += '\n';
  }

  // Add notes if available
  if (data.notes && data.notes.length > 0) {
    mdx += `## Notes

`;
    
    data.notes.forEach(note => {
      mdx += `- ${note}\n`;
    });
    
    mdx += '\n';
  }

  // Add see also if available
  if (data.seeAlso && data.seeAlso.length > 0) {
    mdx += `<SeeAlso
  links={[
`;

    // Generate links array
    data.seeAlso.forEach((link, index) => {
      mdx += `    {
      text: ${safeJsonStringify(link.text)},
      href: ${safeJsonStringify(link.href)}
    }${index < data.seeAlso.length - 1 ? ',' : ''}
`;
    });

    mdx += `  ]}
/>
`;
  }

  return mdx;
}

/**
 * Processes a single HTML file
 */
function processFile(htmlFile, mdxFile) {
  console.log(`Processing ${htmlFile} -> ${mdxFile}`);
  
  try {
    // Read the HTML file
    const html = fs.readFileSync(htmlFile, 'utf8');
    const $ = cheerio.load(html);
    
    // Extract data
    const title = extractTitle($);
    const sidebarLabel = extractSidebarLabel(title);
    const description = extractDescription($);
    const values = extractValues($);
    const examples = extractExamples($);
    const notes = extractNotes($);
    const seeAlso = extractSeeAlso($);
    
    // Build the MDX content
    const data = {
      title,
      sidebarLabel,
      description,
      values,
      examples,
      notes,
      seeAlso
    };
    
    const mdxContent = buildMdxFile(data);
    
    // Create target directory if it doesn't exist
    const targetDirPath = path.dirname(mdxFile);
    if (!fs.existsSync(targetDirPath)) {
      fs.mkdirSync(targetDirPath, { recursive: true });
    }
    
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
 * Creates an index file for the directory
 */
function createIndexFile() {
  console.log('Creating index.mdx file');
  
  // Get all HTML files
  const htmlFiles = fs.readdirSync(sourceDir)
    .filter(file => file.endsWith('.html') && file !== 'index.html')
    .sort(); // Sort files alphabetically
  
  let mdxContent = `---
title: "Attributes"
sidebar_label: "Attributes"
---

import { InLink } from '@site/src/components/global/InLink';

# Attributes

This section contains documentation for all attributes in the ISBD for Manifestation model.

`;

  // Add links for each file
  htmlFiles.forEach(file => {
    const baseName = path.basename(file, '.html');
    
    // Skip general.html
    if (baseName === 'general') {
      return;
    }
    
    // Read the HTML file to get the title
    try {
      const html = fs.readFileSync(path.join(sourceDir, file), 'utf8');
      const $ = cheerio.load(html);
      const title = extractTitle($);
      
      mdxContent += `- <InLink href="/docs/attributes/${baseName}">${title}</InLink>\n`;
    } catch (error) {
      console.error(`Error processing ${file} for index:`, error);
      mdxContent += `- <InLink href="/docs/attributes/${baseName}">${baseName}</InLink>\n`;
    }
  });
  
  // Write the index file
  fs.writeFileSync(path.join(targetDir, 'index.mdx'), mdxContent);
  
  console.log('Index file created successfully');
}

/**
 * Main function to process all files
 */
function processAllFiles() {
  // Get all HTML files
  const htmlFiles = fs.readdirSync(sourceDir)
    .filter(file => file.endsWith('.html') && file !== 'index.html')
    .map(file => path.join(sourceDir, file));
  
  console.log(`Found ${htmlFiles.length} HTML files to process`);
  
  const results = {
    success: [],
    error: []
  };
  
  // Process each file
  htmlFiles.forEach(htmlFile => {
    // Determine the target MDX file
    const baseName = path.basename(htmlFile, '.html');
    const mdxFile = path.join(targetDir, `${baseName}.mdx`);
    
    // Process the file
    const result = processFile(htmlFile, mdxFile);
    
    if (result.success) {
      results.success.push(result);
    } else {
      results.error.push(result);
    }
  });
  
  // Create an index file
  createIndexFile();
  
  console.log(`Successfully processed ${results.success.length} files`);
  if (results.error.length > 0) {
    console.log(`Failed to process ${results.error.length} files:`);
    results.error.forEach(result => {
      console.log(`  - ${result.fileName}: ${result.error}`);
    });
  }
}

// Run the processing
processAllFiles();