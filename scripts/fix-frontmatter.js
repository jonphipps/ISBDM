#!/usr/bin/env node

/**
 * Script to fix YAML frontmatter formatting in MDX files
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Check if file path is provided
if (process.argv.length < 3) {
  console.error('Usage: node fix-frontmatter.js <path-to-mdx-file>');
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

try {
  // Parse the frontmatter, allowing some flexibility in format
  let parsedFrontmatter;
  
  // Clean up frontmatter by fixing common issues
  let cleanedFrontmatter = rawFrontmatter
    // Fix indentation issues
    .replace(/^(\s*)(id|title|sidebar_label):/mg, 'id:')
    // Make sure each property starts on a new line
    .replace(/([a-zA-Z]+):\s+([a-zA-Z]+):/g, '$1:\n$2:');
  
  try {
    // Try to parse as YAML
    parsedFrontmatter = yaml.load(cleanedFrontmatter);
  } catch (e) {
    console.error(`YAML parsing error in ${filePath}:`, e.message);
    
    // Try a more manual approach to recover the data
    const lines = cleanedFrontmatter.split('\n');
    parsedFrontmatter = {};
    let currentKey = null;
    let currentValue = [];
    
    for (const line of lines) {
      const keyMatch = line.match(/^(\w+):(.*)/);
      if (keyMatch) {
        // Save previous key-value if it exists
        if (currentKey) {
          parsedFrontmatter[currentKey] = currentValue.join('\n').trim();
          currentValue = [];
        }
        
        currentKey = keyMatch[1].trim();
        const initialValue = keyMatch[2].trim();
        if (initialValue) {
          currentValue.push(initialValue);
        }
      } else if (currentKey) {
        currentValue.push(line);
      }
    }
    
    // Save the last key-value pair
    if (currentKey) {
      parsedFrontmatter[currentKey] = currentValue.join('\n').trim();
    }
  }
  
  // Ensure required properties
  if (!parsedFrontmatter.id) {
    parsedFrontmatter.id = path.basename(filePath, '.mdx');
  }
  
  if (!parsedFrontmatter.title && parsedFrontmatter.RDF?.label) {
    parsedFrontmatter.title = parsedFrontmatter.RDF.label;
  }
  
  if (!parsedFrontmatter.sidebar_label && parsedFrontmatter.title) {
    parsedFrontmatter.sidebar_label = parsedFrontmatter.title;
  }
  
  // Generate clean YAML
  const newFrontmatter = yaml.dump(parsedFrontmatter, {
    lineWidth: -1,
    noRefs: true,
    quotingType: '"'
  });
  
  // Replace the frontmatter in the content
  const newContent = content.replace(
    frontmatterBlock, 
    `---\n${newFrontmatter}---`
  );
  
  // Write the file
  fs.writeFileSync(filePath, newContent);
  console.log(`Successfully fixed frontmatter in ${filePath}`);
  
} catch (error) {
  console.error(`Error processing ${filePath}:`, error);
  process.exit(1);
}