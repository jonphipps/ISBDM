#!/usr/bin/env node

/**
 * Script to convert ISBDM SES HTML files to MDX
 * 
 * This script converts String Encoding Scheme (SES) HTML files from the ISBDM docs/ves directory
 * to MDX format for the docs/ses directory.
 * 
 * Usage:
 *   node convert-ses-html-to-mdx.js <source-html-file> <target-mdx-file>
 * 
 * Example:
 *   node convert-ses-html-to-mdx.js /Users/jonphipps/Code/ISBDM/ISBDM/docs/ves/ISBDMSESCol.html /Users/jonphipps/Code/ISBDM/docs/ses/ISBDMSESCol.mdx
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Check for arguments
if (process.argv.length < 4) {
  console.error('Usage: node convert-ses-html-to-mdx.js <source-html-file> <target-mdx-file>');
  process.exit(1);
}

const sourceFile = process.argv[2];
const targetFile = process.argv[3];

// Ensure target directory exists
const targetDir = path.dirname(targetFile);
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`Created directory: ${targetDir}`);
}

// Read source HTML file
let htmlContent;
try {
  htmlContent = fs.readFileSync(sourceFile, 'utf8');
} catch (error) {
  console.error(`Error reading source file: ${error.message}`);
  process.exit(1);
}

// Parse HTML with Cheerio
const $ = cheerio.load(htmlContent);

// Extract the title
const title = $('h3').first().text().trim();
// Create a slug from the filename (without extension)
const filename = path.basename(sourceFile, '.html');

// Special case for the main SES file
let id, slug;
if (filename === 'ISBDMSES') {
  id = 'overview';
  slug = '/ses/overview';
} else {
  id = filename.replace('ISBDMSES', '').toLowerCase();
  slug = `/ses/${id}`;
}

// Create front matter
const frontMatter = `---
id: ${id}
title: "${title}"
slug: "${slug}"
---
## ${title}
`;

// Process the main content
let mdxContent = [];

// Process each .guid div within the main content area
$('.col-md-7 .guid').each(function() {
  const guidContent = processGuidDiv($(this));
  mdxContent.push(guidContent);
});

// Check if we have content
if (mdxContent.length === 0) {
  console.warn(`Warning: No .guid content found in ${sourceFile}`);
  
  // Attempt to extract content from the main column
  const mainContent = $('.col-md-7 .row.m-1').html();
  if (mainContent) {
    console.log(`Trying to extract content from main column in ${sourceFile}`);
    const $ = cheerio.load(mainContent);
    
    // Skip the title (h3)
    $('h3').remove();
    
    // Process remaining content
    $('.guid').each(function() {
      const guidContent = processGuidDiv($(this));
      mdxContent.push(guidContent);
    });
  }
}

// Combine content
const fullMdxContent = frontMatter + mdxContent.join('\n\n');

// Write to target file
try {
  fs.writeFileSync(targetFile, fullMdxContent);
  console.log(`Successfully converted ${sourceFile} to ${targetFile}`);
  
  // Verify content was written
  const stats = fs.statSync(targetFile);
  const fileSizeInBytes = stats.size;
  if (fileSizeInBytes < 100) {
    console.warn(`Warning: Output file ${targetFile} is very small (${fileSizeInBytes} bytes), may be missing content`);
  }
} catch (error) {
  console.error(`Error writing target file: ${error.message}`);
  process.exit(1);
}

/**
 * Process a .guid div and convert its content to MDX
 * @param {cheerio.Cheerio} guidDiv - The .guid div element
 * @returns {string} - The processed MDX content
 */
function processGuidDiv(guidDiv) {
  let result = '<div className="guid">\n\n';
  
  // First remove the linkEx elements that should not be carried over to MDX
  guidDiv.find('a.linkEx').each(function() {
    $(this).remove();
  });
  
  // Process paragraphs
  guidDiv.find('p').each(function() {
    let text = $(this).html()
      // Convert HTML entities
      .replace(/&quot;/g, '"')
      .replace(/&hellip;/g, '...')
      .replace(/&amp;/g, '&')
      
      // Process internal links
      .replace(/<a class="linkInline" href="([^"]+)"[^>]*>([^<]+)<\/a>/g, 
        (match, href, text) => {
          // Convert /ISBDM/docs/ links to relative links
          const newHref = href.replace('/ISBDM/docs/', '/');
          return `<InLink href="${newHref}">${text}</InLink>`;
        })
      
      // Use backticks for text containing curly braces
      .replace(/\{([^}]+)\}/g, (match) => {
        return '`' + match + '`';
      })
      
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim();
    
    // Skip empty paragraphs
    if (text.length > 0) {
      result += `${text}\n\n`;
    }
  });
  
  // Process lists
  guidDiv.find('ul.bull').each(function() {
    $(this).find('li').each(function() {
      let itemText = $(this).text().trim()
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        // Use backticks for text containing curly braces
        .replace(/\{([^}]+)\}/g, (match) => {
          return '`' + match + '`';
        });
      
      result += `- ${itemText}\n`;
    });
    result += '\n';
  });
  
  // Process examples
  const exampleBlock = guidDiv.find('.xampleBlockGuid');
  if (exampleBlock.length) {
    result += '<details>\n  <summary>Examples</summary>\n\n';
    
    const examples = exampleBlock.find('.collapse.xamples');
    examples.find('> div').each(function(index) {
      if (index > 0) {
        result += '  ---\n\n';
      }
      
      // Create a table for the example data
      const rows = $(this).find('.row.px-2');
      if (rows.length > 0) {
        // Create table header if there are example rows
        result += '  | Relation | Example |\n';
        result += '  |----------|----------|\n';
        
        // Process example rows
        rows.each(function() {
          const label = $(this).find('.xampleLabel').text().trim();
          const value = $(this).find('.xampleValue').text().trim();
          
          if (label && value) {
            result += `  | ${label} | ${value} |\n`;
          }
        });
        result += '\n';
      }
      
      // Process example comments
      const commentElem = $(this).find('.editComment');
      if (commentElem.length) {
        let commentText = '';
        
        // Look for "Full example:" pattern
        const fullExampleLink = commentElem.find('a.linkInline');
        if (fullExampleLink.length && commentElem.text().includes('Full example:')) {
          const linkHref = fullExampleLink.attr('href').replace('/ISBDM/docs/', '/');
          const linkText = fullExampleLink.text().trim();
          
          // Extract the comment text that follows the link
          const commentHtml = commentElem.html();
          const afterLink = commentHtml.split('</a>')[1] || '';
          const remainingComment = afterLink
            .replace(/\.\]/, '') // Remove closing bracket
            .replace(/^\s*\./, '') // Remove leading period
            .trim();
          
          commentText = `  *Full example*: [${linkText}](${linkHref})`;
          if (remainingComment) {
            commentText += `. ${remainingComment}`;
          }
        } else {
          // For general comments without the "Full example" pattern
          commentText = `  *Note*: ${commentElem.text().trim()}`;
        }
        
        result += `${commentText}\n\n`;
      }
      
      // Process narrative examples
      const narrative = $(this).find('.xampleNarrative').text().trim();
      if (narrative) {
        result += `  ${narrative}\n\n`;
      }
    });
    
    result += '</details>\n';
  }
  
  result += '</div>';
  return result;
}