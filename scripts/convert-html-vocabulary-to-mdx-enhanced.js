const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const yaml = require('js-yaml');

/**
 * Converts HTML vocabulary files to MDX format with SKOS-aligned concepts
 * Enhanced version that properly handles OutLink components and attribution sections
 */
function convertHtmlVocabularyToMdx(htmlFilePath, outputFilePath) {
  try {
    // Read the HTML file
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
    const $ = cheerio.load(htmlContent);

    // Extract vocabulary metadata and terms
    const title = $('h3').text().trim();
    const guid = $('.guid').first();
    const description = guid.find('p').first().text().trim();
    const scopeNote = guid.find('p').eq(1).text().trim();

    // Extract the vocabulary ID from the filename (for numeric vocabularies)
    const filenameBase = path.basename(htmlFilePath, '.html');
    const vocabularyId = filenameBase.match(/^\d+$/) ? filenameBase : null;

    // Extract terms and definitions from the table rows
    const conceptRows = [];
    
    // Process each row individually to avoid concatenation issues
    $('.row').each(function() {
      const $row = $(this);
      const valueCell = $row.find('.vesValue');
      
      // Only process rows that contain a value cell
      if (valueCell.length > 0) {
        const value = valueCell.find('p').text().trim();
        const definitionCell = valueCell.next();
        const definition = definitionCell.find('p').text().trim();
        const scopeNoteCell = definitionCell.next();
        const scopeNote = scopeNoteCell.find('p').text().trim();
        
        // Only add the concept if the value is not empty
        if (value) {
          const concept = { value, definition };
          if (scopeNote) {
            concept.scopeNote = scopeNote;
          }
          conceptRows.push(concept);
        }
      }
    });

    // Check for duplicate or concatenated concepts by looking for values already in the list
    const fixedConcepts = [];
    const seenValues = new Set();
    
    conceptRows.forEach(concept => {
      if (!seenValues.has(concept.value)) {
        fixedConcepts.push(concept);
        seenValues.add(concept.value);
      } else {
        console.warn(`Skipping duplicate concept: ${concept.value}`);
      }
    });

    // Extract the attribution info
    const attributionDiv = $('.row.mt-2 .guid');
    let attributionContent = null;
    let hasOutlinks = false;
    
    if (attributionDiv.length) {
      // Process attribution links and content
      attributionContent = processAttributionSection(attributionDiv);
      hasOutlinks = attributionDiv.find('a[target="_blank"]').length > 0;
    }

    // Generate YAML front matter
    const frontMatter = {
      vocabularyId: vocabularyId,
      title,
      uri: `http://iflastandards.info/ns/isbdm/values/${vocabularyId}`,
      description,
      isDefinedBy: `http://iflastandards.info/ns/isbdm/values/${vocabularyId}`,
      scopeNote,
      concepts: fixedConcepts
    };

    // Element link path extraction
    const elementLink = guid.find('a').first();
    const elementPath = elementLink.length ? elementLink.attr('href') : null;
    const elementName = elementLink.length ? elementLink.text().trim() : null;

    // Generate MDX content
    let mdxContent = '---\n';
    mdxContent += yaml.dump(frontMatter, { lineWidth: -1 });
    mdxContent += '---\n\n';
    mdxContent += 'import VocabularyTable from \'@site/src/components/global/VocabularyTable\';\n';
    
    mdxContent += '\n# {frontMatter.title}\n\n';

    if (elementPath && elementName) {
      // Convert the element path to relative (removing the /ISBDM prefix if present)
      const relativePath = elementPath.replace(/^\/ISBDM/, '');
      mdxContent += `For use with element: [${elementName}](${relativePath})\n\n`;
    }

    mdxContent += '<VocabularyTable \n';
    mdxContent += '  {...frontMatter} \n';
    mdxContent += '  showTitle={false}\n';
    mdxContent += '  filterPlaceholder="Filter vocabulary terms..."\n';
    mdxContent += '/>\n\n';

    // Add attribution note if found
    if (attributionContent) {
      mdxContent += '---\n\n';
      mdxContent += '<div className="guid">\n';
      mdxContent += attributionContent + '\n';
      mdxContent += '</div>\n\n';
    }

    mdxContent += 'export const toc = VocabularyTable.generateTOC(frontMatter);\n';

    // Write MDX file
    fs.writeFileSync(outputFilePath, mdxContent);
    console.log(`Converted ${htmlFilePath} to ${outputFilePath}`);
    
    return {
      success: true,
      htmlFilePath,
      outputFilePath,
      conceptCount: fixedConcepts.length,
      hasAttribution: !!attributionContent
    };
  } catch (error) {
    console.error(`Error converting ${htmlFilePath}:`, error);
    return {
      success: false,
      htmlFilePath,
      error: error.message
    };
  }
}

/**
 * Processes attribution section HTML to create proper MDX with OutLink components
 * @param {Object} attributionDiv - Cheerio object with the attribution div
 * @returns {string} - Processed MDX content
 */
function processAttributionSection(attributionDiv) {
  const $ = cheerio.load(attributionDiv.html());
  
  // Process all external links (with target="_blank") to use OutLink
  $('a[target="_blank"]').each(function() {
    const href = $(this).attr('href');
    const text = $(this).text();
    
    // Replace with OutLink component
    $(this).replaceWith(`<OutLink href="${href}">${text}</OutLink>`);
  });
  
  // Process all internal links to use markdown syntax
  $('a:not([target="_blank"])').each(function() {
    const href = $(this).attr('href');
    const text = $(this).text();
    
    // Remove /ISBDM prefix from internal links
    const fixedHref = href.replace(/^\/ISBDM/, '');
    $(this).replaceWith(`[${text}](${fixedHref})`);
  });
  
  // Convert paragraphs to proper JSX format
  let result = '';
  $('p').each(function() {
    result += '<p>' + $(this).html() + '</p>\n';
  });
  
  // If there were no paragraphs, just use the raw HTML
  if (!result) {
    result = $.html();
  }
  
  return result;
}

// Export the function for use in other scripts
module.exports = convertHtmlVocabularyToMdx;

// If this script is run directly, process the command line arguments
if (require.main === module) {
  const [,, inputFile, outputFile] = process.argv;
  
  if (!inputFile || !outputFile) {
    console.error('Usage: node convert-html-vocabulary-to-mdx-enhanced.js <input-html-file> <output-mdx-file>');
    process.exit(1);
  }
  
  const result = convertHtmlVocabularyToMdx(inputFile, outputFile);
  
  if (result.success) {
    console.log(`Conversion successful: ${result.conceptCount} concepts extracted`);
    
    if (result.hasAttribution) {
      console.log('Attribution note was found and included');
    }
  } else {
    console.error('Conversion failed:', result.error);
    process.exit(1);
  }
}