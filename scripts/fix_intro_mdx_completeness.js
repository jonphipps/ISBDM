#!/usr/bin/env node

/**
 * This script properly converts HTML files in the intro directory to MDX,
 * ensuring that all content is preserved.
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const SOURCE_DIR = path.join(__dirname, '..', 'ISBDM', 'docs', 'intro');
const TARGET_DIR = path.join(__dirname, '..', 'docs', 'intro');

const files = fs.readdirSync(SOURCE_DIR)
  .filter(file => file.endsWith('.html'))
  .filter(file => file !== 'index.html'); // Exclude index.html as it may have a different structure

for (const htmlFile of files) {
  const baseName = htmlFile.replace('.html', '');
  const mdxFile = `${baseName}.mdx`;
  
  const htmlPath = path.join(SOURCE_DIR, htmlFile);
  const mdxPath = path.join(TARGET_DIR, mdxFile);
  
  // Skip files that are already fixed
  if (baseName === 'i003' || baseName === 'i008' || baseName === 'i026') {
    console.log(`Skipping ${baseName} - already fixed`);
    continue;
  }
  
  console.log(`Processing ${baseName}...`);
  
  try {
    // Read the HTML file and extract content
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const $ = cheerio.load(htmlContent);
    
    // Get title
    const title = $('h3').first().text().trim();
    
    // Get the main content area
    const contentContainer = $('.col-md-7.border.rounded .row.m-1');
    
    // Get all child elements after h3
    const contentElements = contentContainer.children().not('h3');
    
    // Create the MDX content
    let mdxContent = `---
id: ${baseName}
title: "${title}"
slug: "/intro/${baseName}"
---
import SeeAlso from '@site/src/components/global/SeeAlso';
import OutLink from '@site/src/components/global/OutLink';
import InLink from '@site/src/components/global/InLink';

## ${title}
`;
    
    // Process each content element
    contentElements.each((i, el) => {
      const element = $(el);
      
      if (element.hasClass('guid')) {
        mdxContent += '<div className="guid">\n';
        
        // Process paragraphs and other elements inside guid
        element.children().each((j, child) => {
          const childEl = $(child);
          let content = '';
          
          if (childEl.is('p')) {
            content = '  <p>' + processInlineElements(childEl.html()) + '</p>\n';
          } else if (childEl.is('ul.bull')) {
            content = '  <ul className="bull">\n';
            childEl.find('li').each((k, li) => {
              content += '    <li>' + processInlineElements($(li).html()) + '</li>\n';
            });
            content += '  </ul>\n';
          } else if (childEl.is('ol.num')) {
            content = '  <ol className="num">\n';
            childEl.find('li').each((k, li) => {
              content += '    <li>' + processInlineElements($(li).html()) + '</li>\n';
            });
            content += '  </ol>\n';
          } else if (childEl.hasClass('xampleBlockGuid')) {
            content = processExampleBlock(childEl);
          }
          
          mdxContent += content;
        });
        
        mdxContent += '</div>\n\n';
      } else if (element.is('h4')) {
        mdxContent += `### ${element.text().trim()}\n\n`;
      }
    });
    
    // Write the MDX file
    fs.writeFileSync(mdxPath, mdxContent);
    console.log(`Successfully converted ${baseName}`);
  } catch (error) {
    console.error(`Error processing ${baseName}:`, error);
  }
}

// Helper function to process inline elements
function processInlineElements(html) {
  if (!html) return '';
  
  let processed = html
    // Convert HTML links to InLink or OutLink components
    .replace(/<a class="linkInline" href="\/ISBDM\/docs\/([^\/]+)\/([^\.]+).html">(.*?)<\/a>/g, '<InLink to="/$1/$2">$3</InLink>')
    .replace(/<a class="linkInline" href="([^"]+)">(.*?)<\/a>/g, (match, url, text) => {
      if (url.startsWith('http')) {
        return `<OutLink href="${url}">${text}</OutLink>`;
      } else {
        return `<InLink to="${url}">${text}</InLink>`;
      }
    })
    // Convert emphasis
    .replace(/<span class="thisem">(.*?)<\/span>/g, '<em>$1</em>')
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&quot;/g, '"');
    
  return processed;
}

// Process example blocks
function processExampleBlock(element) {
  let content = '  <div className="xampleBlockGuid">\n';
  
  // Process example block content
  content += '    <p>Examples</p>\n';
  content += '    <div className="xamples">\n';
  
  // Process example rows
  element.find('.xamples > div').each((i, exampleDiv) => {
    const example = $(exampleDiv);
    
    content += '      <div>\n';
    
    // Process rows in the example
    example.find('.row.px-2').each((j, rowDiv) => {
      const row = $(rowDiv);
      const label = row.find('.xampleLabel').text().trim();
      const value = row.find('.xampleValue').text().trim();
      
      if (label && value) {
        content += `        <div className="row px-2">\n`;
        content += `          <div className="col-6 xampleLabel">${label}</div>\n`;
        content += `          <div className="col-6 xampleValue">${value}</div>\n`;
        content += `        </div>\n`;
      }
      
      // Check for edit comment
      const editComment = row.find('.editComment');
      if (editComment.length > 0) {
        content += `        <div className="row px-2">\n`;
        content += `          <div className="col editComment">${processInlineElements(editComment.html())}</div>\n`;
        content += `        </div>\n`;
      }
    });
    
    content += '      </div>\n';
  });
  
  content += '    </div>\n';
  content += '  </div>\n';
  
  // Process See Also links
  const seeAlso = element.next().find('a.linkInline');
  if (seeAlso.length > 0) {
    content += '\n  <SeeAlso>\n';
    seeAlso.each((i, link) => {
      const href = $(link).attr('href');
      const text = $(link).text().trim();
      
      const linkPath = href.replace('/ISBDM/docs/', '').replace('.html', '');
      content += `    <InLink to="/${linkPath}">${text}</InLink>\n`;
    });
    content += '  </SeeAlso>\n';
  }
  
  return content;
}

console.log('Conversion complete!');