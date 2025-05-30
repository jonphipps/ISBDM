#!/usr/bin/env node

/**
 * Robust script to fix YAML frontmatter formatting in MDX files
 * Designed to handle severely malformed frontmatter
 */

const fs = require('fs');
const path = require('path');

// Check if file path is provided
if (process.argv.length < 3) {
  console.error('Usage: node fix-frontmatter-robust.js <path-to-mdx-file>');
  process.exit(1);
}

const filePath = process.argv[2];

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

// Read file content
let content = fs.readFileSync(filePath, 'utf8');

// Find the frontmatter - supporting both *** and --- delimiters
const frontmatterMatch = content.match(/^[*-]{3}\r?\n([\s\S]*?)\r?\n[*-]{3}/);
if (!frontmatterMatch) {
  console.error(`No frontmatter found in ${filePath}`);
  process.exit(1);
}

const rawFrontmatter = frontmatterMatch[1];
const frontmatterBlock = frontmatterMatch[0];

// Get the filename (without extension) to use as id
const baseFileName = path.basename(filePath, '.mdx');

// For the specific problematic pattern observed in 1025.mdx
// Create a completely new frontmatter based on minimal information we can extract
let title = "Unknown";
let definition = "";

// Try to extract title from the content
const titleMatch = content.match(/# ([^\n]+)/);
if (titleMatch) {
  title = titleMatch[1].trim();
}

// Try to extract definition from frontmatter
const definitionMatch = rawFrontmatter.match(/definition:\s*\|-\s*(\|-\s*)?([\s\S]*?)(?=\w+:|---)/);
if (definitionMatch) {
  definition = definitionMatch[2].trim();
}

// If definition is still empty, try to extract it from the content
if (!definition) {
  // Look for the first class="guid" div after the ElementReference component
  const guidDivMatch = content.match(/<ElementReference\s*\/>\s*\n+\s*#+\s*Additional\s*information\s*\n+\s*<div\s*className="guid">\s*\n+\s*([\s\S]*?)\s*\n+\s*<\/div>/s);
  if (guidDivMatch && guidDivMatch[1]) {
    definition = guidDivMatch[1].trim();
  }
  
  // If that fails, try looking for any div with class="guid"
  if (!definition) {
    const anyGuidDivMatch = content.match(/<div\s*className="guid">\s*\n+\s*([\s\S]*?)\s*\n+\s*<\/div>/s);
    if (anyGuidDivMatch && anyGuidDivMatch[1]) {
      definition = anyGuidDivMatch[1].trim();
    }
  }
}

// Determine the correct ID - prefer the title over the filename
const elementId = title.toLowerCase().trim();

// Create a new clean frontmatter object
const newFrontmatterObj = {
  RDF: {
    label: title,
    definition: definition,
    domain: "Manifestation",
    range: "Literal",
    uri: `http://iflastandards.info/ns/isbd/isbdm/elements/${baseFileName}`,
    type: "DatatypeProperty"
  },
  id: elementId,
  title: title,
  sidebar_label: title
};

// Convert to YAML format
const newFrontmatter = 
`RDF:
  label: "${title}"
  definition: >-
    ${definition.replace(/\n/g, ' ')}
  domain: "Manifestation"
  range: "Literal"
  uri: "http://iflastandards.info/ns/isbd/isbdm/elements/${baseFileName}"
  type: "DatatypeProperty"
id: "${elementId}"
title: "${title}"
sidebar_label: "${title}"`;

// Replace the frontmatter in the content
const newContent = content.replace(
  frontmatterBlock, 
  `---\n${newFrontmatter}\n---`
);

// Write the file
fs.writeFileSync(filePath, newContent);
console.log(`Successfully fixed frontmatter in ${filePath}`);