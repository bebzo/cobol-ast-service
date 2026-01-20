import { chromium } from 'playwright';
import fs from 'fs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Create a test COBOL file
const testCobol = `       IDENTIFICATION DIVISION.
       PROGRAM-ID. TEST-PROGRAM.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-AMOUNT PIC 9(5)V99.
       PROCEDURE DIVISION.
           MOVE 100.50 TO WS-AMOUNT.
           DISPLAY WS-AMOUNT.
           STOP RUN.`;

fs.writeFileSync('/workspace/test.cbl', testCobol);

console.log('1. Navigating to dashboard...');
await page.goto('https://cobol-ast-service.vercel.app/dashboard', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

// Check if we're on login page
const isLoginPage = await page.$('text=Welcome Back');
if (isLoginPage) {
  console.log('❌ Redirected to login page - need authentication');
  await page.screenshot({ path: '/workspace/screenshots/upload-test-login.png' });
} else {
  console.log('2. Looking for upload button...');
  const uploadBtn = await page.$('text=Upload');
  if (uploadBtn) {
    console.log('3. Found upload button');
  }
  
  // Check COBOL editor state
  const editorArea = await page.$('.monaco-editor');
  if (editorArea) {
    console.log('✅ Monaco editor loaded');
  } else {
    console.log('⚠️ Monaco editor not found - might still be loading');
  }
  
  // Check for Loading... text
  const loadingText = await page.$('text=Loading...');
  if (loadingText) {
    console.log('❌ Found "Loading..." text still present');
  }
  
  const initText = await page.$('text=Initializing editor');
  if (initText) {
    console.log('⚠️ Found "Initializing editor..." - still loading');
  }
  
  await page.screenshot({ path: '/workspace/screenshots/upload-test-result.png' });
}

await browser.close();
console.log('Test complete');
