const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

/**
 * Converts a general HTML information page to MDX format
 * Handles informational content, guidance, and examples
 * @param {string} htmlFilePath - Path to the source HTML file
 * @param {string} outputPath - Path to write the MDX output
 */
function convertGeneralHtmlToMdx(htmlFilePath, outputPath) {
  try {
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // Extract basic metadata
    const h3Element = document.querySelector('h3');
    const title = h3Element ? h3Element.textContent.trim() : path.basename(htmlFilePath, '.html');

    // Extract ID from filename
    const fileBasename = path.basename(htmlFilePath, '.html');
    
    // Create basic frontmatter
    const frontmatter = {
      id: fileBasename,
      title: title,
      sidebar_position: 1
    };

    // Start building content
    let content = [];
    content.push(`# ${title}\n\n`);

    // Process the main content area to maintain proper structure
    const mainContentArea = document.querySelector('.col-md-7 .row') || document.querySelector('.col-md-7') || document.querySelector('main') || document.body;
    
    // Get all child elements in order (excluding the h3 title which we already have)
    const childElements = Array.from(mainContentArea.children).filter(el => el.tagName !== 'H3');
    
    childElements.forEach(element => {
      if (element.classList.contains('guid')) {
        // Process all content within the guid div, maintaining structure
        processGuidContent(element, content);

        // Check if this guid div contains example blocks
        const exampleBlocks = element.querySelectorAll('.xampleBlockGuid');
        exampleBlocks.forEach(exampleBlock => {
          // Process example block immediately after its related guidance
          content.push('<details>\n<summary>Examples</summary>\n\n');
          
          // Process examples within the block
          const exampleDivs = exampleBlock.querySelectorAll('.xamples .row');
          let exampleCount = 0;
          
          if (exampleDivs.length === 0) {
            // Fallback to direct children if no rows found
            const exampleItems = exampleBlock.querySelectorAll('.xamples > div');
            exampleItems.forEach(div => {
              const hasNarrative = div.querySelector('.xampleNarrative');
              if (hasNarrative) {
                if (exampleCount > 0) {
                  content.push('---\n\n');
                }
                exampleCount++;
              }
              processExampleDiv(div, content);
            });
          } else {
            exampleDivs.forEach(div => {
              const hasNarrative = div.querySelector('.xampleNarrative');
              if (hasNarrative) {
                if (exampleCount > 0) {
                  content.push('---\n\n');
                }
                exampleCount++;
              }
              processExampleDiv(div, content);
            });
          }
          
          content.push('</details>\n\n');
        });
      }
    });

    // Helper function to process guid content maintaining structure
    function processGuidContent(guidElement, content) {
      let guidContent = '';
      
      // Process all child elements within the guid
      Array.from(guidElement.children).forEach(child => {
        // Skip example blocks - they're handled separately
        if (child.classList.contains('xampleBlockGuid')) return;
        
        if (child.tagName === 'P') {
          guidContent += processTextContent(child) + '\n\n';
        } else if (child.tagName === 'OL') {
          guidContent += '\n' + processOrderedList(child) + '\n';
        } else if (child.tagName === 'UL') {
          guidContent += '\n' + processUnorderedList(child) + '\n';
        } else {
          // Handle other elements as text content
          guidContent += processTextContent(child) + '\n\n';
        }
      });
      
      if (guidContent.trim()) {
        content.push(`<div className="guid">\n${guidContent.trim()}\n</div>\n\n`);
      }
    }

    // Helper function to process text content with links and emphasis
    function processTextContent(element) {
      let text = element.textContent.trim();
      // Remove extra whitespace and normalize line breaks
      text = text.replace(/\s+/g, ' ').trim();
      
      // Handle emphasis (typically <span class="thisem">)
      const emphSpans = element.querySelectorAll('.thisem');
      emphSpans.forEach(span => {
        const emphText = span.textContent.trim();
        text = text.replace(emphText, `**${emphText}**`);
      });

      // Handle links
      const links = element.querySelectorAll('a.linkInline');
      links.forEach(link => {
        const href = link.getAttribute('href');
        const linkText = link.textContent.trim();
        // Convert to MDX InLink format
        if (href && href.startsWith('/ISBDM/docs/')) {
          const path = href.replace('/ISBDM/docs/', '').replace('.html', '');
          text = text.replace(linkText, `<InLink href="/docs/${path}">${linkText}</InLink>`);
        }
      });

      return text;
    }

    // Helper function to process ordered lists
    function processOrderedList(olElement) {
      let listContent = '';
      const items = olElement.querySelectorAll(':scope > li');
      
      items.forEach((li, index) => {
        const itemNumber = index + 1;
        let itemText = '';
        
        // Process text and links in the list item
        Array.from(li.childNodes).forEach(node => {
          if (node.nodeType === 3) { // Text node
            itemText += node.textContent.trim();
          } else if (node.tagName === 'A' && node.classList.contains('linkInline')) {
            const href = node.getAttribute('href');
            const linkText = node.textContent.trim();
            if (href && href.startsWith('/ISBDM/docs/')) {
              const path = href.replace('/ISBDM/docs/', '').replace('.html', '');
              itemText += `<InLink href="/docs/${path}">${linkText}</InLink>`;
            } else {
              itemText += linkText;
            }
          } else if (node.tagName === 'OL') {
            // Handle nested ordered list - add it as a proper nested markdown list
            const nestedList = processNestedOrderedList(node, '   ').trimEnd();
            itemText += ':\n' + nestedList;
          } else if (node.nodeType === 1) { // Element node
            itemText += node.textContent.trim();
          }
        });
        
        // Clean up whitespace
        itemText = itemText.replace(/\s+/g, ' ').trim();
        
        if (itemText) {
          listContent += `${itemNumber}. ${itemText}\n`;
        }
      });
      
      return listContent;
    }

    // Helper function to process nested ordered lists
    function processNestedOrderedList(olElement, indent) {
      let listContent = '';
      const items = olElement.querySelectorAll(':scope > li');
      
      items.forEach((li, index) => {
        let itemText = '';
        // Handle large lists properly - use numbers instead of letters after 26 items
        let marker;
        if (index < 26) {
          marker = String.fromCharCode(97 + index); // a, b, c, etc.
        } else {
          marker = (index + 1).toString(); // 27, 28, 29, etc.
        }
        
        // Process text and links in the nested list item
        Array.from(li.childNodes).forEach(node => {
          if (node.nodeType === 3) { // Text node
            itemText += node.textContent.trim();
          } else if (node.tagName === 'A' && node.classList.contains('linkInline')) {
            const href = node.getAttribute('href');
            const linkText = node.textContent.trim();
            if (href && href.startsWith('/ISBDM/docs/')) {
              const path = href.replace('/ISBDM/docs/', '').replace('.html', '');
              itemText += `<InLink href="/docs/${path}">${linkText}</InLink>`;
            } else {
              itemText += linkText;
            }
          } else if (node.nodeType === 1) { // Element node
            itemText += node.textContent.trim();
          }
        });
        
        // Clean up whitespace
        itemText = itemText.replace(/\s+/g, ' ').trim();
        
        if (itemText) {
          listContent += `${indent}${marker}. ${itemText}\n`;
        }
      });
      
      return listContent;
    }

    // Helper function to process unordered lists
    function processUnorderedList(ulElement) {
      let listContent = '';
      const items = ulElement.querySelectorAll(':scope > li');
      
      items.forEach(li => {
        const itemText = processTextContent(li);
        if (itemText) {
          listContent += `- ${itemText}\n`;
        }
      });
      
      return listContent;
    }

    // Helper function to process example divs
    function processExampleDiv(div, content) {
      // Check for narrative examples
      const narrative = div.querySelector('.xampleNarrative');
      if (narrative) {
        let narrativeText = narrative.textContent.trim();
        // Remove extra whitespace
        narrativeText = narrativeText.replace(/\s+/g, ' ').trim();
        
        content.push('| Relation | Example |\n');
        content.push('|----------|----------|\n');
        content.push(`| display of ISBDM metadata | "${narrativeText}" |\n\n`);
      }

      // Handle comments/annotations
      const comment = div.querySelector('.editComment');
      if (comment) {
        let commentText = comment.innerHTML.trim();
        // Remove extra whitespace
        commentText = commentText.replace(/\s+/g, ' ').trim();
        // Convert internal links
        commentText = commentText.replace(/<a class="linkInline" href="\/ISBDM\/docs\/([^"]+)\.html">([^<]+)<\/a>/g, 
          '<InLink href="/docs/$1">$2</InLink>');
        content.push(`*${commentText}*\n\n`);
      }
    }

    // Generate frontmatter YAML
    const frontmatterYaml = Object.entries(frontmatter)
      .map(([key, value]) => `${key}: ${typeof value === 'string' ? `'${value}'` : value}`)
      .join('\n');

    // Combine everything
    const mdxOutput = `---
${frontmatterYaml}
---

${content.join('')}`;

    // Write the output
    fs.writeFileSync(outputPath, mdxOutput);
    console.log(`Converted ${htmlFilePath} to ${outputPath}`);
    console.log(`Conversion successful: extracted ${document.querySelectorAll('.guid').length} guidance sections and ${document.querySelectorAll('.xampleBlockGuid').length} example blocks`);

  } catch (error) {
    console.error(`Error converting ${htmlFilePath}:`, error);
    throw error;
  }
}

// If called directly, run the conversion
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node convert-html-general-to-mdx.js <inputFile> <outputFile>');
    process.exit(1);
  }
  
  const [inputFile, outputFile] = args;
  convertGeneralHtmlToMdx(inputFile, outputFile);
}

module.exports = convertGeneralHtmlToMdx;