/**
 * Script to add sidebar_position frontmatter to fullex MDX files
 * 
 * This script extracts the order from the original HTML navigation
 * and adds corresponding sidebar_position values to MDX files
 * 
 * Usage:
 * node add-sidebar-position-to-fullex.js
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Define source and target directories
const sourceHtml = '/Users/jonphipps/Code/ISBDM/ISBDM/docs/fullex/index.html';
const targetDir = '/Users/jonphipps/Code/ISBDM/docs/fullex/';

/**
 * Extract file order from HTML navigation
 */
function extractFileOrder() {
  console.log('Extracting file order from HTML navigation...');
  
  // Read the HTML file
  const html = fs.readFileSync(sourceHtml, 'utf8');
  const $ = cheerio.load(html);
  
  const fileOrder = {};
  let position = 2; // Start at 2 to reserve position 1 for index.mdx
  
  // Extract links from navigation
  $('nav.navISBDMSection a.linkMenuEntry').each((index, element) => {
    const href = $(element).attr('href');
    if (href) {
      // Extract file ID (fx001, fx002, etc.)
      const match = href.match(/\/fullex\/(fx\d+)\.html/);
      if (match && match[1]) {
        const fileId = match[1];
        fileOrder[fileId] = position++;
      }
    }
  });
  
  console.log(`Extracted order for ${Object.keys(fileOrder).length} files`);
  return fileOrder;
}

/**
 * Updates a single MDX file with sidebar_position
 */
function updateFile(filePath, position) {
  console.log(`Adding sidebar_position: ${position} to ${path.basename(filePath)}`);
  
  try {
    // Read the MDX file
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file already has frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    
    if (frontmatterMatch) {
      // Extract existing frontmatter
      const frontmatter = frontmatterMatch[1];
      
      // Check if sidebar_position already exists
      if (frontmatter.includes('sidebar_position:')) {
        // Replace existing sidebar_position
        const updatedFrontmatter = frontmatter.replace(
          /sidebar_position:.*(\n|$)/,
          `sidebar_position: ${position}$1`
        );
        
        // Replace frontmatter in content
        const updatedContent = content.replace(
          /^---\n[\s\S]*?\n---/,
          `---\n${updatedFrontmatter}\n---`
        );
        
        fs.writeFileSync(filePath, updatedContent);
      } else {
        // Add sidebar_position to existing frontmatter
        const updatedFrontmatter = `${frontmatter}\nsidebar_position: ${position}`;
        
        // Replace frontmatter in content
        const updatedContent = content.replace(
          /^---\n[\s\S]*?\n---/,
          `---\n${updatedFrontmatter}\n---`
        );
        
        fs.writeFileSync(filePath, updatedContent);
      }
    } else {
      // No frontmatter found, add it
      const updatedContent = `---\nsidebar_position: ${position}\n---\n\n${content}`;
      fs.writeFileSync(filePath, updatedContent);
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
    return false;
  }
}

/**
 * Main function to add sidebar position to all files
 */
function addSidebarPositions() {
  // Extract file order
  const fileOrder = extractFileOrder();
  
  // Set position 1 for index.mdx
  const indexFile = path.join(targetDir, 'index.mdx');
  if (fs.existsSync(indexFile)) {
    updateFile(indexFile, 1);
  }
  
  // Update all MDX files with proper positions
  let successCount = 0;
  let errorCount = 0;
  
  // Process each file
  Object.entries(fileOrder).forEach(([fileId, position]) => {
    const mdxFile = path.join(targetDir, `${fileId}.mdx`);
    
    if (fs.existsSync(mdxFile)) {
      const success = updateFile(mdxFile, position);
      
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    } else {
      console.error(`File not found: ${mdxFile}`);
      errorCount++;
    }
  });
  
  console.log(`\nSummary:`);
  console.log(`Successfully updated ${successCount} files`);
  console.log(`Failed to update ${errorCount} files`);
}

// Run the processing
addSidebarPositions();