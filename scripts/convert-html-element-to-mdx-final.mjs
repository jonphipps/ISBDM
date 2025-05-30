#!/usr/bin/env node

/**
 * Final unified script to convert HTML element files to MDX format with proper frontmatter,
 * table formatting, and example cleaning in a single step.
 * 
 * This script matches the exact format of converted-1025.mdx with:
 * - Proper markdown table formatting in examples
 * - Description formatting with *[...]* notation
 * - Horizontal rules between examples
 */

import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';
import * as cheerio from 'cheerio';
import * as yaml from 'js-yaml';

/**
 * Sanitize multi-line strings for consistent formatting
 * @param {string} text - The text to sanitize
 * @returns {string} - Sanitized text
 */
function sanitizeMultilineString(text) {
  if (!text) return "";
  
  // Replace excessive whitespace with a single space
  let sanitized = text.replace(/\s+/g, ' ');
  
  // Trim the text
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Extract information from the HTML file and transform into proper frontmatter and MDX content
 * @param {string} html - The HTML content to convert
 * @param {string} filePath - The original file path
 * @returns {Object} Object containing frontmatter and content
 */
function extractInformation(html, filePath) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const $ = cheerio.load(html);
  
  // Basic information extraction
  const h3 = document.querySelector('h3');
  const label = h3?.textContent?.trim() || '';
  const basename = path.basename(filePath, '.html');
  const isNumeric = /^\d+$/.test(basename);
  
  // Extract definition
  const definition = sanitizeMultilineString($('.eltext').first().text().trim() || '');
  
  // Extract scope note
  const scopeNoteRows = Array.from($('.row')).filter(row => 
    $(row).find('.elref').text().trim() === 'Scope note'
  );
  const scopeNote = scopeNoteRows.length > 0 
    ? sanitizeMultilineString($(scopeNoteRows[0]).find('.eltext').text().trim())
    : '';
  
  // Extract domain and range
  const domainRows = Array.from($('.row')).filter(row => 
    $(row).find('.elref').text().trim() === 'Domain'
  );
  const domain = domainRows.length > 0 
    ? sanitizeMultilineString($(domainRows[0]).find('.eltext').text().trim())
    : 'Manifestation';
  
  const rangeRows = Array.from($('.row')).filter(row => 
    $(row).find('.elref').text().trim() === 'Range'
  );
  const range = rangeRows.length > 0 
    ? sanitizeMultilineString($(rangeRows[0]).find('.eltext').text().trim())
    : 'Literal';
  
  // Extract elementSubType
  const elementSubTypes = [];
  const elementSubTypeRows = Array.from($('.row')).filter(row => 
    $(row).find('.elref').text().trim() === 'Element sub-type'
  );
  
  if (elementSubTypeRows.length > 0) {
    const links = $(elementSubTypeRows[0]).find('.linkMenuElement');
    links.each((i, link) => {
      const href = $(link).attr('href') || '';
      const linkBasename = path.basename(href, '.html');
      const isNumericSubtype = /^\d+$/.test(linkBasename);
      const linkSection = href.split('/')[3] || 'statements'; // Extract section from href path
      
      elementSubTypes.push({
        uri: `http://iflastandards.info/ns/isbdm/elements/P${linkBasename}`,
        url: `/docs/${linkSection}/${linkBasename}`,
        label: sanitizeMultilineString($(link).text().trim())
      });
    });
  }
  
  // Extract elementSuperType
  const elementSuperTypes = [];
  const elementSuperTypeRows = Array.from($('.row')).filter(row => 
    $(row).find('.elref').text().trim() === 'Element super-type'
  );
  
  if (elementSuperTypeRows.length > 0) {
    const links = $(elementSuperTypeRows[0]).find('.linkMenuElement');
    links.each((i, link) => {
      const href = $(link).attr('href') || '';
      const linkBasename = path.basename(href, '.html');
      const isNumericSupertype = /^\d+$/.test(linkBasename);
      const linkSection = href.split('/')[3] || 'statements'; // Extract section from href path
      
      elementSuperTypes.push({
        uri: `http://iflastandards.info/ns/isbdm/elements/P${linkBasename}`,
        url: `/docs/${linkSection}/${linkBasename}`,
        label: sanitizeMultilineString($(link).text().trim())
      });
    });
  }
  
  // Determine property type
  const type = range === 'Literal' ? 'DatatypeProperty' : 'ObjectProperty';
  
  // Generate a slug-friendly ID and kebab-cased label
  const slugId = isNumeric ? basename : basename.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  const kebabLabel = label.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  
  // Extract section from path - find the appropriate section
  const pathParts = filePath.split('/');
  let section = 'statements'; // Default
  for (let i = 0; i < pathParts.length; i++) {
    if (pathParts[i] === 'docs' && i + 1 < pathParts.length) {
      section = pathParts[i + 1];
      break;
    }
  }
  if (section === 'ISBDM') {
    section = 'statements'; // Default if we're in the source HTML
  }
  
  // Create frontmatter according to project standards
  const frontmatter = {
    // Docusaurus-specific fields
    id: basename,
    slug: `/docs/${section}/${basename}`,
    aliases: [
      `/elements/P${basename}`, 
      `/${section}/${kebabLabel}`
    ],
    sidebar_label: label,
    // Default values - these could be extracted from HTML if available
    sidebar_position: 1,
    sidebar_level: 2,
    
    // RDF metadata as a separate section - this is what ElementReference will use
    RDF: {
      label: label,
      definition: definition,
      domain: domain,
      range: range || "",
      uri: `http://iflastandards.info/ns/isbdm/elements/P${basename}`,
      type: type,
      scopeNote: scopeNote || "",
      elementSubType: elementSubTypes.length > 0 ? elementSubTypes : [],
      elementSuperType: elementSuperTypes.length > 0 ? elementSuperTypes : [],
      status: "Published",
      isDefinedBy: "http://iflastandards.info/ns/isbdm/elements/",
      equivalentProperty: [],
      inverseOf: []
    }
  };
  
  // Add optional properties only if they exist
  if (scopeNote) {
    frontmatter.scopeNote = scopeNote;
  } else {
    frontmatter.scopeNote = ""; // Empty attribute as per specs
  }
  
  // Pass all necessary data to the content converter
  const contentData = {
    definition,
    domain,
    range,
    basename,
    type,
    scopeNote,
    elementSubTypes,
    elementSuperTypes
  };
  
  // Build MDX content
  const content = convertContentToMdx(document, label, contentData);
  
  return { frontmatter, content };
}

/**
 * Convert HTML content to MDX format
 * @param {Document} document - The DOM document
 * @param {string} label - The element label
 * @param {Object} data - The element data (definition, domain, type, etc.)
 * @returns {string} MDX content
 */
function convertContentToMdx(document, label, data) {
  const { 
    definition, 
    domain, 
    range = "", 
    basename, 
    type, 
    scopeNote = "", 
    elementSubTypes = [],
    elementSuperTypes = []
  } = data;
  
  const content = [];
  
  // Add title - handle long titles by breaking them across lines
  if (label.length > 60) {
    const splitPoint = label.lastIndexOf(' ', 60);
    if (splitPoint > 0) {
      content.push(`# ${label.substring(0, splitPoint)}\n  ${label.substring(splitPoint + 1)}\n`);
    } else {
      content.push(`# ${label}\n`);
    }
  } else {
    content.push(`# ${label}\n`);
  }
  
  // Add Element Reference section with proper component
  // Create a serializable version of the RDF data to pass directly
  const rdfData = {
    label,
    definition,
    domain,
    range: range || "",
    uri: `http://iflastandards.info/ns/isbdm/elements/P${basename}`,
    type,
    scopeNote: scopeNote || "",
    elementSubType: elementSubTypes,
    elementSuperType: elementSuperTypes,
    status: "Published",
    isDefinedBy: "http://iflastandards.info/ns/isbdm/elements/",
    equivalentProperty: [],
    inverseOf: []
  };
  
  // Include the ElementReference component without data props
  // This matches the format in the converted-1025.mdx file
  content.push(`## Element Reference\n`);
  content.push(`<ElementReference />\n`);
  
  // Process Additional Information section
  const addInfoH4 = Array.from(document.querySelectorAll('h4')).find(
    h4 => h4.textContent?.trim() === 'Additional information'
  );
  
  if (addInfoH4) {
    content.push(`## Additional information\n`);
    content.push(convertSectionToMdx(addInfoH4));
  }
  
  // Process Element Values section
  const elementValuesH4 = Array.from(document.querySelectorAll('h4')).find(
    h4 => h4.textContent?.trim() === 'Element values'
  );
  
  if (elementValuesH4) {
    content.push(`## Element values\n`);
    content.push(convertSectionToMdx(elementValuesH4));
  }
  
  // Process Stipulations section
  const stipulationsH4 = Array.from(document.querySelectorAll('h4')).find(
    h4 => h4.textContent?.trim() === 'Stipulations'
  );
  
  if (stipulationsH4) {
    content.push(`## Stipulations\n`);
    content.push(convertSectionToMdx(stipulationsH4));
  }
  
  // Process any subsections
  const subsections = Array.from(document.querySelectorAll('h5'));
  for (const subsection of subsections) {
    content.push(`### ${subsection.textContent?.trim()}\n`);
    content.push(convertSectionToMdx(subsection));
  }
  
  return content.join('');
}

/**
 * Convert a section's HTML content to MDX
 * @param {Element} sectionHeader - The section header element
 * @returns {string} MDX content for the section
 */
function convertSectionToMdx(sectionHeader) {
  const mdx = [];
  let currentElement = sectionHeader.nextElementSibling;
  
  while (currentElement && !['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(currentElement.tagName)) {
    if (currentElement.classList.contains('guid')) {
      const content = currentElement.textContent?.trim() || '';
      mdx.push(`<div className="guid">${content}</div>\n`);
    } 
    else if (currentElement.classList.contains('stip')) {
      mdx.push(`<div className="stip">\n`);
      
      // Check for mandatory indicator
      const mandatoryDiv = currentElement.querySelector('.mandatory');
      if (mandatoryDiv) {
        mdx.push(`  <Mandatory />\n  \n`);
      }
      
      // Process the content
      const children = Array.from(currentElement.childNodes);
      for (const child of children) {
        if (child.nodeType === 3) { // Text node
          if (child.textContent?.trim()) {
            mdx.push(`  ${child.textContent.trim()}\n  \n`);
          }
        } 
        else if (child.nodeType === 1) { // Element node
          const element = child;
          
          if (element.tagName === 'P') {
            mdx.push(`  ${convertHtmlStringToMdx(element.innerHTML)}\n  \n`);
          } 
          else if (element.tagName === 'OL') {
            const listItems = Array.from(element.querySelectorAll('li'));
            mdx.push(`  ${listItems.map((li, index) => `${index + 1}. ${li.textContent?.trim()}`).join('\n  ')}\n  \n`);
          } 
          else if (element.tagName === 'UL') {
            const listItems = Array.from(element.querySelectorAll('li'));
            mdx.push(`  ${listItems.map(li => `- ${li.textContent?.trim()}`).join('\n  ')}\n  \n`);
          } 
          else if (element.classList.contains('xampleBlockStip')) {
            // Convert examples to MDX details with proper formatting
            mdx.push(`  <details>\n    <summary>Examples</summary>\n    \n`);
            
            const xamples = element.querySelector('.xamples');
            if (xamples) {
              // Process each example div (containing rows)
              const exampleDivs = Array.from(xamples.children).filter(
                child => child.tagName === 'DIV' && !child.classList.contains('row')
              );
              
              if (exampleDivs.length > 0) {
                // Multiple examples in separate divs
                for (const exampleDiv of exampleDivs) {
                  mdx.push(`    | Property | Value |\n    |:---------|:------|\n`);
                  
                  // Process all rows in this example
                  const rows = Array.from(exampleDiv.querySelectorAll('.row'));
                  for (const row of rows) {
                    // Look for example label and value in this row
                    const labelElem = row.querySelector('.xampleLabel');
                    const valueElem = row.querySelector('.xampleValue');
                    
                    if (labelElem && valueElem) {
                      const label = sanitizeMultilineString(labelElem.textContent || '');
                      const value = sanitizeMultilineString(valueElem.textContent || '');
                      mdx.push(`    | ${label} | ${value} |\n`);
                    }
                  }
                  
                  // Check for comment
                  const commentElem = exampleDiv.querySelector('.editComment');
                  if (commentElem) {
                    let comment = sanitizeMultilineString(commentElem.textContent || '');
                    
                    // Convert links in comments to proper MDX format
                    // Format: [Full example: <a class="linkInline" href="/ISBDM/docs/fullex/fx065.html">Matisse Bonnard</a>]
                    comment = comment.replace(/Full example: <a class="linkInline" href="\/ISBDM\/docs\/fullex\/(fx\d+)\.html">(.*?)<\/a>/g, 
                      (_, fx, title) => {
                        return `Full example: [${title}](../fullex/${fx})`;
                      }
                    );
                    
                    // Add double-double brackets notation to match expected format
                    if (!comment.startsWith('[[[[')) {
                      comment = `[[[[${comment}]]]]`;
                    }
                    
                    mdx.push(`\n    *[${comment}]*\n`);
                  }
                  
                  // Add separator between examples
                  mdx.push(`\n    <hr />\n\n`);
                }
              } else {
                // Process flat structure (each row is an example)
                const allRows = Array.from(xamples.querySelectorAll('.row'));
                const exampleRows = allRows.filter(row => 
                  row.querySelector('.xampleLabel') && row.querySelector('.xampleValue')
                );
                
                if (exampleRows.length > 0) {
                  mdx.push(`    | Property | Value |\n    |:---------|:------|\n`);
                  
                  for (const row of exampleRows) {
                    const labelElem = row.querySelector('.xampleLabel');
                    const valueElem = row.querySelector('.xampleValue');
                    
                    if (labelElem && valueElem) {
                      const label = sanitizeMultilineString(labelElem.textContent || '');
                      const value = sanitizeMultilineString(valueElem.textContent || '');
                      mdx.push(`    | ${label} | ${value} |\n`);
                    }
                  }
                  
                  // Check for comment
                  const commentRows = allRows.filter(row => row.querySelector('.editComment'));
                  if (commentRows.length > 0) {
                    let comment = sanitizeMultilineString(commentRows[0].querySelector('.editComment').textContent || '');
                    
                    // Convert links in comments to proper MDX format
                    comment = comment.replace(/Full example: <a class="linkInline" href="\/ISBDM\/docs\/fullex\/(fx\d+)\.html">(.*?)<\/a>/g, 
                      (_, fx, title) => {
                        return `Full example: [${title}](../fullex/${fx})`;
                      }
                    );
                    
                    // Add double-double brackets notation to match expected format
                    if (!comment.startsWith('[[[[')) {
                      comment = `[[[[${comment}]]]]`;
                    }
                    
                    mdx.push(`\n    *[${comment}]*\n`);
                  }
                  
                  mdx.push(`\n    <hr />\n\n`);
                }
              }
            }
            
            mdx.push(`  </details>\n`);
          }
          
          // Skip the mandatory div as it's already processed
          if (element.classList.contains('mandatory')) {
            continue;
          }
        }
      }
      
      mdx.push(`</div>\n`);
    } 
    else if (currentElement.classList.contains('seeAlsoAdd')) {
      const link = currentElement.querySelector('.linkMenuElement');
      if (link) {
        const href = link.getAttribute('href');
        if (href) {
          const basename = path.basename(href, '.html');
          const section = href.split('/')[3]; // Extract the section from the path
          mdx.push(`<SeeAlso>[${sanitizeMultilineString(link.textContent || '')}](/docs/${section}/${basename})</SeeAlso>\n`);
        }
      }
    } 
    else {
      mdx.push(`${convertHtmlStringToMdx(currentElement.outerHTML)}\n`);
    }
    
    currentElement = currentElement.nextElementSibling;
    
    // Safety check to prevent infinite loop
    if (!currentElement) {
      break;
    }
  }
  
  return mdx.join('');
}

/**
 * Convert HTML string to MDX with proper component transformations
 * @param {string} html - HTML content to convert
 * @returns {string} Converted MDX content
 */
function convertHtmlStringToMdx(html) {
  let mdx = html;
  
  // Convert InLinks (internal documentation links) when used in the General stipulations reference
  if (html.includes('General stipulations for statement elements')) {
    // Use InLink for the general stipulations reference
    mdx = mdx.replace(/<a class="linkMenuElement" href="(\/ISBDM\/docs\/statements\/general)\.html">(.*?)<\/a>/g, 
      (_, fullPath, text) => {
        return `<InLink to="/docs/statements/general">${sanitizeMultilineString(text)}</InLink>`;
      }
    );
  } else {
    // Convert InLinks (internal documentation links)
    mdx = mdx.replace(/<a class="linkInline" href="(\/ISBDM\/docs\/([^\/]+)\/([^.]+))\.html">(.*?)<\/a>/g, 
      (_, fullPath, section, basename, text) => {
        return `<InLink to="/docs/${section}/${basename}">${sanitizeMultilineString(text)}</InLink>`;
      }
    );
    
    // Convert linkMenuElement links (used in section links)
    mdx = mdx.replace(/<a class="linkMenuElement" href="(\/ISBDM\/docs\/([^\/]+)\/([^.]+))\.html">(.*?)<\/a>/g, 
      (_, fullPath, section, basename, text) => {
        return `<InLink to="/docs/${section}/${basename}">${sanitizeMultilineString(text)}</InLink>`;
      }
    );
  }
  
  // Convert OutLinks (external links)
  mdx = mdx.replace(/<a class="linkOutline" href="([^"]+)" target="_blank".*?>(.*?)<\/a>/g,
    (_, url, text) => {
      return `<OutLink href="${url}">${sanitizeMultilineString(text)}</OutLink>`;
    }
  );
  
  // Convert formatting
  mdx = mdx.replace(/<(b|strong)>(.*?)<\/(b|strong)>/g, '**$2**');
  mdx = mdx.replace(/<(i|em)>(.*?)<\/(i|em)>/g, '*$2*');
  mdx = mdx.replace(/<span class="bolded">(.*?)<\/span>/g, '**$1**');
  mdx = mdx.replace(/<span class="bolder">(.*?)<\/span>/g, '**$1**');
  
  // Convert divs/spans with classes to appropriate MDX
  mdx = mdx.replace(/<div class="guid">(.*?)<\/div>/g, '<div className="guid">$1</div>');
  mdx = mdx.replace(/<div class="stip">(.*?)<\/div>/g, '<div className="stip">$1</div>');
  
  // Remove any remaining HTML tags but keep content
  mdx = mdx.replace(/<[^>]*>/g, '');
  
  return mdx;
}

/**
 * Complete unified conversion of HTML to MDX with all cleanup steps
 * @param {string} inputFile - Path to input HTML file
 * @param {string} outputFile - Path to output MDX file
 */
async function convertHtmlToMdxFinal(inputFile, outputFile) {
  try {
    console.log(`Converting ${inputFile} to ${outputFile}...`);
    
    // Read HTML file
    const html = fs.readFileSync(inputFile, 'utf8');
    
    // Extract information and convert to basic MDX
    const { frontmatter, content } = extractInformation(html, inputFile);
    
    // Generate MDX with frontmatter
    const yamlFrontmatter = yaml.dump(frontmatter, {
      indent: 2,
      lineWidth: -1,
      quotingType: '"'
    });
    
    const mdx = `---
${yamlFrontmatter}---

${content}`;
    
    // Write to output file
    fs.writeFileSync(outputFile, mdx);
    console.log(`Successfully converted ${inputFile} to ${outputFile}`);
    
    return outputFile;
  } catch (error) {
    console.error(`Error converting ${inputFile}:`, error);
    throw error;
  }
}

/**
 * Process an entire directory of HTML files
 * @param {string} inputDir - Path to input directory
 * @param {string} outputDir - Path to output directory
 * @param {Object} options - Processing options
 */
async function processDirectory(inputDir, outputDir, options = {}) {
  const defaultOptions = {
    pattern: '*.html',
    exclude: 'general.html|transcription.html|index.html',
    force: false,
    verbose: false
  };
  
  const opts = { ...defaultOptions, ...options };
  
  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Get all HTML files in the input directory
    const files = fs.readdirSync(inputDir)
      .filter(file => file.endsWith('.html'))
      .filter(file => !new RegExp(opts.exclude).test(file));
    
    // Process each file
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const file of files) {
      const inputFile = path.join(inputDir, file);
      const baseName = path.basename(file, '.html');
      const outputFile = path.join(outputDir, `${baseName}.mdx`);
      
      // Skip if output file exists and force is false
      if (fs.existsSync(outputFile) && !opts.force) {
        if (opts.verbose) {
          console.log(`Skipping ${inputFile} (output file already exists)`);
        }
        skipCount++;
        continue;
      }
      
      try {
        await convertHtmlToMdxFinal(inputFile, outputFile);
        successCount++;
      } catch (error) {
        console.error(`Error processing ${inputFile}:`, error);
        errorCount++;
      }
    }
    
    console.log(`Processed ${files.length} files: ${successCount} success, ${skipCount} skipped, ${errorCount} errors`);
  } catch (error) {
    console.error(`Error processing directory ${inputDir}:`, error);
    throw error;
  }
}

// Main script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node convert-html-element-to-mdx-final.mjs <inputFile> <outputFile>');
    console.error('   or: node convert-html-element-to-mdx-final.mjs --dir <inputDir> <outputDir> [options]');
    console.error('Options:');
    console.error('  --pattern  <glob>  File pattern to match (default: *.html)');
    console.error('  --exclude  <regex> Files to exclude (default: general.html|transcription.html|index.html)');
    console.error('  --force    Force overwrite existing files');
    console.error('  --verbose  Verbose output');
    process.exit(1);
  }
  
  if (args[0] === '--dir' && args.length >= 3) {
    const inputDir = args[1];
    const outputDir = args[2];
    
    // Parse options
    const options = {};
    for (let i = 3; i < args.length; i++) {
      if (args[i] === '--pattern' && i + 1 < args.length) {
        options.pattern = args[++i];
      } else if (args[i] === '--exclude' && i + 1 < args.length) {
        options.exclude = args[++i];
      } else if (args[i] === '--force') {
        options.force = true;
      } else if (args[i] === '--verbose') {
        options.verbose = true;
      }
    }
    
    processDirectory(inputDir, outputDir, options)
      .catch(err => console.error('Error processing directory:', err));
  } else if (args.length === 2) {
    const inputFile = args[0];
    const outputFile = args[1];
    convertHtmlToMdxFinal(inputFile, outputFile)
      .catch(err => console.error('Error converting file:', err));
  } else {
    console.error('Invalid arguments provided.');
    console.error('Usage: node convert-html-element-to-mdx-final.mjs <inputFile> <outputFile>');
    console.error('   or: node convert-html-element-to-mdx-final.mjs --dir <inputDir> <outputDir> [options]');
    process.exit(1);
  }
}

// Export functions for testing and reuse
export {
  convertHtmlToMdxFinal,
  processDirectory,
  extractInformation,
  convertSectionToMdx,
  convertHtmlStringToMdx,
  sanitizeMultilineString
};