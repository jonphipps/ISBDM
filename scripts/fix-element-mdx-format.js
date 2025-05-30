#!/usr/bin/env node

/**
 * Script to fix formatting issues in a specific MDX file
 * This script handles common formatting issues that automatic tools might struggle with
 */

const fs = require('fs');
const path = require('path');

// Check if file path is provided
if (process.argv.length < 3) {
  console.error('Usage: node fix-element-mdx-format.js <path-to-mdx-file>');
  process.exit(1);
}

const filePath = process.argv[2];

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

// Read file content
const content = fs.readFileSync(filePath, 'utf8');

// Fix common formatting issues
let fixedContent = content;

// 1. Fix YAML frontmatter formatting
const frontmatterMatch = fixedContent.match(/^---\n([\s\S]*?)\n---/);
if (frontmatterMatch) {
  const frontmatter = frontmatterMatch[1];
  let fixedFrontmatter = frontmatter;
  
  // Fix id, title, and sidebar_label positioning
  const hasRDF = frontmatter.includes('RDF:');
  if (hasRDF) {
    const idMatch = fixedFrontmatter.match(/^(\s*)id:(.*)$/m);
    const titleMatch = fixedFrontmatter.match(/^(\s*)title:(.*)$/m);
    const sidebarMatch = fixedFrontmatter.match(/^(\s*)sidebar_label:(.*)$/m);
    
    if (idMatch) {
      fixedFrontmatter = fixedFrontmatter.replace(/^(\s*)id:(.*)$/m, '');
    }
    if (titleMatch) {
      fixedFrontmatter = fixedFrontmatter.replace(/^(\s*)title:(.*)$/m, '');
    }
    if (sidebarMatch) {
      fixedFrontmatter = fixedFrontmatter.replace(/^(\s*)sidebar_label:(.*)$/m, '');
    }
    
    if (idMatch || titleMatch || sidebarMatch) {
      fixedFrontmatter = fixedFrontmatter.trim();
      if (idMatch) {
        fixedFrontmatter += `\nid:${idMatch[2]}`;
      }
      if (titleMatch) {
        fixedFrontmatter += `\ntitle:${titleMatch[2]}`;
      }
      if (sidebarMatch) {
        fixedFrontmatter += `\nsidebar_label:${sidebarMatch[2]}`;
      }
    }
  }
  
  // Replace the frontmatter in the content
  fixedContent = fixedContent.replace(frontmatterMatch[0], `---\n${fixedFrontmatter}\n---`);
}

// 2. Fix JSX component spacing
fixedContent = fixedContent.replace(/<([A-Z][a-zA-Z]*)\s*\/>/g, '<$1 />');
fixedContent = fixedContent.replace(/<([A-Z][a-zA-Z]*)\s*>(\s*)<\/\1>/g, '<$1>$2</$1>');

// 3. Ensure consistent spacing around headers
fixedContent = fixedContent.replace(/^(#+)\s*(.*?)$/gm, '$1 $2');

// 4. Fix link formatting
fixedContent = fixedContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '[$1]($2)');

// 5. Ensure proper spacing around divs
fixedContent = fixedContent.replace(/<div([^>]*)>\s*/g, '<div$1>\n\n  ');
fixedContent = fixedContent.replace(/\s*<\/div>/g, '\n\n</div>');

// 6. Fix table formatting
fixedContent = fixedContent.replace(/\| Property \| Value \|.*\n\|:[-]+\|.*\n/g, 
                                    '| Property | Value |\n|:---------|:------|\n');

// Fix individual table rows that may have been split
const detailsBlocks = fixedContent.match(/<details>[\s\S]*?<\/details>/g) || [];
for (const detailsBlock of detailsBlocks) {
  let fixedDetailsBlock = detailsBlock;
  
  // First, handle all variations of table headers and ensure only one proper header
  
  // First completely remove all instances of table headers
  let allHeadersRemoved = fixedDetailsBlock;
  
  // Find all occurrences of table headers
  const tableHeaderMatches = [...fixedDetailsBlock.matchAll(/\s*\| Property \| Value \|\s*\n\s*\|:[-]+\|:[-]+\|\s*\n/g)];
  const headerPositions = tableHeaderMatches.map(match => match.index);
  
  // Remove them one by one, starting from the end to avoid index shifts
  for (let i = headerPositions.length - 1; i >= 0; i--) {
    const headerIndex = headerPositions[i];
    if (headerIndex !== undefined) {
      const beforeHeader = allHeadersRemoved.substring(0, headerIndex);
      const afterHeaderMatch = allHeadersRemoved.substring(headerIndex).match(/\s*\| Property \| Value \|\s*\n\s*\|:[-]+\|:[-]+\|\s*\n/);
      const afterHeader = allHeadersRemoved.substring(headerIndex + (afterHeaderMatch ? afterHeaderMatch[0].length : 0));
      
      allHeadersRemoved = beforeHeader + afterHeader;
    }
  }
  
  // Now add back a single proper header after the summary and fix surrounding structure
  allHeadersRemoved = allHeadersRemoved.replace(/<details>\s*\n\s*<summary>Examples<\/summary>\s*\n/g, 
                                   '<details>\n  <summary>Examples</summary>\n\n    | Property | Value |\n    |:---------|:------|\n    ');
                                   
  // Double-check that we have a proper table header after each summary
  const summaries = [...allHeadersRemoved.matchAll(/<summary>Examples<\/summary>\s*\n(?!\s*\| Property \| Value \|)/g)];
  for (const summary of summaries) {
    if (summary.index !== undefined) {
      const beforeSummary = allHeadersRemoved.substring(0, summary.index + summary[0].length);
      const afterSummary = allHeadersRemoved.substring(summary.index + summary[0].length);
      allHeadersRemoved = beforeSummary + '\n    | Property | Value |\n    |:---------|:------|\n    ' + afterSummary;
    }
  }
  
  fixedDetailsBlock = allHeadersRemoved;
  
  // 3. Handle missing table headers
  fixedDetailsBlock = fixedDetailsBlock.replace(/<summary>Examples<\/summary>\s*\n\s*\|:[-]+\|:[-]+\|\s*\n/g,
                                   '<summary>Examples</summary>\n\n    | Property | Value |\n    |:---------|:------|\n    ');
                                    
  // 4. General fix for table content immediately after summary without headers                                
  fixedDetailsBlock = fixedDetailsBlock.replace(/<summary>Examples<\/summary>\s*\n\s*\|([^|]*)\|([^|]*)\|\s*\n/g,
                                   '<summary>Examples</summary>\n\n    | Property | Value |\n    |:---------|:------|\n    |$1|$2|\n    ');
                                   
  // 5. Fix indentation of tables inside details
  fixedDetailsBlock = fixedDetailsBlock.replace(/(<details>\s*\n\s*<summary>Examples<\/summary>)\s*\n\s*(\| Property \| Value \|)/g,
                                   '$1\n\n    $2');
  
  // Extract all table rows (lines starting with pipe), being more inclusive
  const tableRows = fixedDetailsBlock.match(/\s*\|.*?\|.*?\|.*?\n/g) || [];
  
  // Create a map to track row locations in the text
  const rowPositions = [];
  
  for (const row of tableRows) {
    const index = fixedDetailsBlock.indexOf(row);
    if (index !== -1) {
      rowPositions.push({ index, row });
    }
  }
  
  // Sort rows by their position in the text
  rowPositions.sort((a, b) => a.index - b.index);
  
  // Process rows to fix merged cells and indentation
  for (let i = 0; i < rowPositions.length; i++) {
    const {index, row} = rowPositions[i];
    
    // Skip table header and separator rows - now we're more specific to avoid skipping content rows
    if ((row.includes('Property') && row.includes('Value')) || row.includes(':-----')) {
      continue;
    }
    
    // Clean up the current row (normalize spacing, etc.)
    let cleanRow = row.replace(/^\s*/, '    ').trim() + '\n';
    
    // Fix spacing within cells
    cleanRow = cleanRow.replace(/\|\s*(.*?)\s*\|/g, '| $1 |');
    
    // Make sure we have a properly formed table row with two cells
    if (!cleanRow.match(/\|[^|]+\|[^|]+\|/)) {
      // This might be a malformed row - try to fix it
      const parts = cleanRow.split('|').filter(p => p.trim());
      if (parts.length === 1) {
        // Only one part - this might be a continuation of the previous row
        cleanRow = `    | | ${parts[0].trim()} |\n`;
      } else if (parts.length >= 2) {
        // Try to format as a proper row
        cleanRow = `    | ${parts[0].trim()} | ${parts.slice(1).join(' ').trim()} |\n`;
      }
    }
    
    // If next row exists and doesn't have a property value (starts with | |)
    if (i+1 < rowPositions.length && /\|\s*\| /.test(rowPositions[i+1].row)) {
      // Try to extract cells with a more tolerant pattern
      const property = (row.split('|')[1] || '').trim();
      const value = (row.split('|')[2] || '').trim();
      
      // Extract value from continuation row - be more tolerant
      const nextRowSplit = rowPositions[i+1].row.split('|');
      const nextValue = (nextRowSplit.length >= 3 ? nextRowSplit[2] : nextRowSplit[1] || '').trim();
      
      // Combine them
      cleanRow = `    | ${property} | ${value} ${nextValue} |\n`;
      
      // Skip the next row since we merged it
      i++;
    }
    
    // Replace the original row with the cleaned version
    fixedDetailsBlock = fixedDetailsBlock.substring(0, index) + 
                        cleanRow + 
                        fixedDetailsBlock.substring(index + row.length);
                        
    // Update positions for remaining rows (they may have shifted)
    const lengthDiff = cleanRow.length - row.length;
    for (let j = i + 1; j < rowPositions.length; j++) {
      rowPositions[j].index += lengthDiff;
    }
  }
  
  // Replace the original details block with fixed version
  fixedContent = fixedContent.replace(detailsBlock, fixedDetailsBlock);
}

// 7. Normalize markdown lists
fixedContent = fixedContent.replace(/^(\s*)[-*] /gm, '$1- ');

// 8. Fix escaped markdown elements
fixedContent = fixedContent.replace(/\\\[/g, '[');
fixedContent = fixedContent.replace(/\\\]/g, ']');
fixedContent = fixedContent.replace(/\\\*/g, '*');
fixedContent = fixedContent.replace(/\\_/g, '_');

// 9. Fix SeeAlso formatting
fixedContent = fixedContent.replace(/<SeeAlso>\s*\[(.*?)\]\((.*?)\)\s*<\/SeeAlso>/g, 
                                    '<SeeAlso>[$1]($2)</SeeAlso>');
                                    
// Extra whitespace cleanup for SeeAlso that might span multiple lines
fixedContent = fixedContent.replace(/<SeeAlso>\s*\[has\s*\n\s*note on manifestation statement\]\((.*?)\)\s*<\/SeeAlso>/g,
                                    '<SeeAlso>[has note on manifestation statement]($1)</SeeAlso>');

// 8. Write back to file
fs.writeFileSync(filePath, fixedContent);

console.log(`Successfully formatted ${filePath}`);