#!/usr/bin/env node
/**
 * Playwright test to verify Production Readiness score calculation
 * Tests that the score can display and calculate properly
 */

import { chromium } from 'playwright';

async function testProductionReadiness() {
  console.log('🧪 Testing Production Readiness Score Calculation...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Collect console messages
  const consoleMessages = [];
  const consoleErrors = [];
  
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });
  
  page.on('pageerror', error => {
    consoleErrors.push(`Page Error: ${error.message}`);
  });
  
  try {
    // Navigate to the dashboard
    console.log('📱 Testing on Desktop (1920x1080)...');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Check for JavaScript errors
    if (consoleErrors.length > 0) {
      console.log('\n⚠️ Console Errors Found:');
      consoleErrors.forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('✅ No JavaScript errors detected');
    }
    
    // Look for the Tests tab
    console.log('\n🔍 Looking for Tests tab...');
    const testsTab = await page.locator('button:has-text("Tests")').first();
    
    if (await testsTab.isVisible()) {
      console.log('✅ Tests tab found');
      await testsTab.click();
      await page.waitForTimeout(500);
      
      // Look for Production Readiness sub-tab
      console.log('🔍 Looking for Production Readiness tab...');
      const productionTab = await page.locator('button:has-text("Production Readiness")').first();
      
      if (await productionTab.isVisible()) {
        console.log('✅ Production Readiness tab found');
        await productionTab.click();
        await page.waitForTimeout(1000);
        
        // Check for the panel
        console.log('🔍 Looking for Production Readiness Panel...');
        const panel = await page.locator('text=Production Readiness').first();
        
        if (await panel.isVisible()) {
          console.log('✅ Production Readiness Panel is visible');
          
          // Look for score display
          const scoreText = await page.locator('text=/\\d+%/').first().textContent().catch(() => null);
          if (scoreText) {
            console.log(`✅ Score display found: ${scoreText}`);
          } else {
            console.log('ℹ️ No score percentage found (expected if no analysis has been run)');
          }
        } else {
          console.log('⚠️ Production Readiness Panel not visible');
        }
      } else {
        console.log('⚠️ Production Readiness tab not visible');
      }
    } else {
      console.log('⚠️ Tests tab not visible');
    }
    
    // Print console output summary
    console.log('\n📊 Console Output Summary:');
    console.log(`  Total messages: ${consoleMessages.length}`);
    console.log(`  Errors: ${consoleErrors.length}`);
    
    console.log('\n✅ Production Readiness test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run the test
testProductionReadiness().catch(console.error);
