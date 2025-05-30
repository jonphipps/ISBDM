#!/usr/bin/env node

/**
 * Script to check all internal links in the built Docusaurus site
 * Usage: node scripts/check-internal-links.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/ISBDM';
const VISITED = new Set();
const BROKEN_LINKS = new Map();

async function checkLinks(page, url) {
  if (VISITED.has(url)) return;
  VISITED.add(url);

  console.log(`Checking: ${url}`);

  try {
    const response = await page.goto(url, { waitUntil: 'networkidle' });
    
    if (!response || response.status() >= 400) {
      BROKEN_LINKS.set(url, response ? response.status() : 'No response');
      return;
    }

    // Get all internal links
    const links = await page.evaluate(() => {
      const baseUrl = window.location.origin;
      return Array.from(document.querySelectorAll('a[href]'))
        .map(a => a.href)
        .filter(href => href.startsWith(baseUrl) && !href.includes('#'))
        .filter((href, index, self) => self.indexOf(href) === index);
    });

    // Recursively check each link
    for (const link of links) {
      if (!VISITED.has(link)) {
        await checkLinks(page, link);
      }
    }
  } catch (error) {
    BROKEN_LINKS.set(url, error.message);
  }
}

async function main() {
  console.log('Starting link checker...');
  console.log('Make sure your Docusaurus site is running at http://localhost:3000');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await checkLinks(page, BASE_URL);

  await browser.close();

  console.log('\n--- Link Check Results ---');
  console.log(`Total pages checked: ${VISITED.size}`);
  console.log(`Broken links found: ${BROKEN_LINKS.size}`);

  if (BROKEN_LINKS.size > 0) {
    console.log('\nBroken links:');
    for (const [url, error] of BROKEN_LINKS) {
      console.log(`  ${url} - ${error}`);
    }
    process.exit(1);
  } else {
    console.log('\nAll links are valid! ✅');
  }
}

// Check if Playwright is installed
try {
  require.resolve('playwright');
  main().catch(console.error);
} catch (e) {
  console.error('Playwright is not installed. Please run:');
  console.error('npm install --save-dev playwright');
  process.exit(1);
}