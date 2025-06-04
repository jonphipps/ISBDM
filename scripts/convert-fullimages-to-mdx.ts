#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';

interface ImagePageData {
  title: string;
  imageAlt: string;
  imageSrc: string;
  caption: string;
  description: string;
}

function extractMainContent(html: string): ImagePageData | null {
  const $ = cheerio.load(html);
  const main = $('main');
  
  if (!main.length) {
    return null;
  }
  
  // Extract the title from h3
  const title = main.find('h3').first().text().trim();
  
  // Extract image information
  const figure = main.find('figure').first();
  const img = figure.find('img').first();
  const imageAlt = img.attr('alt') || '';
  const imageSrc = img.attr('src') || '';
  const caption = figure.find('figcaption').text().trim();
  
  // Extract description paragraph
  const description = main.find('p').not('.backbrowse').text().trim();
  
  return {
    title,
    imageAlt,
    imageSrc,
    caption,
    description
  };
}

function generateMDX(data: ImagePageData, fileName: string): string {
  // Generate sidebar label from filename (x001 -> Image 1)
  const imageNumber = fileName.replace('x', '').replace('.html', '');
  const sidebarLabel = `Image ${parseInt(imageNumber, 10)}`;
  
  // Convert image path to be relative to docs
  const imagePath = data.imageSrc.replace('/ISBDM/images/', '/img/');
  
  const mdx = `---
id: ${fileName.replace('.html', '')}
title: ${data.title}
sidebar_label: ${sidebarLabel}
---

import Figure from '@site/src/components/global/Figure';

# ${data.title}

<Figure 
  src="${imagePath}" 
  alt="${data.imageAlt}"
  caption="${data.caption}"
/>

${data.description}

<div className="backbrowse">
  <p>Use the browser "back" or "previous page" button to return to your place in ISBD for Manifestation.</p>
</div>
`;
  
  return mdx;
}

function processFile(inputPath: string, outputPath: string) {
  const html = fs.readFileSync(inputPath, 'utf-8');
  const data = extractMainContent(html);
  
  if (!data) {
    console.error(`Could not extract main content from ${inputPath}`);
    return;
  }
  
  const fileName = path.basename(inputPath);
  const mdx = generateMDX(data, fileName);
  
  const outputFileName = fileName.replace('.html', '.mdx');
  const fullOutputPath = path.join(outputPath, outputFileName);
  
  fs.writeFileSync(fullOutputPath, mdx);
  console.log(`Converted ${fileName} -> ${outputFileName}`);
}

function main() {
  const inputDir = '/Users/jonphipps/Code/ISBDM/ISBDM/docs/fullimages';
  const outputDir = '/Users/jonphipps/Code/ISBDM/docs/fullimages';
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Get all HTML files
  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.html'));
  
  console.log(`Found ${files.length} HTML files to convert`);
  
  // Process each file
  files.forEach(file => {
    const inputPath = path.join(inputDir, file);
    processFile(inputPath, outputDir);
  });
  
  // Create index.mdx
  const indexContent = `---
id: index
title: Full Images
sidebar_label: Full Images
---

# Full Images

This section contains full-size entity-relationship diagrams and other visual aids for ISBD for Manifestation.

## Available Images

${files.map(file => {
  const fileBase = file.replace('.html', '');
  const imageNumber = parseInt(fileBase.replace('x', ''), 10);
  return `- [Image ${imageNumber}](./${fileBase})`;
}).join('\n')}
`;
  
  fs.writeFileSync(path.join(outputDir, 'index.mdx'), indexContent);
  console.log('Created index.mdx');
}

// Run the script
if (require.main === module) {
  main();
}