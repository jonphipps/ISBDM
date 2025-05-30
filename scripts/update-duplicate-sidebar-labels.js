/**
 * Script to update duplicate sidebar labels in fullex MDX files
 * 
 * This script identifies files with duplicate sidebar labels
 * and updates them to include the full title
 * 
 * Usage:
 * node update-duplicate-sidebar-labels.js
 */

const fs = require('fs');
const path = require('path');

// Define target directory
const targetDir = '/Users/jonphipps/Code/ISBDM/docs/fullex/';

/**
 * Extract sidebar labels and titles from all MDX files
 */
function extractLabelsAndTitles() {
  console.log('Extracting sidebar labels and titles from MDX files...');
  
  const files = fs.readdirSync(targetDir)
    .filter(file => file.endsWith('.mdx'));
  
  const fileData = [];
  const labelCounts = {};
  
  files.forEach(file => {
    const filePath = path.join(targetDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract title and sidebar_label from frontmatter
    const titleMatch = content.match(/title: "([^"]+)"/);
    const sidebarLabelMatch = content.match(/sidebar_label: "([^"]+)"/);
    
    if (titleMatch && sidebarLabelMatch) {
      const title = titleMatch[1];
      const sidebarLabel = sidebarLabelMatch[1];
      
      // Store file data
      fileData.push({
        file: filePath,
        title,
        sidebarLabel
      });
      
      // Count occurrences of each sidebar label
      labelCounts[sidebarLabel] = (labelCounts[sidebarLabel] || 0) + 1;
    }
  });
  
  return { fileData, labelCounts };
}

/**
 * Updates a single MDX file with the new sidebar label
 */
function updateFile(filePath, newSidebarLabel) {
  console.log(`Updating sidebar label in ${path.basename(filePath)}`);
  
  try {
    // Read the MDX file
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Replace sidebar_label
    const updatedContent = content.replace(
      /sidebar_label: "([^"]+)"/,
      `sidebar_label: "${newSidebarLabel}"`
    );
    
    // Write the updated content
    fs.writeFileSync(filePath, updatedContent);
    
    return true;
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
    return false;
  }
}

/**
 * Main function to update all files with duplicate sidebar labels
 */
function updateDuplicateSidebarLabels() {
  // Extract sidebar labels and titles
  const { fileData, labelCounts } = extractLabelsAndTitles();
  
  // Find duplicate labels
  const duplicateLabels = Object.keys(labelCounts).filter(label => labelCounts[label] > 1);
  
  console.log(`\nFound ${duplicateLabels.length} duplicate sidebar labels:`);
  duplicateLabels.forEach(label => {
    console.log(`- "${label}" (${labelCounts[label]} occurrences)`);
  });
  
  let successCount = 0;
  let errorCount = 0;
  
  // Update files with duplicate labels
  fileData.forEach(file => {
    if (duplicateLabels.includes(file.sidebarLabel)) {
      // Use full title as the new sidebar label
      const success = updateFile(file.file, file.title);
      
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    }
  });
  
  console.log(`\nSummary:`);
  console.log(`Successfully updated ${successCount} files`);
  console.log(`Failed to update ${errorCount} files`);
}

// Run the processing
updateDuplicateSidebarLabels();