#!/usr/bin/env node

/**
 * Enhanced script to fix table formatting in MDX files according to project standards.
 * This script specifically targets tables within <details> blocks in MDX files.
 */

const fs = require('fs');
const path = require('path');

// Check if file path is provided
if (process.argv.length < 3) {
  console.error('Usage: node fix-table-format.js <path-to-mdx-file>');
  process.exit(1);
}

const filePath = process.argv[2];

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

// Read file content
const content = fs.readFileSync(filePath, 'utf8');

// Find all details blocks with tables
const detailsBlocks = content.match(/<details>[\s\S]*?<\/details>/g) || [];
let fixedContent = content;

detailsBlocks.forEach(block => {
  // Create a fixed version of the block
  let fixedBlock = block;
  
  // Ensure proper spacing and structure according to project standards
  fixedBlock = fixedBlock.replace(/<details>\s*\n\s*<summary>/g, '<details>\n  <summary>');
  fixedBlock = fixedBlock.replace(/<\/summary>\s*\n/g, '</summary>\n\n');
  
  // Handle tables inside the details blocks
  // First, find and extract all table blocks
  const tables = [];
  let tableStart = -1;
  let tableEnd = -1;
  let depth = 0;
  const lines = fixedBlock.split('\n');
  
  // Looking for table patterns
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect table headers
    if (line.match(/^\s*\| Property \| Value \|/) || line.match(/^\s*\|[^|]+\|[^|]+\|/)) {
      if (tableStart === -1) {
        tableStart = i; // Mark the start of a table
      }
      depth = lines[i].search(/\S|$/); // Get indentation level
    }
    // Detect table separator
    else if (line.match(/^\s*\|:?-+:?\s*\|:?-+:?\s*\|/)) {
      if (tableStart !== -1) {
        // This is part of a table we already started tracking
        continue;
      }
    }
    // End of table detection
    else if (tableStart !== -1 && (line === '' || line.startsWith('*') || line.startsWith('<hr') || i === lines.length - 1)) {
      tableEnd = i;
      
      // Extract the table content
      const tableLines = lines.slice(tableStart, tableEnd);
      
      // Check if this is actually a table
      const hasHeader = tableLines.some(l => l.trim().match(/^\s*\| Property \| Value \|/));
      const hasSeparator = tableLines.some(l => l.trim().match(/^\s*\|:?-+:?\s*\|:?-+:?\s*\|/));
      
      if (hasHeader || tableLines.length > 0) {
        tables.push({
          start: tableStart,
          end: tableEnd,
          indent: depth,
          content: tableLines
        });
      }
      
      tableStart = -1;
      tableEnd = -1;
    }
  }
  
  // Now rebuild the block with properly formatted tables
  let newLines = [...lines];
  
  // Process each table (in reverse order to avoid index shifts)
  for (let i = tables.length - 1; i >= 0; i--) {
    const table = tables[i];
    
    // Create a properly formatted table
    let newTable = [];
    let indent = '    '; // Standard indentation (4 spaces) for tables in details
    
    // Add the header if missing
    if (!table.content.some(line => line.trim().match(/^\s*\| Property \| Value \|/))) {
      newTable.push(`${indent}| Property | Value |`);
    } else {
      const headerLine = table.content.find(line => line.trim().match(/^\s*\| Property \| Value \|/));
      newTable.push(`${indent}| Property | Value |`);
      table.content = table.content.filter(line => line !== headerLine);
    }
    
    // Add the separator
    newTable.push(`${indent}|:---------|:------|`);
    
    // Check if there are any rows
    const contentRows = table.content.filter(line => 
      line.trim().match(/^\s*\|[^|]+\|[^|]+\|/) && 
      !line.trim().match(/^\s*\|:?-+:?\s*\|:?-+:?\s*\|/) &&
      !line.trim().match(/^\s*\| Property \| Value \|/)
    );
    
    // If no valid content rows found, check the HTML source for examples
    if (contentRows.length === 0) {
      // Get comments or references if they exist
      const comments = newLines.filter(line => line.trim().startsWith('*['));
      
      if (comments.length > 0) {
        // Add the comments with proper formatting
        newTable.push('');
        comments.forEach(comment => {
          newTable.push(`    ${comment.trim()}`);
        });
      }
    } else {
      // Process each content row
      for (const line of table.content) {
        if (line.trim().match(/^\s*\|:?-+:?\s*\|:?-+:?\s*\|/)) {
          // Skip existing separators
          continue;
        }
        
        if (line.trim().match(/^\s*\|[^|]+\|[^|]+\|/)) {
          // This is a table row, format it properly
          const rowMatch = line.trim().match(/^\s*\|([^|]*)\|([^|]*)\|/);
          
          if (rowMatch) {
            const property = rowMatch[1].trim();
            const value = rowMatch[2].trim();
            newTable.push(`${indent}| ${property} | ${value} |`);
          } else {
            // If we couldn't parse it, just keep it with proper indentation
            newTable.push(`${indent}${line.trim()}`);
          }
        }
      }
    }
    
    // Add comments and metadata that might be after the table
    const followingContent = [];
    let foundComment = false;
    for (let j = table.end; j < newLines.length && j < table.end + 5; j++) {
      const line = newLines[j].trim();
      if (line.startsWith('*[') || line.startsWith('<hr')) {
        followingContent.push(`${indent}${line}`);
        foundComment = true;
      } else if (foundComment && line === '') {
        followingContent.push('');
      } else if (foundComment) {
        break;
      }
    }
    
    if (followingContent.length > 0) {
      newTable.push('');
      newTable.push(...followingContent);
      newTable.push('');
    }
    
    // Add proper spacing
    newTable.push(`\n    <hr />\n`);
    
    // Replace the old table with the new one
    newLines.splice(table.start, table.end - table.start, ...newTable);
  }
  
  // Join the fixed lines back together
  fixedBlock = newLines.join('\n');
  
  // Add proper spacing
  fixedBlock = fixedBlock.replace(/\n\s*\*\[\[/g, '\n\n    *[[');
  fixedBlock = fixedBlock.replace(/\]\]\*\s*\n/g, ']]* \n');
  fixedBlock = fixedBlock.replace(/<hr \/>\s*\n/g, '\n\n    <hr />\n\n');
  
  // Replace the original block with fixed version
  fixedContent = fixedContent.replace(block, fixedBlock);
});

// Clean up any remaining formatting issues
// Remove excessive blank lines (more than 2 consecutive newlines)
fixedContent = fixedContent.replace(/\n{3,}/g, '\n\n');

// Clean up all repeated truncated examples
const repeatedExamplePattern = /(\*\[\[[^\]]+)(\n\s*\*\[\[[^\]]+)*(\n\n)/g;
fixedContent = fixedContent.replace(repeatedExamplePattern, (match, first, rest, end) => {
  // Keep only the first example line with the complete text if available
  const completeExample = match.includes("]]* ") ? 
    match.replace(/(\*\[\[[^\]]+\]\]\*)(\n\s*\*\[\[[^\]]+)*(\n\n)/, '$1$3') :
    `${first}${end}`;
  return completeExample;
});

// Handle empty tables by removing them entirely
fixedContent = fixedContent.replace(
  /\|\s*Property\s*\|\s*Value\s*\|\n\s*\|:[-]+\|:[-]+\|\n+\s*\n+\s*<hr \/>/g, 
  '<hr />'
);

// Handle empty example tables (remove redundant lines between headers and examples)
fixedContent = fixedContent.replace(
  /\|\s*Property\s*\|\s*Value\s*\|\n\s*\|:[-]+\|:[-]+\|\n+\s*\*\[\[/g, 
  '| Property | Value |\n    |:---------|:------|\n\n    *[['
);

// Clean up multiple empty examples with only hr tags
fixedContent = fixedContent.replace(
  /(<hr \/>\n+\s*){3,}/g,
  '<hr />\n\n    '
);

// Ensure proper div formatting
fixedContent = fixedContent.replace(/<div className="([^"]+)">\s*<Mandatory \/>\s*\n+\s*/g, 
                                  '<div className="$1">\n  <Mandatory />\n  \n  ');
fixedContent = fixedContent.replace(/<div className="([^"]+)">\s*([^<])/g, 
                                  '<div className="$1">\n  $2');
fixedContent = fixedContent.replace(/\s*<\/div>/g, '\n</div>');

// Fix long titles and IDs in title headings
fixedContent = fixedContent.replace(/^# (.+)(\n)/gm, (match, title, endline) => {
  // If the title is over 60 characters, split it
  if (title.length > 60) {
    // Find a sensible place to split (around 50-60 chars)
    const splitPoint = title.lastIndexOf(' ', 60);
    if (splitPoint > 0) {
      return `# ${title.substring(0, splitPoint)}\n  ${title.substring(splitPoint + 1)}${endline}`;
    }
  }
  return match;
});

// Check for subsections in the HTML and properly add them to MDX if missing
const h5Subsections = content.match(/<h5>([^<]+)<\/h5>/g);
if (h5Subsections && !fixedContent.includes('### ')) {
  // Extract the subsection titles
  const subsectionTitles = h5Subsections.map(
    h5 => h5.replace(/<h5>([^<]+)<\/h5>/, '$1').trim()
  );
  
  // Add subsections to the MDX content if they're missing
  subsectionTitles.forEach(title => {
    const mdxPattern = new RegExp(`### ${title}`, 'i');
    if (!fixedContent.match(mdxPattern)) {
      // Find where to insert the subsection
      const stipSection = fixedContent.indexOf('## Stipulations');
      if (stipSection !== -1) {
        const stipEnd = fixedContent.indexOf('</div>', stipSection);
        if (stipEnd !== -1) {
          fixedContent = 
            fixedContent.substring(0, stipEnd + 6) + 
            `\n\n### ${title}\n` + 
            fixedContent.substring(stipEnd + 6);
        }
      }
    }
  });
}

// Fix section titles that weren't correctly added
const sectionFixes = [
  { html: 'Agents', mdx: '### Agents' },
  { html: 'Places', mdx: '### Places' },
  { html: 'Time-spans', mdx: '### Time-spans' },
];

sectionFixes.forEach(fix => {
  if (content.includes(fix.html) && !fixedContent.includes(fix.mdx)) {
    // Find the section in the original content
    const sectionPos = content.indexOf(fix.html);
    if (sectionPos !== -1) {
      // Find a corresponding position in the fixed content
      const stipSection = fixedContent.indexOf('## Stipulations');
      if (stipSection !== -1) {
        // Find a place to insert the section title
        const beforePos = fixedContent.lastIndexOf('</div>', stipSection + 200);
        const afterPos = fixedContent.indexOf('</div>', stipSection + 200);
        const insertPos = afterPos !== -1 ? afterPos + 6 : fixedContent.length;
        
        fixedContent = 
          fixedContent.substring(0, insertPos) + 
          `\n\n${fix.mdx}\n` + 
          fixedContent.substring(insertPos);
      }
    }
  }
});

// Write the fixed content back to the file
fs.writeFileSync(filePath, fixedContent);
console.log(`Successfully fixed table formatting in ${filePath}`);