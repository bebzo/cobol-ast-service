import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  // Login
  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill('embebangon@gmail.com');
  await page.locator('input[type="password"]').fill('EManu1231975@@');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForTimeout(3000);
  
  // Load demo & analyze
  await page.getByRole('button', { name: /load demo/i }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: /refactor with gemini/i }).click();
  await page.waitForTimeout(12000);
  
  // Go to Python tab and capture editor area only
  const pythonTab = await page.$('button:has-text("Python")');
  await pythonTab.click();
  await page.waitForTimeout(1500);
  
  // Find the Monaco editor and take a clip screenshot
  const editorElement = await page.$('.monaco-editor');
  if (editorElement) {
    await editorElement.screenshot({ path: '/workspace/editor-python-only.png' });
    console.log('✅ Python editor screenshot captured');
  }
  
  // Go to Tests tab
  const testsTab = await page.$('button:has-text("Tests")');
  await testsTab.click();
  await page.waitForTimeout(1500);
  
  const testsEditor = await page.$('.monaco-editor');
  if (testsEditor) {
    await testsEditor.screenshot({ path: '/workspace/editor-tests-only.png' });
    console.log('✅ Tests editor screenshot captured');
  }
  
  // Analyze the colors more deeply
  const colorAnalysis = await page.evaluate(() => {
    const editor = document.querySelector('.monaco-editor');
    if (!editor) return { error: 'No editor found' };
    
    const lines = editor.querySelectorAll('.view-line');
    const result = { lineCount: lines.length, colorsByLine: [] };
    
    lines.forEach((line, i) => {
      if (i < 5) { // First 5 lines
        const spans = line.querySelectorAll('span span');
        const lineColors = [];
        spans.forEach(span => {
          const color = window.getComputedStyle(span).color;
          const text = span.textContent?.trim();
          if (text && text.length > 0) {
            lineColors.push({ text: text.slice(0, 15), color });
          }
        });
        result.colorsByLine.push(lineColors);
      }
    });
    
    return result;
  });
  
  console.log('\n📊 Color analysis for Tests tab:');
  console.log('Lines found:', colorAnalysis.lineCount);
  colorAnalysis.colorsByLine?.forEach((line, i) => {
    console.log(`Line ${i + 1}:`);
    line.forEach(item => {
      console.log(`  "${item.text}" -> ${item.color}`);
    });
  });
  
  await browser.close();
})();
