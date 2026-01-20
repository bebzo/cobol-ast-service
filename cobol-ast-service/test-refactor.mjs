import { chromium } from 'playwright';

const BASE_URL = 'https://ejsrr0247eon.space.minimax.io';

async function testRefactor() {
  console.log('🚀 Testing refactoring flow...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  try {
    // Go directly to dashboard
    console.log('\n📋 1. Loading dashboard...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/01-dashboard.png' });
    console.log('   ✅ Dashboard loaded');
    
    // Check current state
    const pageText = await page.textContent('body');
    console.log('   📝 Page contains demo code:', pageText.includes('MEGA-ENTERPRISE'));
    
    // Click on "Refactor with Gemini" button
    console.log('\n📋 2. Starting refactoring...');
    const refactorBtn = await page.locator('button:has-text("Refactor"), button:has-text("Gemini")').first();
    
    if (await refactorBtn.isVisible()) {
      console.log('   Found refactor button, clicking...');
      await refactorBtn.click();
      console.log('   ✅ Clicked refactor button');
      
      // Wait and take screenshots during processing
      for (let i = 1; i <= 30; i++) {
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `screenshots/refactor-${String(i).padStart(2,'0')}.png` });
        
        // Check for completion indicators
        const hasComplete = await page.locator('text=/Terminée|Complete|100%|Success/i').first().isVisible().catch(() => false);
        const hasGreen = await page.locator('.bg-green-500, .bg-green-600, .text-green-500').first().isVisible().catch(() => false);
        
        console.log(`   ⏳ Step ${i}: complete=${hasComplete}, green=${hasGreen}`);
        
        if (hasComplete || hasGreen) {
          console.log('   ✅ Analysis complete detected!');
          break;
        }
        
        // Check for error
        const hasError = await page.locator('text=/Error|Erreur|Failed/i').first().isVisible().catch(() => false);
        if (hasError) {
          console.log('   ❌ Error detected');
          break;
        }
      }
      
      // Now click Python tab to see code
      console.log('\n📋 3. Checking Python tab...');
      await page.waitForTimeout(1000);
      
      const pythonTab = await page.locator('button:has-text("Python")').first();
      if (await pythonTab.isVisible()) {
        await pythonTab.click();
        await page.waitForTimeout(2000);
        console.log('   ✅ Clicked Python tab');
      }
      
      await page.screenshot({ path: 'screenshots/python-result.png', fullPage: true });
      
      // Check for Python code
      console.log('\n📋 4. Checking for Python code...');
      
      // Look for pre tag with code
      const preElements = await page.locator('pre').all();
      console.log(`   Found ${preElements.length} <pre> elements`);
      
      let foundPython = false;
      for (let i = 0; i < preElements.length; i++) {
        const text = await preElements[i].textContent();
        if (text && text.length > 100) {
          console.log(`\n   📝 Pre #${i+1} (${text.length} chars):`);
          console.log('   ' + text.substring(0, 400).replace(/\n/g, '\n   '));
          
          if (text.includes('def ') || text.includes('class ') || text.includes('print(') || text.includes('import ')) {
            foundPython = true;
            console.log('\n   🎉 PYTHON CODE FOUND!');
          }
        }
      }
      
      if (!foundPython) {
        // Check for Monaco editor content
        const monacoContent = await page.locator('.monaco-editor .view-lines').textContent().catch(() => null);
        if (monacoContent && monacoContent.length > 100) {
          console.log('\n   📝 Monaco editor content:', monacoContent.substring(0, 300));
          foundPython = true;
        }
        
        // Check for "Loading..." or placeholder text
        const loading = await page.locator('text=/Loading|Chargement|appear here/i').first().isVisible().catch(() => false);
        if (loading) {
          console.log('\n   ⚠️ Still showing loading/placeholder text');
        }
      }
      
      // Final verdict
      console.log('\n' + '='.repeat(50));
      console.log(foundPython ? '✅ TEST PASSED: Python code displays correctly' : '❌ TEST FAILED: Python code not displayed');
      console.log('='.repeat(50));
      
    } else {
      console.log('   ❌ Refactor button not found');
      
      // List all buttons for debugging
      const buttons = await page.locator('button').all();
      console.log(`   Found ${buttons.length} buttons:`);
      for (let i = 0; i < Math.min(buttons.length, 10); i++) {
        const text = await buttons[i].textContent();
        console.log(`   - Button ${i+1}: "${text?.substring(0, 50)}"`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: 'screenshots/error-refactor.png' });
  } finally {
    await browser.close();
    console.log('\n📸 Screenshots saved to /workspace/screenshots/');
  }
}

testRefactor();
