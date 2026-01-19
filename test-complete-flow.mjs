import { chromium } from 'playwright';

const BASE_URL = 'https://ejsrr0247eon.space.minimax.io';

async function testCompleteFlow() {
  console.log('🚀 Testing complete analysis flow...\n');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  try {
    // Step 1: Load dashboard
    console.log('📋 Step 1: Loading dashboard...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/flow-01-initial.png' });
    console.log('   ✅ Dashboard loaded\n');
    
    // Step 2: Load Demo code
    console.log('📋 Step 2: Loading demo COBOL code...');
    const loadDemoBtn = await page.locator('button:has-text("Load Demo"), button:has-text("Demo")').first();
    if (await loadDemoBtn.isVisible()) {
      await loadDemoBtn.click();
      await page.waitForTimeout(3000);
      console.log('   ✅ Clicked Load Demo button');
    } else {
      console.log('   ⚠️ Demo button not visible, looking for alternatives...');
      // Try clicking the pink/red demo button
      const pinkBtn = await page.locator('.bg-pink-500, .bg-pink-600, button.bg-pink-500').first();
      if (await pinkBtn.isVisible()) {
        await pinkBtn.click();
        await page.waitForTimeout(3000);
        console.log('   ✅ Clicked pink demo button');
      }
    }
    await page.screenshot({ path: 'screenshots/flow-02-demo-loaded.png' });
    
    // Check if COBOL code is now visible
    const cobolPanel = await page.locator('.text-white, [class*="cobol"]').first();
    const hasCobolCode = await page.locator('text=IDENTIFICATION DIVISION').isVisible().catch(() => false);
    console.log(`   📝 COBOL code visible: ${hasCobolCode}\n`);
    
    // Step 3: Start refactoring
    console.log('📋 Step 3: Starting refactoring...');
    const refactorBtn = await page.locator('button:has-text("Refactor with Gemini"), button:has-text("Refactor")').first();
    if (await refactorBtn.isVisible()) {
      await refactorBtn.click();
      console.log('   ✅ Clicked Refactor button');
      
      // Wait for analysis with detailed progress
      console.log('   ⏳ Waiting for analysis...');
      for (let i = 1; i <= 60; i++) {
        await page.waitForTimeout(2000);
        
        // Take occasional screenshots
        if (i % 5 === 0) {
          await page.screenshot({ path: `screenshots/flow-03-progress-${i}.png` });
        }
        
        // Check for analysis completion
        const analysisStatus = await page.locator('[class*="bg-green-"]:has-text("Terminée"), [class*="bg-green-"]:has-text("Complete")').first().isVisible().catch(() => false);
        const progressText = await page.locator('text=/\\d+%/').textContent().catch(() => null);
        
        if (progressText) {
          console.log(`   ⏳ Progress: ${progressText}`);
        }
        
        if (analysisStatus) {
          console.log('   ✅ Analysis complete!');
          break;
        }
        
        // Check for error
        const hasError = await page.locator('text=/Error|Erreur/i').first().isVisible().catch(() => false);
        if (hasError) {
          console.log('   ❌ Error during analysis');
          await page.screenshot({ path: 'screenshots/flow-error.png' });
          break;
        }
        
        if (i === 60) {
          console.log('   ⚠️ Timeout waiting for analysis');
        }
      }
    } else {
      console.log('   ❌ Refactor button not found');
    }
    
    await page.screenshot({ path: 'screenshots/flow-04-after-analysis.png' });
    console.log('');
    
    // Step 4: Check Python tab
    console.log('📋 Step 4: Checking Python output...');
    const pythonTab = await page.locator('button:has-text("Python")').first();
    if (await pythonTab.isVisible()) {
      await pythonTab.click();
      await page.waitForTimeout(2000);
      console.log('   ✅ Clicked Python tab');
    }
    
    await page.screenshot({ path: 'screenshots/flow-05-python-tab.png', fullPage: true });
    
    // Step 5: Verify Python code display
    console.log('\n📋 Step 5: Verifying Python code display...');
    
    // Check various selectors
    const selectors = [
      { name: '<pre> elements', sel: 'pre' },
      { name: 'Monaco editor', sel: '.monaco-editor .view-lines' },
      { name: 'Code blocks', sel: 'code' },
      { name: 'Python content', sel: '[class*="python"]' },
    ];
    
    let codeFound = false;
    for (const { name, sel } of selectors) {
      try {
        const elements = await page.locator(sel).all();
        if (elements.length > 0) {
          console.log(`   📝 Found ${elements.length} ${name}`);
          for (let i = 0; i < Math.min(elements.length, 2); i++) {
            const text = await elements[i].textContent();
            if (text && text.length > 50) {
              const preview = text.substring(0, 200).replace(/\n/g, ' ');
              console.log(`      Content[${i}]: "${preview}..."`);
              if (text.includes('def ') || text.includes('class ') || text.includes('import ') || text.includes('print(')) {
                codeFound = true;
                console.log('      🎉 Contains Python code patterns!');
              }
            }
          }
        }
      } catch (e) {}
    }
    
    // Check for loading/placeholder
    const showingLoading = await page.locator('text=/Loading|appear here|Chargement/i').first().isVisible().catch(() => false);
    if (showingLoading) {
      console.log('   ⚠️ Still showing loading/placeholder message');
    }
    
    // Get HTML of the Python panel area for debugging
    const pythonPanelHTML = await page.locator('[class*="python"], .bg-slate-900').first().innerHTML().catch(() => 'Not found');
    console.log(`\n   🔍 Python panel HTML (first 500 chars):`);
    console.log(`   ${pythonPanelHTML.substring(0, 500)}`);
    
    // Final result
    console.log('\n' + '='.repeat(60));
    if (codeFound) {
      console.log('✅ TEST PASSED: Python code is displayed correctly!');
    } else {
      console.log('❌ TEST FAILED: Python code not displayed');
      console.log('   Check screenshots/flow-05-python-tab.png for details');
    }
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: 'screenshots/flow-error.png' });
  } finally {
    await browser.close();
  }
}

testCompleteFlow();
