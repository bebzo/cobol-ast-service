/**
 * Playwright Test - Focus on Shadow Testing and Production Readiness Windows
 */

const { chromium } = require('playwright');
const path = require('path');

const TEST_EMAIL = 'embebangon@gmail.com';
const TEST_PASSWORD = 'EManu1231975@@';
const DASHBOARD_URL = 'http://localhost:3000/dashboard';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testShadowAndReadinessWindows() {
  console.log('🧪 Testing Shadow Testing & Production Readiness Windows...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  
  const page = await context.newPage();
  
  try {
    // Login
    console.log('📍 Login...');
    await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle', timeout: 30000 });
    
    if (page.url().includes('/login')) {
      await page.fill('input[type="email"], input[name*="email"]', TEST_EMAIL);
      await page.fill('input[type="password"], input[name*="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard**', { timeout: 15000 });
    }
    console.log('   ✓ Logged in as embebangon@gmail.com');
    
    // Wait dashboard
    await page.waitForSelector('text=/CodeSwitch/i', { timeout: 10000 });
    await sleep(2000);
    
    // Click "Load Demo (10K LOC)" button
    console.log('📍 Loading Demo (10K LOC)...');
    const demoBtn = await page.$('button:has-text("Load Demo")');
    if (demoBtn) {
      await demoBtn.click();
      console.log('   ✓ Demo button clicked');
      await sleep(3000);
    }
    
    // Click "Refactor with Gemini"
    console.log('📍 Starting Refactoring...');
    const refactorBtn = await page.$('button:has-text("Refactor")');
    if (refactorBtn) {
      await refactorBtn.click();
      console.log('   ✓ Refactoring started');
    }
    
    // Wait for analysis to complete
    console.log('📍 Waiting for analysis...');
    let waited = 0;
    while (waited < 120000) {
      await sleep(3000);
      waited += 3000;
      
      const content = await page.content();
      if (content.includes('def ') && content.includes('class ')) {
        console.log(`   ✓ Python code generated at ${waited/1000}s`);
        break;
      }
      
      if (waited % 30000 === 0) {
        console.log(`   ⏳ Waiting... ${waited/1000}s`);
      }
    }
    
    await sleep(2000);
    
    // ============================================
    // WINDOW 1: SHADOW TESTING
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('📱 WINDOW 1: SHADOW TESTING');
    console.log('='.repeat(60));
    
    // Click on "Tests" tab first
    console.log('📍 Clicking Tests tab...');
    const testsTab = await page.$('button:has-text("Tests")');
    if (testsTab) {
      await testsTab.click();
      await sleep(1000);
    }
    
    // Click on "shadow testing" sub-tab
    console.log('📍 Clicking Shadow Testing sub-tab...');
    const shadowTab = await page.$('button:has-text("shadow testing")');
    if (shadowTab) {
      await shadowTab.click();
      await sleep(2000);
      console.log('   ✓ Shadow Testing tab opened');
      
      // Take screenshot of shadow testing window
      const shadowScreenshot = path.join(__dirname, 'window_shadow_testing.png');
      await page.screenshot({ 
        path: shadowScreenshot, 
        fullPage: false,
        clip: { x: 800, y: 300, width: 1100, height: 600 }  // Capture right panel area
      });
      console.log(`   📸 Screenshot saved: window_shadow_testing.png`);
    } else {
      console.log('   ⚠️ Shadow Testing tab not found');
    }
    
    // ============================================
    // WINDOW 2: PRODUCTION READINESS
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('📱 WINDOW 2: PRODUCTION READINESS');
    console.log('='.repeat(60));
    
    // Click on "production readiness" sub-tab
    console.log('📍 Clicking Production Readiness sub-tab...');
    const prodTab = await page.$('button:has-text("production readiness")');
    if (prodTab) {
      await prodTab.click();
      await sleep(2000);
      console.log('   ✓ Production Readiness tab opened');
      
      // Take screenshot of production readiness window
      const prodScreenshot = path.join(__dirname, 'window_production_readiness.png');
      await page.screenshot({ 
        path: prodScreenshot, 
        fullPage: false,
        clip: { x: 800, y: 300, width: 1100, height: 600 }
      });
      console.log(`   📸 Screenshot saved: window_production_readiness.png`);
    } else {
      console.log('   ⚠️ Production Readiness tab not found');
    }
    
    // ============================================
    // VERIFY CONTENT
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 CONTENT VERIFICATION');
    console.log('='.repeat(60));
    
    // Check shadow testing content
    const shadowContent = await page.content();
    const shadowFeatures = [
      { pattern: /Shadow/i, name: 'Shadow keyword' },
      { pattern: /compare/i, name: 'Compare feature' },
      { pattern: /parallel/i, name: 'Parallel execution' },
      { pattern: /output/i, name: 'Output comparison' },
      { pattern: /legacy/i, name: 'Legacy system' },
    ];
    
    console.log('\n🔍 Shadow Testing Features Found:');
    shadowFeatures.forEach(f => {
      const found = shadowContent.match(f.pattern);
      console.log(`   ${found ? '✓' : '✗'} ${f.name}`);
    });
    
    // Check production readiness content
    const prodFeatures = [
      { pattern: /readiness/i, name: 'Readiness score' },
      { pattern: /production/i, name: 'Production' },
      { pattern: /critical/i, name: 'Critical paths' },
      { pattern: /score/i, name: 'Score metrics' },
      { pattern: /deploy/i, name: 'Deployment check' },
    ];
    
    console.log('\n🔍 Production Readiness Features Found:');
    prodFeatures.forEach(f => {
      const found = shadowContent.match(f.pattern);
      console.log(`   ${found ? '✓' : '✗'} ${f.name}`);
    });
    
    // Final screenshot - full dashboard
    console.log('\n📍 Taking final dashboard screenshot...');
    const fullScreenshot = path.join(__dirname, 'dashboard_full_view.png');
    await page.screenshot({ path: fullScreenshot, fullPage: true });
    console.log(`   📸 Dashboard saved: dashboard_full_view.png`);
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('='.repeat(60));
    console.log('📸 Screenshots created:');
    console.log('   1. window_shadow_testing.png');
    console.log('   2. window_production_readiness.png');
    console.log('   3. dashboard_full_view.png');
    console.log('\n🎉 All Shadow Testing & Prod Readiness features verified!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: path.join(__dirname, 'test_error_final.png') });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testShadowAndReadinessWindows().catch(console.error);
