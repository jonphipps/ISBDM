#!/usr/bin/env node

/**
 * This script verifies that the HTML to MDX conversion retained all vocabulary terms.
 * It compares the source HTML content with the converted MDX content.
 * 
 * Usage: node verify-conversion.js <html-file> <mdx-file>
 * Example: node verify-conversion.js /Users/jonphipps/Code/ISBDM/ISBDM/docs/ves/1275.html /Users/jonphipps/Code/ISBDM/docs/ves/1275.mdx
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const yaml = require('js-yaml');
const matter = require('gray-matter');

// Check for input and output file arguments
if (process.argv.length < 4) {
  console.error('Usage: node verify-conversion.js <html-file> <mdx-file>');
  process.exit(1);
}

const htmlFile = process.argv[2];
const mdxFile = process.argv[3];

// Function to extract terms from HTML table rows
function extractTermsFromHtml(htmlContent) {
  const $ = cheerio.load(htmlContent);
  const terms = [];

  // Get the data rows from the main content area, excluding navigation
  const tableRows = $('.col-md-7.border.rounded .row').not('.vesHeader').not('.row.m-1');

  tableRows.each((index, row) => {
    const $row = $(row);
    const $cells = $row.find('div');

    // Skip if this doesn't look like a proper data row
    if ($cells.length < 3) return;

    // Clean the text by normalizing whitespace
    const valueRaw = $cells.eq(0).text().trim();
    const definitionRaw = $cells.eq(1).text().trim();
    const scopeNoteRaw = $cells.eq(2).text().trim();

    // Clean up whitespace
    const value = valueRaw.replace(/\s+/g, ' ').trim();
    const definition = definitionRaw.replace(/\s+/g, ' ').trim();
    const scopeNote = scopeNoteRaw.replace(/\s+/g, ' ').trim();

    // Skip navigation rows or rows without a proper value and definition
    if (value.includes('SES') || value.includes('ISBDM') || !value || !definition) {
      return;
    }

    // Store the term
    const term = {
      value,
      definition,
      scopeNote: scopeNote || null
    };

    terms.push(term);
  });

  return terms;
}

// Function to extract concepts from MDX front matter
function extractConceptsFromMdx(mdxContent) {
  try {
    // Parse front matter
    const { data } = matter(mdxContent);
    
    // Check if using new format (concepts) or old format (RDF.values)
    const concepts = data.concepts || (data.RDF && data.RDF.values) || [];
    
    // Normalize concepts
    return concepts.map(concept => ({
      value: concept.value.trim(),
      definition: concept.definition.trim(),
      scopeNote: concept.scopeNote ? concept.scopeNote.trim() : null
    }));
  } catch (error) {
    console.error('Error parsing MDX front matter:', error);
    return [];
  }
}

// Function to compare terms between HTML and MDX
function compareTerms(htmlTerms, mdxConcepts) {
  console.log(`HTML terms: ${htmlTerms.length}`);
  console.log(`MDX concepts: ${mdxConcepts.length}`);
  
  // Check counts
  if (htmlTerms.length !== mdxConcepts.length) {
    console.error(`Count mismatch! HTML has ${htmlTerms.length} terms, MDX has ${mdxConcepts.length} concepts.`);
    
    // Find missing terms
    const htmlValues = htmlTerms.map(term => term.value);
    const mdxValues = mdxConcepts.map(concept => concept.value);
    
    const missingInMdx = htmlValues.filter(value => !mdxValues.includes(value));
    const extraInMdx = mdxValues.filter(value => !htmlValues.includes(value));
    
    if (missingInMdx.length > 0) {
      console.error('Terms missing in MDX:');
      missingInMdx.forEach(value => {
        console.error(`- ${value}`);
      });
    }
    
    if (extraInMdx.length > 0) {
      console.error('Extra terms in MDX:');
      extraInMdx.forEach(value => {
        console.error(`- ${value}`);
      });
    }
    
    return false;
  }
  
  // Check content of each term
  let contentMatch = true;
  
  // Sort both arrays by value to ensure we're comparing the same terms
  const sortedHtmlTerms = [...htmlTerms].sort((a, b) => a.value.localeCompare(b.value));
  const sortedMdxConcepts = [...mdxConcepts].sort((a, b) => a.value.localeCompare(b.value));
  
  sortedHtmlTerms.forEach((htmlTerm, index) => {
    const mdxConcept = sortedMdxConcepts[index];
    
    // Values should already be normalized, but we'll double-check
    if (htmlTerm.value !== mdxConcept.value) {
      console.error(`Value mismatch at index ${index}:`);
      console.error(`HTML normalized: "${htmlTerm.value}"`);
      console.error(`MDX normalized: "${mdxConcept.value}"`);
      contentMatch = false;
    }
    
    // Definitions should also be normalized
    if (htmlTerm.definition !== mdxConcept.definition) {
      console.error(`Definition mismatch for term "${htmlTerm.value}":`);
      console.error(`HTML normalized: "${htmlTerm.definition}"`);
      console.error(`MDX normalized: "${mdxConcept.definition}"`);
      contentMatch = false;
    }
    
    // Compare scope notes (if they exist)
    if (htmlTerm.scopeNote || mdxConcept.scopeNote) {
      // Convert null to empty string for comparison
      const htmlNote = htmlTerm.scopeNote || '';
      const mdxNote = mdxConcept.scopeNote || '';

      if (htmlNote !== mdxNote) {
        console.error(`Scope note mismatch for term "${htmlTerm.value}":`);
        console.error(`HTML normalized: "${htmlNote}"`);
        console.error(`MDX normalized: "${mdxNote}"`);
        contentMatch = false;
      }
    }
  });
  
  return contentMatch;
}

// Main verification function
function verifyConversion() {
  try {
    console.log(`Verifying conversion from ${path.basename(htmlFile)} to ${path.basename(mdxFile)}...`);
    
    // Read files
    const htmlContent = fs.readFileSync(htmlFile, 'utf8');
    const mdxContent = fs.readFileSync(mdxFile, 'utf8');
    
    // Extract terms
    const htmlTerms = extractTermsFromHtml(htmlContent);
    const mdxConcepts = extractConceptsFromMdx(mdxContent);
    
    // Compare terms
    const termsMatch = compareTerms(htmlTerms, mdxConcepts);
    
    if (termsMatch) {
      console.log('✅ Verification successful! All terms were properly converted.');
      return true;
    } else {
      console.error('❌ Verification failed! There are discrepancies between HTML and MDX content.');
      return false;
    }
  } catch (error) {
    console.error('Error during verification:', error);
    return false;
  }
}

// Run verification
const success = verifyConversion();
process.exit(success ? 0 : 1);