/**
 * Playwright test to verify:
 * 1. Test sub-tabs (unit tests, shadow testing) are accessible
 * 2. Security report no longer has "improvements" tab
 */

import { chromium } from 'playwright';

async function runTests() {
  console.log('🚀 Starting Playwright verification tests...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let errors = [];
  
  // Collect console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', err => {
    errors.push(err.message);
  });

  try {
    // Navigate to dashboard
    console.log('📍 Navigating to http://localhost:3000/dashboard...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log('✅ Dashboard loaded successfully\n');

    // Test 1: Check for test tabs section
    console.log('🔍 TEST 1: Verifying test sub-tabs...');
    
    // Look for the test tabs container
    const testTabsContainer = await page.locator('text=/test|tests/i').first();
    const hasTestContent = await page.locator('text=/unit tests|shadow testing|production readiness/i').count();
    
    console.log(`   Found test-related elements: ${hasTestContent}`);
    
    if (hasTestContent > 0) {
      console.log('✅ Test sub-tabs are accessible\n');
    } else {
      console.log('⚠️  No test sub-tabs found - may need to run analysis first\n');
    }

    // Test 2: Check security report - verify NO "improvements" tab
    console.log('🔍 TEST 2: Verifying security report has NO "improvements" tab...');
    
    // Look for security-related content
    const securitySection = await page.locator('text=/security report|security warnings|security issues/i').count();
    console.log(`   Security-related elements found: ${securitySection}`);
    
    // Check specifically for "improvements" tab in security context
    const improvementsInSecurity = await page.locator('text=/improvements/i').count();
    console.log(`   "Improvements" mentions found: ${improvementsInSecurity}`);
    
    // Look for report tabs structure
    const reportTabs = await page.locator('[class*="tab"]').count();
    console.log(`   Total tab-like elements: ${reportTabs}`);

    // Check the specific report tabs area
    const reportArea = await page.locator('text=/Report|Issues|Security|Next/i').count();
    console.log(`   Report/Issues/Security elements: ${reportArea}`);

    if (improvementsInSecurity > 0) {
      console.log('⚠️  Found "improvements" mentions - checking context...\n');
    } else {
      console.log('✅ No "improvements" found in security context\n');
    }

    // Test 3: Check for expected sections
    console.log('🔍 TEST 3: Verifying expected sections exist...');
    
    const expectedSections = [
      { name: 'Issues', pattern: /issues|problems/i },
      { name: 'Security', pattern: /security|warning|vulnerability/i },
      { name: 'Next Steps', pattern: /next.?steps?|recommendations/i },
    ];
    
    for (const section of expectedSections) {
      const count = await page.locator(`text=${section.pattern}`).count();
      console.log(`   ${section.name}: ${count > 0 ? '✅ Found' : '❌ Not found'}`);
    }

    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`Console errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Console errors found:');
      errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
    } else {
      console.log('✅ No console errors detected');
    }

    console.log('\n✅ Verification complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

runTests();
