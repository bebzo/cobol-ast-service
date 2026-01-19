import { chromium } from 'playwright';

const BASE_URL = 'https://ejsrr0247eon.space.minimax.io';

async function testDashboard() {
  console.log('🚀 Testing dashboard directly...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  try {
    // Go directly to dashboard
    console.log('\n📋 1. Loading dashboard...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: 'screenshots/dashboard-initial.png' });
    console.log('   ✅ Dashboard loaded');
    
    // Check what's on the page (login required?)
    const pageContent = await page.content();
    if (pageContent.includes('login') || pageContent.includes('Sign in') || pageContent.includes('Connexion')) {
      console.log('   ⚠️ Login page detected, trying demo button...');
      
      // Look for demo/try button
      const demoButton = await page.locator('button:has-text("Demo"), button:has-text("Essayer"), button:has-text("Try")').first();
      if (await demoButton.isVisible()) {
        await demoButton.click();
        await page.waitForTimeout(3000);
      }
    }
    
    await page.screenshot({ path: 'screenshots/dashboard-ready.png' });
    
    // Look for COBOL textarea
    console.log('\n📋 2. Finding COBOL editor...');
    const textarea = await page.locator('textarea').first();
    const isVisible = await textarea.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      console.log('   ✅ COBOL textarea found');
      
      // Load sample code
      const sampleCode = `       IDENTIFICATION DIVISION.
       PROGRAM-ID. HELLO.
       PROCEDURE DIVISION.
           DISPLAY "TEST".
           STOP RUN.`;
      
      await textarea.fill(sampleCode);
      console.log('   ✅ Sample code loaded');
      await page.screenshot({ path: 'screenshots/cobol-filled.png' });
      
      // Find analyze button
      console.log('\n📋 3. Starting analysis...');
      const analyzeBtn = await page.locator('button').filter({ hasText: /Analyser|Analyze/i }).first();
      if (await analyzeBtn.isVisible()) {
        await analyzeBtn.click();
        console.log('   ⏳ Analysis started...');
        
        // Wait for analysis with progress updates
        for (let i = 0; i < 20; i++) {
          await page.waitForTimeout(3000);
          await page.screenshot({ path: `screenshots/analysis-step-${i}.png` });
          
          // Check for completion
          const status = await page.locator('text=/Terminée|Complete|Succès/i').first().isVisible().catch(() => false);
          if (status) {
            console.log('   ✅ Analysis complete!');
            break;
          }
          
          // Check for green indicator
          const greenBadge = await page.locator('[class*="bg-green"]').first().isVisible().catch(() => false);
          if (greenBadge) {
            console.log('   ✅ Green badge detected - analysis complete');
            break;
          }
          
          console.log(`   ⏳ Waiting... (${(i+1)*3}s)`);
        }
        
        // Click Python tab
        console.log('\n📋 4. Checking Python output...');
        const pythonTab = await page.locator('button:has-text("Python")').first();
        if (await pythonTab.isVisible()) {
          await pythonTab.click();
          await page.waitForTimeout(2000);
          console.log('   ✅ Python tab clicked');
        }
        
        await page.screenshot({ path: 'screenshots/python-output.png', fullPage: true });
        
        // Check for Python code in <pre> tag
        const preElements = await page.locator('pre').all();
        console.log(`   Found ${preElements.length} <pre> elements`);
        
        for (let i = 0; i < preElements.length; i++) {
          const text = await preElements[i].textContent();
          if (text && text.length > 50) {
            console.log(`\n   📝 Pre #${i+1} content (first 300 chars):`);
            console.log('   ' + '-'.repeat(50));
            console.log('   ' + text.substring(0, 300).split('\n').join('\n   '));
            console.log('   ' + '-'.repeat(50));
            
            if (text.includes('def ') || text.includes('class ') || text.includes('print') || text.includes('DISPLAY')) {
              console.log('\n   ✅ PYTHON CODE FOUND!');
            }
          }
        }
        
        // Check for "Loading..." text
        const loadingText = await page.locator('text=/Loading|Chargement/i').first().isVisible().catch(() => false);
        if (loadingText) {
          console.log('\n   ❌ STILL SHOWING LOADING STATE');
        }
        
        // Check for "No code" text
        const noCode = await page.locator('text=/No code|Pas de code|No Python/i').first().isVisible().catch(() => false);
        if (noCode) {
          console.log('\n   ❌ SHOWING "NO CODE" MESSAGE');
        }
      }
    } else {
      console.log('   ❌ Textarea not found');
      console.log('   Page title:', await page.title());
      await page.screenshot({ path: 'screenshots/no-textarea.png', fullPage: true });
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: 'screenshots/error.png' });
  } finally {
    await browser.close();
    console.log('\n✅ Test completed - check screenshots folder');
  }
}

testDashboard();
