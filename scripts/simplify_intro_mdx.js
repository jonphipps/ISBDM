#!/usr/bin/env node

/**
 * This script simplifies the MDX files in the intro directory by:
 * 1. Converting nested JSX lists to Markdown lists
 * 2. Fixing any other MDX parsing issues
 */

const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.join(__dirname, '..', 'docs', 'intro');
const files = fs.readdirSync(TARGET_DIR).filter(file => file.endsWith('.mdx'));

for (const mdxFile of files) {
  const mdxPath = path.join(TARGET_DIR, mdxFile);
  
  console.log(`Processing ${mdxFile}...`);
  
  // Read the file
  let content = fs.readFileSync(mdxPath, 'utf8');
  
  // Convert <ol> and <ul> to Markdown format
  content = convertToMarkdownLists(content);
  
  // Fix other common issues
  content = fixCommonIssues(content);
  
  // Write the updated file
  fs.writeFileSync(mdxPath, content);
  console.log(`Successfully updated ${mdxFile}`);
}

function convertToMarkdownLists(content) {
  // Extract the frontmatter and imports
  const frontmatterMatch = content.match(/^---[\s\S]*?---/);
  const frontmatter = frontmatterMatch ? frontmatterMatch[0] : '';
  
  const importsMatch = content.match(/^---[\s\S]*?---\s*(import[\s\S]*?;)\s*/);
  const imports = importsMatch ? importsMatch[1] : '';
  
  // Remove frontmatter and imports to simplify processing
  const mainContent = content
    .replace(/^---[\s\S]*?---/, '')
    .replace(/^\s*(import[\s\S]*?;)\s*/, '');
  
  // Convert nested JSX lists to Markdown
  let convertedContent = mainContent
    // Convert <ol className="num"> and <ul className="bull"> to Markdown lists
    .replace(/<ol[^>]*className="num"[^>]*>([\s\S]*?)<\/ol>/g, (match, listContent) => {
      return convertListToMarkdown(listContent, '1. ', 0);
    })
    .replace(/<ul[^>]*className="bull"[^>]*>([\s\S]*?)<\/ul>/g, (match, listContent) => {
      return convertListToMarkdown(listContent, '- ', 0);
    })
    // Fix other class attributes
    .replace(/class="/g, 'className="')
    .replace(/class='/g, "className='")
    .replace(/<span class=/g, '<span className=')
    .replace(/<ol class=/g, '<ol className=')
    .replace(/<ul class=/g, '<ul className=');
  
  // Reassemble the document
  return `${frontmatter}\n${imports}\n\n${convertedContent}`;
}

function convertListToMarkdown(listContent, listPrefix, indentLevel) {
  // Convert <li> elements to Markdown list items
  const indent = '  '.repeat(indentLevel);
  
  // Transform the list content
  return listContent
    .replace(/<li>([\s\S]*?)(?:<\/li>|(?=<li>))/g, (match, itemContent) => {
      // Check for nested lists
      const nestedOlMatch = itemContent.match(/<ol[^>]*className="([^"]*)"[^>]*>([\s\S]*?)<\/ol>/);
      const nestedUlMatch = itemContent.match(/<ul[^>]*className="([^"]*)"[^>]*>([\s\S]*?)<\/ul>/);
      
      if (nestedOlMatch) {
        // Replace nested ol with Markdown
        const nestedListClass = nestedOlMatch[1];
        const nestedListContent = nestedOlMatch[2];
        const nestedPrefix = nestedListClass === 'al' ? 'a. ' : '1. ';
        
        const mainContent = itemContent.replace(/<ol[^>]*className="[^"]*"[^>]*>[\s\S]*?<\/ol>/, '').trim();
        const nestedMarkdown = convertListToMarkdown(nestedListContent, nestedPrefix, indentLevel + 1);
        
        return `${indent}${listPrefix}${mainContent}\n${nestedMarkdown}\n`;
      } else if (nestedUlMatch) {
        // Replace nested ul with Markdown
        const nestedListContent = nestedUlMatch[2];
        const mainContent = itemContent.replace(/<ul[^>]*className="[^"]*"[^>]*>[\s\S]*?<\/ul>/, '').trim();
        const nestedMarkdown = convertListToMarkdown(nestedListContent, '- ', indentLevel + 1);
        
        return `${indent}${listPrefix}${mainContent}\n${nestedMarkdown}\n`;
      } else {
        // Simple list item
        return `${indent}${listPrefix}${itemContent.trim()}\n`;
      }
    });
}

function fixCommonIssues(content) {
  return content
    // Fix any unclosed div tags
    .replace(/<div([^>]*)>\s*([^<]*?)(?!\s*<\/div>)\s*$/gm, '<div$1>$2</div>')
    // Fix any unclosed p tags
    .replace(/<p([^>]*)>\s*([^<]*?)(?!\s*<\/p>)\s*$/gm, '<p$1>$2</p>')
    // Fix OutLink/InLink issues
    .replace(/<a class="linkInline" href="([^"]+)">(.*?)<\/a>/g, (match, href, text) => {
      if (href.startsWith('/ISBDM/docs/')) {
        const path = href.replace('/ISBDM/docs/', '').replace('.html', '');
        return `<InLink to="/${path}">${text}</InLink>`;
      } else if (href.startsWith('http')) {
        return `<OutLink href="${href}">${text}</OutLink>`;
      } else {
        return `<InLink to="${href}">${text}</InLink>`;
      }
    })
    .replace(/<a class="linkOutline" href="([^"]+)"[^>]*>(.*?)<\/a>/g, (match, href, text) => {
      return `<OutLink href="${href}">${text}</OutLink>`;
    });
}

console.log('All intro MDX files have been simplified successfully!');