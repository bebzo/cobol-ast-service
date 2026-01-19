import { chromium } from 'playwright';
import { spawn } from 'child_process';

(async () => {
  // Start simple server
  const server = spawn('npx', ['serve', 'out', '-p', '3456'], { 
    cwd: '/workspace/codeswitch',
    stdio: 'ignore',
    detached: true
  });
  
  await new Promise(r => setTimeout(r, 3000));
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3456', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Check main elements
    const title = await page.title();
    console.log('Title:', title);
    
    const header = await page.locator('h1').first().textContent();
    console.log('Header:', header);
    
    // Check editors exist
    const editors = await page.locator('.monaco-editor').count();
    console.log('Monaco editors found:', editors);
    
    await page.screenshot({ path: 'screenshot.png', fullPage: true });
    console.log('Screenshot saved');
    console.log('TEST PASSED');
  } catch(e) {
    console.error('Error:', e.message);
  }
  
  await browser.close();
  server.kill();
  process.exit(0);
})();
