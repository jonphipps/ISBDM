#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Function to recursively find all MDX files in a directory
function findMdxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findMdxFiles(filePath, fileList);
    } else if (file.endsWith('.mdx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Main function to process files and generate mapping
function generateSidebarPrefixMapping() {
  const docsDir = path.join(__dirname, '..', 'docs');
  const mdxFiles = findMdxFiles(docsDir);
  
  const mapping = {};
  let filesWithPrefix = 0;
  
  mdxFiles.forEach(filePath => {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContent);
      
      // Check if file has customProps.sidebar_prefix
      if (data.customProps && data.customProps.sidebar_prefix) {
        // Get document ID, falling back to filename without extension if id is missing
        const docId = data.id || path.basename(filePath, '.mdx');
        mapping[docId] = data.customProps.sidebar_prefix;
        filesWithPrefix++;
      }
    } catch (err) {
      console.error(`Error processing ${filePath}:`, err.message);
    }
  });
  
  console.log(`Found ${filesWithPrefix} files with sidebar_prefix out of ${mdxFiles.length} total MDX files`);
  
  // Write the mapping to a file
  const outputPath = path.join(__dirname, '..', 'src', 'utils', 'sidebarPrefixMapping.ts');
  const tsOutput = `// Auto-generated mapping of document IDs to sidebar prefixes
// Generated on ${new Date().toISOString()}

export const sidebarPrefixMapping: Record<string, string> = ${JSON.stringify(mapping, null, 2)};

export default sidebarPrefixMapping;
`;

  fs.writeFileSync(outputPath, tsOutput);
  console.log(`Mapping written to ${outputPath}`);
  
  return mapping;
}

// Run the script
generateSidebarPrefixMapping();