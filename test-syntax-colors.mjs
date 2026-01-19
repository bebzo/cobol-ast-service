import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  // Login
  console.log('📍 Logging in...');
  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill('embebangon@gmail.com');
  await page.locator('input[type="password"]').fill('EManu1231975@@');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForTimeout(3000);
  
  // Load demo
  console.log('📦 Loading demo...');
  const demoBtn = page.getByRole('button', { name: /load demo/i });
  await demoBtn.click();
  await page.waitForTimeout(1000);
  
  // Start analysis
  console.log('🚀 Starting analysis...');
  const refactorBtn = page.getByRole('button', { name: /refactor with gemini/i });
  await refactorBtn.click();
  
  // Wait for completion
  console.log('⏳ Waiting for analysis...');
  await page.waitForTimeout(15000);
  
  // Click Python tab
  console.log('\n🐍 Checking Python tab colors...');
  const pythonTab = await page.$('button:has-text("Python")');
  await pythonTab.click();
  await page.waitForTimeout(2000);
  
  // Get colors from Monaco editor
  const colors = await page.evaluate(() => {
    const tokens = document.querySelectorAll('.monaco-editor .view-line span span');
    const colorSet = new Set();
    const colorSamples = [];
    
    tokens.forEach((token, i) => {
      if (i < 50) { // First 50 tokens
        const style = window.getComputedStyle(token);
        const color = style.color;
        colorSet.add(color);
        if (colorSamples.length < 10) {
          colorSamples.push({ text: token.textContent?.slice(0,20), color });
        }
      }
    });
    
    return {
      uniqueColors: Array.from(colorSet),
      samples: colorSamples
    };
  });
  
  console.log('Unique colors found:', colors.uniqueColors.length);
  colors.uniqueColors.forEach(c => console.log('  -', c));
  console.log('\nSamples:');
  colors.samples.forEach(s => console.log(`  "${s.text}" -> ${s.color}`));
  
  // Check if all green
  const allGreen = colors.uniqueColors.every(c => 
    c.includes('0, 128, 0') || c.includes('green') || c.includes('74, 222, 128')
  );
  
  if (allGreen && colors.uniqueColors.length === 1) {
    console.log('\n❌ WARNING: All code is GREEN - syntax highlighting may not be working!');
  } else if (colors.uniqueColors.length > 2) {
    console.log('\n✅ Multiple colors detected - syntax highlighting is working!');
  }
  
  // Screenshot zoomed on the editor
  await page.screenshot({ path: '/workspace/python-syntax-zoom.png', fullPage: true });
  
  // Now check Tests tab
  console.log('\n🧪 Checking Tests tab colors...');
  const testsTab = await page.$('button:has-text("Tests")');
  await testsTab.click();
  await page.waitForTimeout(2000);
  
  const testColors = await page.evaluate(() => {
    const tokens = document.querySelectorAll('.monaco-editor .view-line span span');
    const colorSet = new Set();
    tokens.forEach((token, i) => {
      if (i < 50) {
        const style = window.getComputedStyle(token);
        colorSet.add(style.color);
      }
    });
    return Array.from(colorSet);
  });
  
  console.log('Tests tab unique colors:', testColors.length);
  testColors.forEach(c => console.log('  -', c));
  
  await page.screenshot({ path: '/workspace/tests-syntax-zoom.png', fullPage: true });
  
  await browser.close();
  console.log('\n✅ Color check complete');
})();
