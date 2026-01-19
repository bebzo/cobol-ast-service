import { chromium } from 'playwright';

const BASE_URL = 'https://ejsrr0247eon.space.minimax.io';

async function checkState() {
  console.log('🔍 Checking analysis state...\n');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  // Capture console logs
  page.on('console', msg => {
    if (msg.text().includes('python') || msg.text().includes('Python') || 
        msg.text().includes('Transpiler') || msg.text().includes('SSE')) {
      console.log('CONSOLE:', msg.text());
    }
  });
  
  try {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Load Demo
    const demoBtn = await page.locator('button:has-text("Load Demo")').first();
    await demoBtn.click();
    await page.waitForTimeout(3000);
    console.log('✅ Demo loaded');
    
    // Click Refactor
    const refactorBtn = await page.locator('button:has-text("Refactor")').first();
    await refactorBtn.click();
    console.log('⏳ Waiting for analysis...');
    
    // Wait for completion
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(2000);
      const complete = await page.locator('text=/100%|Complete/i').first().isVisible().catch(() => false);
      if (complete) {
        console.log('✅ Complete');
        break;
      }
    }
    
    await page.waitForTimeout(3000);
    
    // Get the state using developer tools evaluation
    const state = await page.evaluate(() => {
      // Access any global state if available
      const analysisElement = document.querySelector('[class*="metrics"]');
      const metricsText = analysisElement?.textContent || '';
      
      // Get all pre content
      const preElements = document.querySelectorAll('pre');
      const preContent = Array.from(preElements).map(p => ({
        length: p.textContent?.length || 0,
        preview: (p.textContent || '').substring(0, 200)
      }));
      
      // Get transformation metrics numbers
      const metricNumbers = document.querySelectorAll('[class*="Transformation"] .font-bold');
      const metrics = Array.from(metricNumbers).map(m => m.textContent);
      
      return { metricsText, preContent, metrics };
    });
    
    console.log('\n📊 State analysis:');
    console.log('Metrics numbers:', state.metrics);
    console.log('Pre elements:', state.preContent.length);
    state.preContent.forEach((p, i) => {
      console.log(`  Pre ${i}: ${p.length} chars, preview: "${p.preview}..."`);
    });
    
    // Click Python tab and check content
    const pythonTab = await page.locator('button:has-text("Python")').first();
    await pythonTab.click();
    await page.waitForTimeout(2000);
    
    // Check visible text in Python panel
    const pythonPanel = await page.locator('.bg-slate-900').first();
    const pythonText = await pythonPanel.textContent().catch(() => null);
    if (pythonText) {
      console.log(`\n📝 Python panel content (${pythonText.length} chars):`);
      console.log(pythonText.substring(0, 1000));
    }
    
    await page.screenshot({ path: 'screenshots/state-check.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

checkState();
