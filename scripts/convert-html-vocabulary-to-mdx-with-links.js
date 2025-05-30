const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const yaml = require('js-yaml');

/**
 * Converts HTML vocabulary files to MDX format with SKOS-aligned concepts
 * Enhanced version that preserves links and attribution sections
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
    const valueRows = $('.row').filter(function() {
      return $(this).find('.vesValue').length > 0;
    });
    
    // Process each row individually to avoid concatenation issues
    valueRows.each(function(index) {
      const $row = $(this);
      const valueCell = $row.find('.vesValue');
      
      // Make sure we have a value cell before proceeding
      if (valueCell.length === 0) {
        return; // Skip this row
      }
      
      // Extract the value, definition, and scope note
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
    });

    // Extract the attribution note if present, preserving links
    const attributionDiv = $('.row.mt-2 .guid');
    let attributionHtml = null;
    let attributionMdx = null;
    
    if (attributionDiv.length) {
      attributionHtml = attributionDiv.html();
      
      // Process links in attribution
      attributionMdx = convertAttributionToMdx(attributionHtml);
    }

    // Generate YAML front matter
    const frontMatter = {
      vocabularyId: vocabularyId,
      title,
      uri: `http://iflastandards.info/ns/isbdm/values/${vocabularyId}`,
      description,
      isDefinedBy: `http://iflastandards.info/ns/isbdm/values/${vocabularyId}`,
      scopeNote,
      concepts: conceptRows
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
    
    // Add OutLink component import if there are outlinks in the attribution
    if (attributionMdx && attributionMdx.includes('<OutLink')) {
      mdxContent += 'import OutLink from \'@site/src/components/global/OutLink\';\n';
    }
    
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
    if (attributionMdx) {
      mdxContent += '---\n\n';
      mdxContent += '<div className="guid">\n';
      mdxContent += attributionMdx + '\n';
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
      conceptCount: conceptRows.length,
      hasAttribution: !!attributionMdx
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
 * Converts HTML attribution content to MDX format with proper component usage
 * @param {string} htmlContent - The HTML content to convert
 * @returns {string} - The MDX content
 */
function convertAttributionToMdx(htmlContent) {
  if (!htmlContent) return null;

  const $ = cheerio.load(htmlContent);
  
  // Process all outbound links (with target="_blank")
  $('a[target="_blank"]').each(function() {
    const $link = $(this);
    const href = $link.attr('href');
    const text = $link.text();
    
    // Replace with OutLink component
    $link.replaceWith(`<OutLink href="${href}">${text}</OutLink>`);
  });
  
  // Process all standard links
  $('a:not([target="_blank"])').each(function() {
    const $link = $(this);
    const href = $link.attr('href');
    const text = $link.text();
    
    // Replace with markdown link
    $link.replaceWith(`[${text}](${href.replace(/^\/ISBDM/, '')})`);
  });

  // Get the processed content
  // Remove <p> tags but preserve linebreaks
  let result = $.text().trim();
  
  // Clean up any remnant HTML entities
  result = result.replace(/&nbsp;/g, ' ')
                 .replace(/&amp;/g, '&')
                 .replace(/&lt;/g, '<')
                 .replace(/&gt;/g, '>')
                 .replace(/&quot;/g, '"')
                 .replace(/&#39;/g, "'");
                 
  return result;
}

// Export the function for use in other scripts
module.exports = convertHtmlVocabularyToMdx;

// If this script is run directly, process the command line arguments
if (require.main === module) {
  const [,, inputFile, outputFile] = process.argv;
  
  if (!inputFile || !outputFile) {
    console.error('Usage: node convert-html-vocabulary-to-mdx-with-links.js <input-html-file> <output-mdx-file>');
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