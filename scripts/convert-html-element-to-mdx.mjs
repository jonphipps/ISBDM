#!/usr/bin/env node

/**
 * Script to convert HTML element files to MDX format with standardized frontmatter
 * based on DCTAP profile.
 */

import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';
import * as cheerio from 'cheerio';
import * as yaml from 'js-yaml';
import * as csv from 'csv-parser';

// Helper function to convert HTML string to MDX
function convertHtmlStringToMdx(html) {
  let mdx = html;
  
  // Convert links
  mdx = mdx.replace(/<a class="linkInline" href="(\/ISBDM\/docs\/[^\/]+\/([^.]+))\.html">(.*?)<\/a>/g, 
    (_, fullPath, basename, text) => {
      const section = fullPath.split('/')[3]; // Extract the section from the path
      return `<InLink to="/docs/${section}/${basename}">${text}</InLink>`;
    }
  );
  
  // Convert bold
  mdx = mdx.replace(/<span class="bolded">(.*?)<\/span>/g, '**$1**');
  mdx = mdx.replace(/<span class="bolder">(.*?)<\/span>/g, '**$1**');
  
  // Remove HTML tags but keep content
  mdx = mdx.replace(/<[^>]*>/g, '');
  
  return mdx;
}

// Helper function to convert section content to MDX
function convertSectionToMdx(sectionHeader) {
  const $ = cheerio.load(sectionHeader.outerHTML);
  let mdx = '';
  
  // Find all sibling divs until the next heading
  let currentElement = sectionHeader.nextElementSibling;
  
  while (currentElement && !['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(currentElement.tagName)) {
    if (currentElement.classList.contains('guid')) {
      const content = currentElement.textContent?.trim() || '';
      mdx += `<div className="guid">${content}</div>\n\n`;
    } 
    else if (currentElement.classList.contains('stip')) {
      mdx += `<div className="stip">\n`;
      
      // Check for mandatory indicator
      const mandatoryDiv = currentElement.querySelector('.mandatory');
      if (mandatoryDiv) {
        mdx += `  <Mandatory />\n  \n`;
      }
      
      // Process the content
      const children = Array.from(currentElement.childNodes);
      for (const child of children) {
        if (child.nodeType === 3) { // Text node
          if (child.textContent?.trim()) {
            mdx += `  ${child.textContent.trim()}\n  \n`;
          }
        } 
        else if (child.nodeType === 1) { // Element node
          const element = child;
          
          if (element.tagName === 'P') {
            mdx += `  ${convertHtmlStringToMdx(element.innerHTML)}\n  \n`;
          } 
          else if (element.tagName === 'OL') {
            const listItems = Array.from(element.querySelectorAll('li'));
            mdx += `  ${listItems.map((li, index) => `${index + 1}. ${li.textContent?.trim()}`).join('\n  ')}\n  \n`;
          } 
          else if (element.tagName === 'UL') {
            const listItems = Array.from(element.querySelectorAll('li'));
            mdx += `  ${listItems.map(li => `- ${li.textContent?.trim()}`).join('\n  ')}\n  \n`;
          } 
          else if (element.classList.contains('xampleBlockStip')) {
            // Convert examples to MDX details
            mdx += `  <details>\n    <summary>Examples</summary>\n    \n`;
            
            const xamples = element.querySelector('.xamples');
            if (xamples) {
              const examples = Array.from(xamples.querySelectorAll('.row')).filter(
                row => row.querySelector('.xampleLabel') && row.querySelector('.xampleValue')
              );
              
              if (examples.length > 0) {
                mdx += `    | Property | Value |\n    |:---------|:------|\n`;
                
                for (const example of examples) {
                  const label = example.querySelector('.xampleLabel')?.textContent?.trim() || '';
                  const value = example.querySelector('.xampleValue')?.textContent?.trim() || '';
                  mdx += `    | ${label} | ${value} |\n`;
                }
                
                // Check for comment
                const comment = xamples.querySelector('.editComment');
                if (comment) {
                  mdx += `\n    *[${comment.textContent?.trim()}]*\n`;
                }
              }
              
              // Check for horizontal rule
              const hr = xamples.querySelector('hr');
              if (hr) {
                mdx += `\n    <hr />\n`;
              }
            }
            
            mdx += `  </details>\n`;
          }
          
          // Skip the mandatory div as it's already processed
          if (element.classList.contains('mandatory')) {
            continue;
          }
        }
      }
      
      mdx += `</div>\n\n`;
    } 
    else if (currentElement.classList.contains('seeAlsoAdd')) {
      const link = currentElement.querySelector('.linkMenuElement');
      if (link) {
        const href = link.href;
        const basename = path.basename(href, '.html');
        const section = path.dirname(href).split('/').pop();
        mdx += `<SeeAlso>[${link.textContent?.trim()}](/docs/${section}/${basename})</SeeAlso>\n\n`;
      }
    } 
    else {
      mdx += `${convertHtmlStringToMdx(currentElement.outerHTML)}\n\n`;
    }
    
    currentElement = currentElement.nextElementSibling;
  }
  
  return mdx;
}

// Extract information from HTML
function extractInformation(html) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  // Extract element label (h3)
  const h3 = document.querySelector('h3');
  const label = h3?.textContent?.trim() || '';
  
  // Extract definition
  const definition = document.querySelector('.eltext')?.textContent?.trim() || '';
  
  // Extract domain and range
  const domains = Array.from(document.querySelectorAll('.row')).filter(
    row => row.querySelector('.elref')?.textContent?.trim() === 'Domain'
  );
  const domain = domains[0]?.querySelector('.eltext')?.textContent?.trim() || 'Manifestation';
  
  const ranges = Array.from(document.querySelectorAll('.row')).filter(
    row => row.querySelector('.elref')?.textContent?.trim() === 'Range'
  );
  const range = ranges[0]?.querySelector('.eltext')?.textContent?.trim() || 'Literal';
  
  // Extract scope note
  const scopeNotes = Array.from(document.querySelectorAll('.row')).filter(
    row => row.querySelector('.elref')?.textContent?.trim() === 'Scope note'
  );
  const scopeNote = scopeNotes[0]?.querySelector('.eltext')?.textContent?.trim() || '';
  
  // Extract elementSubType
  const elementSubTypes = Array.from(document.querySelectorAll('.row')).filter(
    row => row.querySelector('.elref')?.textContent?.trim() === 'Element sub-type'
  );
  
  const subTypeLinks = elementSubTypes[0]?.querySelectorAll('.linkMenuElement') || [];
  const subTypes = Array.from(subTypeLinks).map(link => {
    const href = link.href;
    const basename = path.basename(href, '.html');
    return {
      uri: `http://iflastandards.info/ns/isbd/isbdm/elements/${basename}`,
      url: `/docs/statements/${basename}`,
      label: link.textContent?.trim() || ''
    };
  });
  
  // Extract elementSuperType
  const elementSuperTypes = Array.from(document.querySelectorAll('.row')).filter(
    row => row.querySelector('.elref')?.textContent?.trim() === 'Element super-type'
  );
  
  const superTypeLinks = elementSuperTypes[0]?.querySelectorAll('.linkMenuElement') || [];
  const superTypes = Array.from(superTypeLinks).map(link => {
    const href = link.href;
    const basename = path.basename(href, '.html');
    return {
      uri: `http://iflastandards.info/ns/isbd/isbdm/elements/${basename}`,
      url: `/docs/statements/${basename}`,
      label: link.textContent?.trim() || ''
    };
  });
  
  // Extract URI from filename
  const basename = path.basename(h3?.textContent || '', '.html');
  const uri = `http://iflastandards.info/ns/isbd/isbdm/elements/${basename}`;
  
  // Determine type based on range
  const type = range === 'Literal' ? 'DatatypeProperty' : 'ObjectProperty';
  
  // Create frontmatter
  const frontmatter = {
    RDF: {
      label,
      definition,
      domain,
      range,
      uri,
      type
    },
    id: basename,
    title: label,
    sidebar_label: label
  };
  
  if (scopeNote) {
    frontmatter.RDF.scopeNote = scopeNote;
  }
  
  if (subTypes.length > 0) {
    frontmatter.RDF.elementSubType = subTypes;
  }
  
  if (superTypes.length > 0) {
    frontmatter.RDF.elementSuperType = superTypes;
  }
  
  // Convert content sections to MDX
  const h4Elements = document.querySelectorAll('h4');
  
  // Find sections by text content
  let additionalInfoSection = null;
  let elementValuesSection = null;
  let stipulationsSection = null;
  
  for (const h4 of h4Elements) {
    const text = h4.textContent?.trim() || '';
    if (text === 'Additional information') {
      additionalInfoSection = h4;
    } else if (text === 'Element values') {
      elementValuesSection = h4;
    } else if (text === 'Stipulations') {
      stipulationsSection = h4;
    }
  }
  
  const content = [];
  
  content.push(`# ${label}\n`);
  content.push(`## Element Reference\n`);
  content.push(`<ElementReference />\n`);
  
  if (additionalInfoSection) {
    content.push(`## Additional information\n`);
    const addInfoContent = convertSectionToMdx(additionalInfoSection);
    content.push(addInfoContent);
  }
  
  if (elementValuesSection) {
    content.push(`## Element values\n`);
    const elementValuesContent = convertSectionToMdx(elementValuesSection);
    content.push(elementValuesContent);
  }
  
  if (stipulationsSection) {
    content.push(`## Stipulations\n`);
    const stipulationsContent = convertSectionToMdx(stipulationsSection);
    content.push(stipulationsContent);
  }
  
  return { frontmatter, content };
}

// Main function to convert HTML file to MDX
async function convertHtmlToMdx(inputFile, outputFile) {
  try {
    const html = fs.readFileSync(inputFile, 'utf8');
    const { frontmatter, content } = extractInformation(html);
    
    // Generate MDX with frontmatter
    const yamlFrontmatter = yaml.dump(frontmatter);
    const mdx = `---
${yamlFrontmatter}---

${content.join('')}`;
    
    fs.writeFileSync(outputFile, mdx);
    console.log(`Successfully converted ${inputFile} to ${outputFile}`);
  } catch (error) {
    console.error(`Error converting ${inputFile}:`, error);
  }
}

// Function to process a directory of HTML files
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
    console.error('Usage: node convert-html-element-to-mdx.js <inputFile> <outputFile>');
    console.error('   or: node convert-html-element-to-mdx.js --dir <inputDir> <outputDir>');
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
    console.error('Usage: node convert-html-element-to-mdx.js <inputFile> <outputFile>');
    console.error('   or: node convert-html-element-to-mdx.js --dir <inputDir> <outputDir>');
    process.exit(1);
  }
}

// Export functions for testing
export {
  convertHtmlToMdx,
  processDirectory
};