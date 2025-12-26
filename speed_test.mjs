import { chromium } from 'playwright';

const url = 'https://7d6yn1krl6x5.space.minimax.io';

async function testSpeed() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Loading page...');
  await page.goto(url);
  await page.waitForTimeout(2000);
  
  // Click "Load Demo" button
  console.log('Loading demo file...');
  const loadDemoBtn = page.locator('text=Load Demo');
  if (await loadDemoBtn.isVisible()) {
    await loadDemoBtn.click();
    await page.waitForTimeout(1000);
  }
  
  // Click Refactor button
  console.log('Starting analysis...');
  const startTime = Date.now();
  
  const refactorBtn = page.locator('text=Refactor with Gemini');
  await refactorBtn.click();
  
  // Wait for analysis to complete (button text changes back)
  await page.waitForFunction(() => {
    const btn = document.querySelector('button');
    return btn && btn.textContent.includes('Refactor');
  }, { timeout: 120000 });
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log(`\n✅ Analysis completed in ${duration.toFixed(1)} seconds`);
  
  await browser.close();
}

testSpeed().catch(e => console.error('Error:', e.message));
