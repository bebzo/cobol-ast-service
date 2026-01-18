import { chromium } from 'playwright';

const BASE_URL = 'https://ejsrr0247eon.space.minimax.io';

async function testSmallFile() {
  console.log('🚀 Testing with small COBOL file...\n');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  try {
    // Load dashboard
    console.log('📋 1. Loading dashboard...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Small sample COBOL
    const smallCobol = `       IDENTIFICATION DIVISION.
       PROGRAM-ID. TEST-SMALL.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-TOTAL PIC 9(5)V99 VALUE 0.
       PROCEDURE DIVISION.
           COMPUTE WS-TOTAL = 100.50 + 50.25.
           DISPLAY "TOTAL: " WS-TOTAL.
           STOP RUN.`;
    
    // Find the input area and type code
    console.log('📋 2. Entering small COBOL code...');
    
    // Check if there's a textbox or contenteditable
    const editorArea = await page.locator('.monaco-editor, textarea[placeholder*="COBOL"], div[contenteditable="true"]').first();
    if (await editorArea.isVisible()) {
      // Click to focus
      await editorArea.click();
      await page.waitForTimeout(500);
      
      // Try keyboard input
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.type(smallCobol, { delay: 5 });
      console.log('   ✅ Code entered via keyboard');
    } else {
      console.log('   ⚠️ No editor found, trying JavaScript injection...');
      
      // Try to set code via page context
      await page.evaluate((code) => {
        // Try finding React state setter
        const textareas = document.querySelectorAll('textarea');
        if (textareas.length > 0) {
          textareas[0].value = code;
          textareas[0].dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, smallCobol);
    }
    
    await page.screenshot({ path: 'screenshots/small-01-code-entered.png' });
    
    // Click Refactor button
    console.log('📋 3. Starting analysis...');
    const refactorBtn = await page.locator('button:has-text("Refactor"), button:has-text("Gemini")').first();
    if (await refactorBtn.isVisible()) {
      await refactorBtn.click();
      console.log('   ✅ Clicked refactor button');
      
      // Wait for completion (small file should be fast)
      for (let i = 0; i < 30; i++) {
        await page.waitForTimeout(2000);
        
        // Check for 100% or completion
        const percent = await page.locator('text=/100%|Terminée|Complete/i').first().isVisible().catch(() => false);
        if (percent) {
          console.log(`   ✅ Analysis complete after ${(i+1)*2}s`);
          break;
        }
        console.log(`   ⏳ Waiting... ${(i+1)*2}s`);
      }
    }
    
    await page.screenshot({ path: 'screenshots/small-02-after-analysis.png' });
    
    // Check Python tab
    console.log('\n📋 4. Checking Python output...');
    const pythonTab = await page.locator('button:has-text("Python")').first();
    if (await pythonTab.isVisible()) {
      await pythonTab.click();
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ path: 'screenshots/small-03-python-tab.png', fullPage: true });
    
    // Analyze what's displayed
    console.log('\n📋 5. Analyzing display elements...');
    
    // Check for pre, code, monaco content
    const elements = {
      pre: await page.locator('pre').count(),
      code: await page.locator('code').count(),
      monaco: await page.locator('.monaco-editor').count(),
      monacoLines: await page.locator('.monaco-editor .view-line').count(),
    };
    console.log('   Elements found:', elements);
    
    // Get any visible code content
    const preContent = await page.locator('pre').first().textContent().catch(() => null);
    if (preContent) {
      console.log(`\n   📝 Pre content (${preContent.length} chars):`);
      console.log('   ' + '-'.repeat(50));
      console.log('   ' + preContent.substring(0, 500).replace(/\n/g, '\n   '));
    }
    
    const monacoContent = await page.locator('.monaco-editor .view-lines').textContent().catch(() => null);
    if (monacoContent && monacoContent.length > 10) {
      console.log(`\n   📝 Monaco content (${monacoContent.length} chars):`);
      console.log('   ' + '-'.repeat(50));
      console.log('   ' + monacoContent.substring(0, 500).replace(/\n/g, '\n   '));
    }
    
    // Check for loading/placeholder
    const loadingVisible = await page.locator('text=/Loading|appear here|Chargement|No code/i').first().isVisible().catch(() => false);
    if (loadingVisible) {
      const loadingText = await page.locator('text=/Loading|appear here|Chargement|No code/i').first().textContent().catch(() => '');
      console.log(`\n   ⚠️ Still showing placeholder: "${loadingText}"`);
    }
    
    // Check page state
    console.log('   Page ready for inspection');
    
    console.log('\n✅ Test completed - check screenshots');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: 'screenshots/small-error.png' });
  } finally {
    await browser.close();
  }
}

testSmallFile();
