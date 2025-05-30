#!/usr/bin/env node

/**
 * Script to remove duplicated headers from MDX files
 * These headers are redundant since Docusaurus automatically displays titles from frontmatter
 */

const fs = require('fs');
const path = require('path');

// Directory to process
const directory = path.join(__dirname, '..', 'docs', 'ses');

// Get all MDX files in the directory
const mdxFiles = fs.readdirSync(directory)
  .filter(file => file.endsWith('.mdx'));

console.log(`Found ${mdxFiles.length} MDX files to process.`);

// Process each file
let modifiedCount = 0;

mdxFiles.forEach(file => {
  const filePath = path.join(directory, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Get the title from frontmatter
  const titleMatch = content.match(/title:\s*"([^"]+)"/);
  if (!titleMatch) {
    console.log(`No title found in frontmatter for ${file}, skipping.`);
    return;
  }
  
  const title = titleMatch[1];
  
  // Look for duplicated header after frontmatter
  const headerPattern = new RegExp(`---\\s*\\n(.*?)\\n---\\s*\\n## ${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n`, 's');
  
  if (headerPattern.test(content)) {
    // Replace the duplicated header, keeping the frontmatter
    content = content.replace(headerPattern, '---\n$1\n---\n\n');
    
    // Write the modified content back to the file
    fs.writeFileSync(filePath, content);
    
    console.log(`✓ Removed duplicated header from ${file}`);
    modifiedCount++;
  } else {
    console.log(`No duplicated header found in ${file}`);
  }
});

console.log(`\nSummary: Modified ${modifiedCount} files out of ${mdxFiles.length}.`);