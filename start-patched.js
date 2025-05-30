#!/usr/bin/env node

// Load our patches in order of most fundamental to most specific
import './src/utils/buffer-patch.js';
import './src/utils/filehandle-patch.js';
import './src/utils/image-size-direct-patch.js';

// Then start docusaurus normally by spawning the original start script
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

console.log('Starting Docusaurus with patched modules...');

const args = process.argv.slice(2);
const child = spawn('yarn', ['docusaurus', 'start', ...args], {
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