#!/usr/bin/env node

/**
 * Enhanced script to convert HTML element files to MDX format with proper frontmatter
 * and consistent formatting based on project standards.
 */

import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';
import * as cheerio from 'cheerio';
import * as yaml from 'js-yaml';

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
  const definition = $('.eltext').first().text().trim() || '';
  
  // Extract scope note
  const scopeNoteRows = Array.from($('.row')).filter(row => 
    $(row).find('.elref').text().trim() === 'Scope note'
  );
  const scopeNote = scopeNoteRows.length > 0 
    ? $(scopeNoteRows[0]).find('.eltext').text().trim() 
    : '';
  
  // Extract domain and range
  const domainRows = Array.from($('.row')).filter(row => 
    $(row).find('.elref').text().trim() === 'Domain'
  );
  const domain = domainRows.length > 0 
    ? $(domainRows[0]).find('.eltext').text().trim() 
    : 'Manifestation';
  
  const rangeRows = Array.from($('.row')).filter(row => 
    $(row).find('.elref').text().trim() === 'Range'
  );
  const range = rangeRows.length > 0 
    ? $(rangeRows[0]).find('.eltext').text().trim() 
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
      
      elementSubTypes.push({
        uri: `http://iflastandards.info/ns/isbd/isbdm/elements/${linkBasename}`,
        url: `/docs/statements/${linkBasename}`,
        label: $(link).text().trim()
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
      
      elementSuperTypes.push({
        uri: `http://iflastandards.info/ns/isbd/isbdm/elements/${linkBasename}`,
        url: `/docs/statements/${linkBasename}`,
        label: $(link).text().trim()
      });
    });
  }
  
  // Determine property type
  const type = range === 'Literal' ? 'DatatypeProperty' : 'ObjectProperty';
  
  // Generate a slug-friendly ID
  const slugId = isNumeric ? basename : basename.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  
  // Create frontmatter according to project standards
  const frontmatter = {
    RDF: {
      label,
      definition,
      domain,
      range,
      uri: `http://iflastandards.info/ns/isbd/isbdm/elements/${basename}`,
      type
    },
    id: slugId,  // Use the numeric ID or kebab-case version of the label
    slug: `/statements/${slugId}`, // Add explicit slug for Docusaurus
    title: label,
    sidebar_label: label
  };
  
  // Add optional properties only if they exist
  if (scopeNote) {
    frontmatter.RDF.scopeNote = scopeNote;
  }
  
  if (elementSubTypes.length > 0) {
    frontmatter.RDF.elementSubType = elementSubTypes;
  }
  
  if (elementSuperTypes.length > 0) {
    frontmatter.RDF.elementSuperType = elementSuperTypes;
  }
  
  // Build MDX content
  const content = convertContentToMdx(document, label);
  
  return { frontmatter, content };
}

/**
 * Convert HTML content to MDX format
 * @param {Document} document - The DOM document
 * @param {string} label - The element label
 * @returns {string} MDX content
 */
function convertContentToMdx(document, label) {
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
  
  // Debug logging to track elements processing
  console.log(`Processing section: ${sectionHeader.textContent?.trim()}`);
  
  while (currentElement && !['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(currentElement.tagName)) {
    // Debug logging
    console.log(`Processing element: ${currentElement.tagName}, class: ${currentElement.className}`);
    
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
            // Convert examples to MDX details
            mdx.push(`  <details>\n  <summary>Examples</summary>\n\n`);
            
            const xamples = element.querySelector('.xamples');
            if (xamples) {
              // Process each example div (containing rows)
              const exampleDivs = Array.from(xamples.children).filter(
                child => child.tagName === 'DIV'
              );
              
              if (exampleDivs.length > 0) {
                for (const exampleDiv of exampleDivs) {
                  mdx.push(`    | Property | Value |\n    |:---------|:------|\n`);
                  
                  // Process all rows in this example
                  const rows = Array.from(exampleDiv.querySelectorAll('.row'));
                  for (const row of rows) {
                    // Look for example label and value in this row
                    const labelElem = row.querySelector('.xampleLabel');
                    const valueElem = row.querySelector('.xampleValue');
                    
                    if (labelElem && valueElem) {
                      const label = labelElem.textContent?.trim() || '';
                      const value = valueElem.textContent?.trim() || '';
                      mdx.push(`    | ${label} | ${value} |\n`);
                    }
                  }
                  
                  // Check for comment
                  const commentElem = exampleDiv.querySelector('.editComment');
                  if (commentElem) {
                    const comment = commentElem.textContent?.trim() || '';
                    mdx.push(`\n    *[${comment}]*\n`);
                  }
                  
                  // Add separator between examples
                  mdx.push(`\n    <hr />\n\n`);
                }
              } else {
                // Old logic as fallback
                const exampleRows = Array.from(xamples.querySelectorAll('.row')).filter(
                  row => row.querySelector('.xampleLabel') && row.querySelector('.xampleValue')
                );
                
                if (exampleRows.length > 0) {
                  mdx.push(`    | Property | Value |\n    |:---------|:------|\n`);
                  
                  for (const row of exampleRows) {
                    const label = row.querySelector('.xampleLabel')?.textContent?.trim() || '';
                    const value = row.querySelector('.xampleValue')?.textContent?.trim() || '';
                    mdx.push(`    | ${label} | ${value} |\n`);
                  }
                  
                  // Check for comment
                  const comment = xamples.querySelector('.editComment');
                  if (comment) {
                    mdx.push(`\n    *[${comment.textContent?.trim()}]*\n`);
                  }
                  
                  // Check for horizontal rule
                  const hr = xamples.querySelector('hr');
                  if (hr) {
                    mdx.push(`\n    <hr />\n`);
                  }
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
          mdx.push(`<SeeAlso>[${link.textContent?.trim()}](/docs/${section}/${basename})</SeeAlso>\n`);
        }
      }
    } 
    else {
      mdx.push(`${convertHtmlStringToMdx(currentElement.outerHTML)}\n`);
    }
    
    currentElement = currentElement.nextElementSibling;
    
    // Safety check to prevent infinite loop
    if (!currentElement) {
      console.log('Reached end of elements');
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
  
  // Convert InLinks (internal documentation links)
  mdx = mdx.replace(/<a class="linkInline" href="(\/ISBDM\/docs\/([^\/]+)\/([^.]+))\.html">(.*?)<\/a>/g, 
    (_, fullPath, section, basename, text) => {
      return `<InLink to="/docs/${section}/${basename}">${text}</InLink>`;
    }
  );
  
  // Convert OutLinks (external links)
  mdx = mdx.replace(/<a class="linkOutline" href="([^"]+)" target="_blank".*?>(.*?)<\/a>/g,
    (_, url, text) => {
      return `<OutLink href="${url}">${text}</OutLink>`;
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
 * Convert an HTML file to MDX format
 * @param {string} inputFile - Path to the input HTML file
 * @param {string} outputFile - Path to the output MDX file
 */
async function convertHtmlToMdx(inputFile, outputFile) {
  try {
    const html = fs.readFileSync(inputFile, 'utf8');
    const { frontmatter, content } = extractInformation(html, inputFile);
    
    // Check if content appears truncated (basic check)
    const htmlLines = html.split('\n').length;
    const contentLines = content.split('\n').length;
    if (contentLines < htmlLines / 10) {
      console.warn(`Warning: Content appears truncated for ${inputFile}. HTML has ${htmlLines} lines, content has ${contentLines} lines.`);
    }
    
    // Generate MDX with frontmatter
    const yamlFrontmatter = yaml.dump(frontmatter, {
      indent: 2,
      lineWidth: -1,
      quotingType: '"'
    });
    
    const mdx = `---
${yamlFrontmatter}---

${content}`;
    
    fs.writeFileSync(outputFile, mdx);
    console.log(`Successfully converted ${inputFile} to ${outputFile}`);
  } catch (error) {
    console.error(`Error converting ${inputFile}:`, error);
  }
}

/**
 * Process an entire directory of HTML files
 * @param {string} inputDir - Path to the input directory containing HTML files
 * @param {string} outputDir - Path to the output directory for MDX files
 */
async function processDirectory(inputDir, outputDir) {
  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const files = fs.readdirSync(inputDir)
      .filter(file => file.endsWith('.html') && !file.includes('general') && !file.includes('transcription'));
    
    for (const file of files) {
      const inputFile = path.join(inputDir, file);
      const baseName = path.basename(file, '.html');
      const outputFile = path.join(outputDir, `${baseName}.mdx`);
      
      await convertHtmlToMdx(inputFile, outputFile);
    }
    
    console.log(`Processed ${files.length} files from ${inputDir} to ${outputDir}`);
  } catch (error) {
    console.error(`Error processing directory ${inputDir}:`, error);
  }
}

// Main script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node convert-html-element-to-mdx-improved.mjs <inputFile> <outputFile>');
    console.error('   or: node convert-html-element-to-mdx-improved.mjs --dir <inputDir> <outputDir>');
    process.exit(1);
  }
  
  if (args[0] === '--dir' && args.length === 3) {
    const inputDir = args[1];
    const outputDir = args[2];
    processDirectory(inputDir, outputDir)
      .catch(err => console.error('Error processing directory:', err));
  } else if (args.length === 2) {
    const inputFile = args[0];
    const outputFile = args[1];
    convertHtmlToMdx(inputFile, outputFile)
      .catch(err => console.error('Error converting file:', err));
  } else {
    console.error('Invalid arguments provided.');
    console.error('Usage: node convert-html-element-to-mdx-improved.mjs <inputFile> <outputFile>');
    console.error('   or: node convert-html-element-to-mdx-improved.mjs --dir <inputDir> <outputDir>');
    process.exit(1);
  }
}

// Export functions for testing
export {
  convertHtmlToMdx,
  processDirectory,
  extractInformation,
  convertSectionToMdx,
  convertHtmlStringToMdx
};