#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create tmp directory for Next.js build (relative path works on Vercel)
const tmpDir = path.join(process.cwd(), 'tmp');
try {
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
    console.log(`Created directory: ${tmpDir}`);
  }
} catch (err) {
  console.log(`Note: Could not create tmp directory: ${err.message}`);
}

// Run Next.js build
try {
  execSync('next build', { stdio: 'inherit' });
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
