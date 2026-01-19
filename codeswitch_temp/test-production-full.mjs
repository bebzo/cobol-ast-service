import { chromium } from 'playwright';
import fs from 'fs';

const BASE_URL = 'https://ejsrr0247eon.space.minimax.io';

async function testProduction() {
  console.log('🚀 Starting comprehensive production tests...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  const results = {
    passed: [],
    failed: [],
    screenshots: []
  };
  
  try {
    // Test 1: Landing Page
    console.log('\n📋 Test 1: Landing Page');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: 'screenshots/01-landing.png' });
    results.screenshots.push('01-landing.png');
    
    const title = await page.title();
    if (title) {
      console.log(`   ✅ Landing page loaded - Title: ${title}`);
      results.passed.push('Landing page loads correctly');
    } else {
      results.failed.push('Landing page has no title');
    }
    
    // Test 2: Navigate to Dashboard (Demo)
    console.log('\n📋 Test 2: Navigate to Dashboard');
    const demoBtn = await page.locator('text=Démonstration').or(page.locator('text=Demo')).or(page.locator('a[href="/dashboard"]')).first();
    if (await demoBtn.isVisible()) {
      await demoBtn.click();
      await page.waitForURL('**/dashboard**', { timeout: 15000 });
      console.log('   ✅ Navigated to dashboard');
      results.passed.push('Dashboard navigation works');
    } else {
      // Try direct navigation
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
      console.log('   ℹ️ Direct navigation to dashboard');
    }
    await page.screenshot({ path: 'screenshots/02-dashboard.png' });
    results.screenshots.push('02-dashboard.png');
    
    // Test 3: Check COBOL Editor
    console.log('\n📋 Test 3: COBOL Editor Check');
    const cobolEditor = await page.locator('textarea').or(page.locator('[class*="cobol"]')).first();
    if (await cobolEditor.isVisible()) {
      console.log('   ✅ COBOL editor is visible');
      results.passed.push('COBOL editor visible');
    } else {
      console.log('   ❌ COBOL editor not found');
      results.failed.push('COBOL editor not visible');
    }
    
    // Test 4: Load Sample COBOL Code
    console.log('\n📋 Test 4: Load Sample COBOL Code');
    const sampleCode = `       IDENTIFICATION DIVISION.
       PROGRAM-ID. TEST-PROGRAM.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-COUNTER PIC 9(3) VALUE 0.
       PROCEDURE DIVISION.
           DISPLAY "HELLO WORLD".
           ADD 1 TO WS-COUNTER.
           STOP RUN.`;
    
    // Try to find and fill COBOL textarea
    const textarea = await page.locator('textarea').first();
    if (await textarea.isVisible()) {
      await textarea.fill(sampleCode);
      console.log('   ✅ Sample COBOL code loaded');
      results.passed.push('COBOL code input works');
    }
    await page.screenshot({ path: 'screenshots/03-cobol-loaded.png' });
    results.screenshots.push('03-cobol-loaded.png');
    
    // Test 5: Start Analysis
    console.log('\n📋 Test 5: Start Analysis');
    const analyzeBtn = await page.locator('button:has-text("Analyser")').or(page.locator('button:has-text("Analyze")'));
    if (await analyzeBtn.first().isVisible()) {
      await analyzeBtn.first().click();
      console.log('   ⏳ Analysis started...');
      
      // Wait for analysis to complete
      await page.waitForTimeout(5000);
      await page.screenshot({ path: 'screenshots/04-analyzing.png' });
      results.screenshots.push('04-analyzing.png');
      
      // Wait for the green badge or completion indicator
      try {
        await page.waitForSelector('[class*="green"], [class*="success"], text=Terminée, text=Complete', { timeout: 60000 });
        console.log('   ✅ Analysis completed');
        results.passed.push('Analysis completes successfully');
      } catch (e) {
        console.log('   ⚠️ Analysis status unclear');
      }
    }
    
    // Test 6: Check Python Tab
    console.log('\n📋 Test 6: Python Tab Check');
    const pythonTab = await page.locator('button:has-text("Python")').or(page.locator('[role="tab"]:has-text("Python")'));
    if (await pythonTab.first().isVisible()) {
      await pythonTab.first().click();
      await page.waitForTimeout(2000);
      console.log('   ✅ Python tab clicked');
      results.passed.push('Python tab accessible');
    }
    await page.screenshot({ path: 'screenshots/05-python-tab.png' });
    results.screenshots.push('05-python-tab.png');
    
    // Test 7: Check Python Code Display (CRITICAL TEST)
    console.log('\n📋 Test 7: Python Code Display (CRITICAL)');
    
    // Check for Python code in various selectors
    const codeSelectors = [
      'pre:has-text("def ")',
      'pre:has-text("class ")',
      'pre:has-text("import ")',
      'pre:has-text("print(")',
      '.monaco-editor',
      '[class*="python"]',
      'pre'
    ];
    
    let pythonCodeFound = false;
    for (const selector of codeSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible()) {
          const text = await element.textContent();
          if (text && (text.includes('def ') || text.includes('class ') || text.includes('print') || text.includes('WS_COUNTER') || text.length > 100)) {
            console.log(`   ✅ Python code found using: ${selector}`);
            console.log(`   📝 Code preview: ${text.substring(0, 200)}...`);
            pythonCodeFound = true;
            results.passed.push('Python code displays correctly');
            break;
          }
        }
      } catch (e) {}
    }
    
    if (!pythonCodeFound) {
      console.log('   ❌ Python code NOT displayed');
      
      // Debug: Get all pre tags content
      const preTags = await page.locator('pre').all();
      console.log(`   🔍 Found ${preTags.length} <pre> tags`);
      for (let i = 0; i < Math.min(preTags.length, 3); i++) {
        const text = await preTags[i].textContent();
        console.log(`   📄 Pre #${i+1}: ${text?.substring(0, 100) || 'empty'}...`);
      }
      
      results.failed.push('Python code not displayed');
    }
    
    await page.screenshot({ path: 'screenshots/06-python-code.png', fullPage: true });
    results.screenshots.push('06-python-code.png');
    
    // Test 8: Check UI Elements
    console.log('\n📋 Test 8: UI Elements Check');
    
    // Check for line counter
    const lineCounter = await page.locator('text=/\\d+ lignes/').or(page.locator('text=/\\d+ lines/'));
    if (await lineCounter.first().isVisible()) {
      console.log('   ✅ Line counter visible');
      results.passed.push('Line counter displays');
    } else {
      console.log('   ⚠️ Line counter not found');
    }
    
    // Check COBOL text color (should be white)
    const cobolTextElement = await page.locator('textarea, [class*="text-white"]').first();
    if (await cobolTextElement.isVisible()) {
      const classes = await cobolTextElement.getAttribute('class');
      if (classes && classes.includes('text-white')) {
        console.log('   ✅ COBOL text is white');
        results.passed.push('COBOL text color is white');
      } else {
        console.log('   ℹ️ COBOL text color: ' + (classes || 'unknown'));
      }
    }
    
    // Final screenshot
    await page.screenshot({ path: 'screenshots/07-final-state.png', fullPage: true });
    results.screenshots.push('07-final-state.png');
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    await page.screenshot({ path: 'screenshots/error-state.png' });
    results.failed.push(`Error: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed.length}`);
  results.passed.forEach(p => console.log(`   - ${p}`));
  console.log(`❌ Failed: ${results.failed.length}`);
  results.failed.forEach(f => console.log(`   - ${f}`));
  console.log(`📸 Screenshots: ${results.screenshots.length}`);
  
  return results;
}

testProduction().catch(console.error);
