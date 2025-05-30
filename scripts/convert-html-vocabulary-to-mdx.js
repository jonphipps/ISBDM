#!/usr/bin/env node

/**
 * This script converts HTML vocabulary files from ISBDM/docs/ves/ to MDX files in docs/ves/
 * It extracts vocabulary values, definitions, and scope notes from HTML tables
 * and creates a front matter for the MDX file with SKOS-aligned structure.
 * 
 * Usage: node convert-html-vocabulary-to-mdx.js <input-file> <output-file>
 * Example: node convert-html-vocabulary-to-mdx.js /Users/jonphipps/Code/ISBDM/ISBDM/docs/ves/1275.html /Users/jonphipps/Code/ISBDM/docs/ves/1275.mdx
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const yaml = require('js-yaml');

// Check for input and output file arguments
if (process.argv.length < 4) {
  console.error('Usage: node convert-html-vocabulary-to-mdx.js <input-file> <output-file>');
  process.exit(1);
}

const inputFile = process.argv[2];
const outputFile = process.argv[3];

// Function to extract vocabulary ID from filename
function extractVocabularyId(filename) {
  const basename = path.basename(filename, '.html');
  // If it's a number, return it; otherwise return the basename
  return /^\d+$/.test(basename) ? basename : basename;
}

// Function to clean up text with excess whitespace
function cleanText(text) {
  if (!text) return '';

  // Remove extra whitespace and normalize line breaks
  return text
    .replace(/\s+/g, ' ')
    .trim();
}

// Function to extract concepts from HTML table rows
function extractConcepts($, rows) {
  const concepts = [];
  
  rows.each((index, row) => {
    const $row = $(row);
    const $cells = $row.find('div');
    
    // Skip if this doesn't look like a proper data row
    if ($cells.length < 3) return;

    const value = cleanText($cells.eq(0).text());
    const definition = cleanText($cells.eq(1).text());
    const scopeNote = cleanText($cells.eq(2).text());
    
    // Skip navigation rows or rows without a proper value and definition
    if (value.includes('SES') || value.includes('ISBDM') || !value || !definition) {
      return;
    }
    
    // Only add if we have at least a value and definition
    const concept = {
      value,
      definition
    };
    
    if (scopeNote) {
      concept.scopeNote = scopeNote;
    }
    
    concepts.push(concept);
  });
  
  return concepts;
}

// Function to extract target element from a vocabulary HTML page
function extractTargetElement($) {
  // Try to find the target element link
  const targetElementLink = $('a.linkInline');
  let targetElement = '';

  if (targetElementLink.length) {
    targetElement = targetElementLink.text().trim();
  }

  return targetElement;
}

// Function to extract attribution note from the page
function extractAttributionNote($) {
  // Look for the attribution div that comes after the vocabulary table
  const attributionDiv = $('.row.mt-2 .guid');

  if (attributionDiv.length) {
    return attributionDiv.text().trim();
  }

  return null;
}

// Main conversion function
function convertHtmlToMdx(htmlContent) {
  const $ = cheerio.load(htmlContent);

  // Extract vocabulary ID
  const vocabularyId = extractVocabularyId(inputFile);

  // Extract vocabulary title
  const title = $('h3').first().text().trim();

  // Extract vocabulary description and scope note
  const descriptionParagraphs = $('.guid p');
  let description = '';
  let scopeNote = '';

  if (descriptionParagraphs.length >= 1) {
    description = cleanText(descriptionParagraphs.eq(0).text());
  }

  if (descriptionParagraphs.length >= 2) {
    scopeNote = cleanText(descriptionParagraphs.eq(1).text());
  }

  // Extract target element for usage note
  const targetElement = extractTargetElement($);

  // Extract any attribution note
  const attribution = extractAttributionNote($);

  // Extract concepts from table rows - only use rows in the border rounded container
  const tableRows = $('.col-md-7.border.rounded .row').not('.vesHeader').not('.row.m-1');
  const concepts = extractConcepts($, tableRows);
  
  // Build front matter object
  const frontMatter = {
    vocabularyId,
    title,
    uri: `http://iflastandards.info/ns/isbdm/values/${vocabularyId}`,
    description,
    isDefinedBy: `http://iflastandards.info/ns/isbdm/values/${vocabularyId}`
  };
  
  if (scopeNote) {
    frontMatter.scopeNote = scopeNote;
  }
  
  // Add concepts array
  frontMatter.concepts = concepts;
  
  // Create MDX content
  let mdxContent = '---\n';
  mdxContent += yaml.dump(frontMatter, {
    quotingType: '"',
    lineWidth: 80,
    noRefs: true // Avoid YAML references for cleaner output
  });
  mdxContent += '---\n\n';
  mdxContent += 'import VocabularyTable from \'@site/src/components/global/VocabularyTable\';\n\n';
  mdxContent += `# {frontMatter.title}\n\n`;

  if (targetElement) {
    mdxContent += `For use with element: [${targetElement}](/docs/attributes/${vocabularyId}.html)\n\n`;
  }

  mdxContent += '<VocabularyTable \n';
  mdxContent += '  {...frontMatter} \n';
  mdxContent += '  showTitle={false}\n';
  mdxContent += '  filterPlaceholder="Filter vocabulary terms..."\n';
  mdxContent += '/>\n\n';

  // Add attribution note if it exists
  if (attribution) {
    mdxContent += `---\n\n${attribution}\n\n`;
  }

  mdxContent += 'export const toc = VocabularyTable.generateTOC(frontMatter);\n';
  
  return mdxContent;
}

// Read the HTML file
console.log(`Reading HTML file: ${inputFile}`);
const htmlContent = fs.readFileSync(inputFile, 'utf8');

// Convert HTML to MDX
console.log('Converting HTML to MDX...');
const mdxContent = convertHtmlToMdx(htmlContent);

// Write MDX file
console.log(`Writing MDX file: ${outputFile}`);
fs.writeFileSync(outputFile, mdxContent);

console.log('Conversion complete!');