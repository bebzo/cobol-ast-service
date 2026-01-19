import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Login
  console.log('📍 Logging in...');
  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill('embebangon@gmail.com');
  await page.locator('input[type="password"]').fill('EManu1231975@@');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForTimeout(3000);
  
  console.log('✅ Logged in');
  
  // Click "Load Demo (10K LOC)" button
  console.log('\n📦 Loading demo code...');
  const demoBtn = page.getByRole('button', { name: /load demo/i });
  if (await demoBtn.isVisible()) {
    await demoBtn.click();
    await page.waitForTimeout(2000);
    console.log('Demo code loaded');
  }
  
  // Take screenshot of loaded code
  await page.screenshot({ path: '/workspace/analysis-01-code-loaded.png', fullPage: true });
  
  // Click "Refactor with Gemini" button
  console.log('\n🚀 Starting analysis...');
  const refactorBtn = page.getByRole('button', { name: /refactor with gemini/i });
  if (await refactorBtn.isVisible()) {
    await refactorBtn.click();
    console.log('Analysis started, waiting for completion...');
    
    // Wait for analysis to complete (check for results)
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes max
    
    while (attempts < maxAttempts) {
      await page.waitForTimeout(2000);
      attempts++;
      
      // Check if Python tab has content
      const pythonTab = await page.$('button:has-text("Python")');
      if (pythonTab) {
        await pythonTab.click();
        await page.waitForTimeout(500);
        
        // Look for actual Python code (not just placeholder)
        const codeContent = await page.$('.monaco-editor');
        if (codeContent) {
          const text = await page.evaluate(() => {
            const editor = document.querySelector('.monaco-editor');
            return editor?.textContent?.slice(0, 100) || '';
          });
          
          if (text.includes('def ') || text.includes('class ') || text.includes('import ')) {
            console.log(`✅ Analysis complete after ${attempts * 2}s`);
            break;
          }
        }
      }
      
      if (attempts % 10 === 0) {
        console.log(`  Still waiting... (${attempts * 2}s)`);
      }
    }
    
    // Take screenshots of each tab
    console.log('\n📸 Capturing all tabs...');
    
    // Python tab
    const pythonTab = await page.$('button:has-text("Python")');
    if (pythonTab) {
      await pythonTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/workspace/analysis-02-python.png', fullPage: true });
      console.log('  ✅ Python tab captured');
    }
    
    // Tests tab
    const testsTab = await page.$('button:has-text("Tests")');
    if (testsTab) {
      await testsTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/workspace/analysis-03-tests.png', fullPage: true });
      console.log('  ✅ Tests tab captured');
      
      // Check content
      const monaco = await page.$('.monaco-editor');
      console.log('    Monaco visible:', !!monaco);
    }
    
    // Architecture tab
    const archTab = await page.$('button:has-text("Architecture")');
    if (archTab) {
      await archTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/workspace/analysis-04-architecture.png', fullPage: true });
      console.log('  ✅ Architecture tab captured');
    }
    
    // Check for AI Insights / metrics
    console.log('\n📊 Checking for metrics...');
    const insightsBtn = await page.$('button:has-text("AI Insights")');
    if (insightsBtn) {
      await insightsBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/workspace/analysis-05-insights.png', fullPage: true });
      console.log('  ✅ AI Insights captured');
    }
    
  } else {
    console.log('❌ Refactor button not found');
  }
  
  await browser.close();
  console.log('\n✅ Full analysis test complete');
})();
