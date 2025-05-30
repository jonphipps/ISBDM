/**
 * Script to clean up and fix formatting in the converted MDX files
 * 
 * Usage:
 * node clean-fullex-mdx.js
 */

const fs = require('fs');
const path = require('path');

// Define target directory
const targetDir = '/Users/jonphipps/Code/ISBDM/docs/fullex/';

/**
 * Cleans up a single MDX file
 */
function cleanFile(filePath) {
  console.log(`Cleaning ${filePath}`);
  
  // Read the MDX file
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Fix leading/trailing whitespace in each line
  let cleanedContent = content
    .split('\n')
    .map(line => line.trim())
    .join('\n');
  
  // Fix multiline strings and normalize whitespace
  cleanedContent = cleanedContent
    // Fix title and heading with line breaks
    .replace(/title: "([^"]+)"/g, (match, title) => {
      return `title: "${title.replace(/\s+/g, ' ')}"`;
    })
    .replace(/# ([^#\n]+)/g, (match, heading) => {
      return `# ${heading.replace(/\s+/g, ' ')}`;
    })
    
    // Fix element names with line breaks
    .replace(/element: "([^"]+)"/g, (match, element) => {
      return `element: "${element.replace(/\s+/g, ' ')}"`;
    })
    
    // Fix value strings with line breaks
    .replace(/value: "([^"]+)"/g, (match, value) => {
      return `value: "${value.replace(/\s+/g, ' ')}"`;
    })
    
    // Fix detail strings with line breaks
    .replace(/detail: "([^"]+)"/g, (match, detail) => {
      return `detail: "${detail.replace(/\s+/g, ' ')}"`;
    });
  
  // Write the cleaned file
  fs.writeFileSync(filePath, cleanedContent);
  
  return { 
    fileName: path.basename(filePath),
    fileSize: cleanedContent.length
  };
}

/**
 * Fix the link URLs in all MDX files
 */
function fixLinks() {
  console.log('Fixing links in all MDX files...');
  
  // Get all MDX files
  const files = fs.readdirSync(targetDir)
    .filter(file => file.endsWith('.mdx'))
    .map(file => path.join(targetDir, file));
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Replace .html URLs with correct paths
    const updatedContent = content.replace(
      /elementUrl: "\/docs\/(.*?)\.html"/g, 
      'elementUrl: "/docs/$1"'
    );
    
    if (content !== updatedContent) {
      fs.writeFileSync(file, updatedContent);
      console.log(`Updated links in ${file}`);
    }
  });
}

/**
 * Update the index to use InLink components
 */
function updateIndex() {
  console.log('Updating index file to use InLink components...');
  
  const indexPath = path.join(targetDir, 'index.mdx');
  if (!fs.existsSync(indexPath)) {
    console.error('Index file not found');
    return;
  }
  
  const content = fs.readFileSync(indexPath, 'utf8');
  
  // Replace markdown links with InLink components
  const updatedContent = content
    .replace(/# Full Examples/g, '# Full Examples')
    .replace(/^- \[(.*?)\]\((\/docs\/fullex\/.*?)\)$/gm, '- <InLink href="$2">$1</InLink>');
  
  // Add import for InLink
  const finalContent = content.includes('import { InLink }') 
    ? updatedContent
    : `---
title: "Full Examples"
sidebar_label: "Full Examples"
---

import { InLink } from '@site/src/components/global/InLink';

# Full Examples

These examples demonstrate how to describe various manifestations using the ISBD for Manifestation model.

${updatedContent.split('# Full Examples')[1].trim()}`;
  
  fs.writeFileSync(indexPath, finalContent);
  console.log('Index file updated successfully');
}

/**
 * Main function to clean all files
 */
function cleanAllFiles() {
  // Get all MDX files
  const files = fs.readdirSync(targetDir)
    .filter(file => file.endsWith('.mdx') && file !== 'index.mdx')
    .map(file => path.join(targetDir, file));
  
  console.log(`Found ${files.length} MDX files to clean`);
  
  const cleanedFiles = [];
  
  // Clean each file
  files.forEach(file => {
    try {
      const fileInfo = cleanFile(file);
      cleanedFiles.push(fileInfo);
      console.log(`Successfully cleaned ${path.basename(file)}`);
    } catch (error) {
      console.error(`Error cleaning ${file}:`, error);
    }
  });
  
  // Fix the links
  fixLinks();
  
  // Update the index
  updateIndex();
  
  console.log(`Successfully cleaned ${cleanedFiles.length} files`);
}

// Run the cleaning process
cleanAllFiles();