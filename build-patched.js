#!/usr/bin/env node

// Load our patches in order of most fundamental to most specific
require('./src/utils/buffer-patch');
require('./src/utils/filehandle-patch');
require('./src/utils/image-size-direct-patch');

// Then start docusaurus build by spawning the original build script
const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Docusaurus build with patched modules...');

const args = process.argv.slice(2);
const child = spawn('yarn', ['docusaurus', 'build', ...args], {
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

child.on('error', (error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});

child.on('close', (code) => {
  process.exit(code);
});