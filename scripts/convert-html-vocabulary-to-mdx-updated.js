const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const yaml = require('js-yaml');

/**
 * Converts HTML vocabulary files to MDX format with SKOS-aligned concepts
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
    const concepts = [];
    const rows = $('.row').filter(function() {
      return $(this).find('.vesValue').length > 0;
    });

    rows.each(function() {
      const value = $(this).find('.vesValue p').text().trim();
      const definition = $(this).find('.vesValue').next().find('p').text().trim();
      const scopeNoteCol = $(this).find('.vesValue').next().next();
      const scopeNote = scopeNoteCol.find('p').text().trim();

      const concept = {
        value,
        definition
      };

      if (scopeNote) {
        concept.scopeNote = scopeNote;
      }

      concepts.push(concept);
    });

    // Extract the attribution note if present
    const attributionDiv = $('.row.mt-2 .guid');
    let attributionText = null;
    
    if (attributionDiv.length) {
      // Get the HTML content of the attribution div
      attributionText = attributionDiv.text().trim();
    }

    // Generate YAML front matter
    const frontMatter = {
      vocabularyId: vocabularyId,
      title,
      uri: `http://iflastandards.info/ns/isbdm/values/${vocabularyId}`,
      description,
      isDefinedBy: `http://iflastandards.info/ns/isbdm/values/${vocabularyId}`,
      scopeNote,
      concepts
    };

    // Element link path extraction
    const elementLink = guid.find('a').first();
    const elementPath = elementLink.length ? elementLink.attr('href') : null;
    const elementName = elementLink.length ? elementLink.text().trim() : null;

    // Generate MDX content
    let mdxContent = '---\n';
    mdxContent += yaml.dump(frontMatter, { lineWidth: -1 });
    mdxContent += '---\n\n';
    mdxContent += 'import VocabularyTable from \'@site/src/components/global/VocabularyTable\';\n\n';
    mdxContent += '# {frontMatter.title}\n\n';

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
    if (attributionText) {
      mdxContent += '---\n\n';
      mdxContent += attributionText + '\n\n';
    }

    mdxContent += 'export const toc = VocabularyTable.generateTOC(frontMatter);\n';

    // Write MDX file
    fs.writeFileSync(outputFilePath, mdxContent);
    console.log(`Converted ${htmlFilePath} to ${outputFilePath}`);
    
    return {
      success: true,
      htmlFilePath,
      outputFilePath,
      conceptCount: concepts.length,
      hasAttribution: !!attributionText
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

// Export the function for use in other scripts
module.exports = convertHtmlVocabularyToMdx;

// If this script is run directly, process the command line arguments
if (require.main === module) {
  const [,, inputFile, outputFile] = process.argv;
  
  if (!inputFile || !outputFile) {
    console.error('Usage: node convert-html-vocabulary-to-mdx.js <input-html-file> <output-mdx-file>');
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