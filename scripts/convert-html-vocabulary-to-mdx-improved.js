const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const yaml = require('js-yaml');

/**
 * Converts HTML vocabulary files to MDX format with SKOS-aligned concepts
 * Improved version that prevents concatenation issues in the output
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

    // Check for potential concatenation issues in the output
    const conceptsValidation = validateConcepts(conceptRows);
    if (!conceptsValidation.valid) {
      console.warn(`Warning in ${htmlFilePath}: ${conceptsValidation.message}`);
    }

    // Write MDX file
    fs.writeFileSync(outputFilePath, mdxContent);
    console.log(`Converted ${htmlFilePath} to ${outputFilePath}`);
    
    return {
      success: true,
      htmlFilePath,
      outputFilePath,
      conceptCount: conceptRows.length,
      hasAttribution: !!attributionText,
      validationWarnings: conceptsValidation.valid ? [] : [conceptsValidation.message]
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
 * Validates concept data for potential issues
 * @param {Array} concepts - The concepts array to validate
 * @returns {Object} Validation result with valid flag and message
 */
function validateConcepts(concepts) {
  // Check for empty values
  const emptyValues = concepts.filter(c => !c.value);
  if (emptyValues.length > 0) {
    return { 
      valid: false, 
      message: `Found ${emptyValues.length} concepts with empty values` 
    };
  }
  
  // Check for long values that might be concatenated
  const longValues = concepts.filter(c => c.value.length > 50);
  if (longValues.length > 0) {
    return { 
      valid: false, 
      message: `Found ${longValues.length} concepts with suspiciously long values (possible concatenation)` 
    };
  }
  
  // Check for duplicate concepts
  const valueSet = new Set();
  const duplicates = [];
  
  for (const concept of concepts) {
    if (valueSet.has(concept.value)) {
      duplicates.push(concept.value);
    } else {
      valueSet.add(concept.value);
    }
  }
  
  if (duplicates.length > 0) {
    return { 
      valid: false, 
      message: `Found ${duplicates.length} duplicate concept values: ${duplicates.join(', ')}` 
    };
  }
  
  return { valid: true };
}

// Export the function for use in other scripts
module.exports = convertHtmlVocabularyToMdx;

// If this script is run directly, process the command line arguments
if (require.main === module) {
  const [,, inputFile, outputFile] = process.argv;
  
  if (!inputFile || !outputFile) {
    console.error('Usage: node convert-html-vocabulary-to-mdx-improved.js <input-html-file> <output-mdx-file>');
    process.exit(1);
  }
  
  const result = convertHtmlVocabularyToMdx(inputFile, outputFile);
  
  if (result.success) {
    console.log(`Conversion successful: ${result.conceptCount} concepts extracted`);
    
    if (result.hasAttribution) {
      console.log('Attribution note was found and included');
    }
    
    if (result.validationWarnings && result.validationWarnings.length > 0) {
      console.warn(`Warning: ${result.validationWarnings.join(', ')}`);
    }
  } else {
    console.error('Conversion failed:', result.error);
    process.exit(1);
  }
}