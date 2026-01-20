#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create /vercel/path0/tmp directory (required by Next.js on Vercel)
const tmpDir = '/vercel/path0/tmp';
try {
  fs.mkdirSync(tmpDir, { recursive: true });
  console.log(`Created directory: ${tmpDir}`);
} catch (err) {
  // Directory might already exist
  console.log(`Note: ${tmpDir} - ${err.message}`);
}

// Run Next.js build
try {
  execSync('next build', { stdio: 'inherit' });
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
