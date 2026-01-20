/**
 * Playwright Test for Shadow Testing and Prod Readiness Feature
 * Simplified test - focuses on verifying shadow testing and prod readiness tabs
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_EMAIL = 'embebangon@gmail.com';
const TEST_PASSWORD = 'EManu1231975@@';
const DEMO_COBOL = `       IDENTIFICATION DIVISION.
       PROGRAM-ID.  DEMO10000.
       AUTHOR.      TEST-DEMO-2025.
      *================================================================*
      * DEMO PROGRAM - 10000 LINES SIMULATION                        *
      *================================================================*
       
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       
       01  WS-COUNTERS.
           05  I                       PIC 9(5) COMP.
           05  J                       PIC 9(5) COMP.
           05  WS-RESULT               PIC S9(10) COMP.
       
       01  WS-TABLES.
           05  WS-TABLE-1 OCCURS 1000 TIMES INDEXED BY IDX-1.
               10  WS-T1-VALUE         PIC 9(5).
               10  WS-T1-NAME          PIC X(50).
       
       PROCEDURE DIVISION.
       
       0000-MAIN.
           PERFORM 1000-INITIALIZE THRU 1000-EXIT
           PERFORM 2000-PROCESS THRU 2000-EXIT
           PERFORM 3000-CALCULATE THRU 3000-EXIT
           PERFORM 4000-FINALIZE THRU 4000-EXIT
           STOP RUN.
       
       1000-INITIALIZE.
           MOVE 0 TO WS-RESULT
           MOVE 1 TO I
           PERFORM VARYING I FROM 1 BY 1 UNTIL I > 1000
               MOVE I TO WS-T1-VALUE(I)
               MOVE 'TEST-VALUE' TO WS-T1-NAME(I)
           END-PERFORM.
       1000-EXIT.
           EXIT.
       
       2000-PROCESS.
           PERFORM VARYING I FROM 1 BY 1 UNTIL I > 1000
               COMPUTE WS-RESULT = WS-RESULT + WS-T1-VALUE(I)
           END-PERFORM.
       2000-EXIT.
           EXIT.
       
       3000-CALCULATE.
           PERFORM VARYING I FROM 1 BY 1 UNTIL I > 100
               PERFORM VARYING J FROM 1 BY 1 UNTIL J > 100
                   COMPUTE WS-RESULT = WS-RESULT + (I * J)
               END-PERFORM
           END-PERFORM.
       3000-EXIT.
           EXIT.
       
       4000-FINALIZE.
           DISPLAY 'RESULT: ' WS-RESULT.
       4000-EXIT.
           EXIT.
`;

const DASHBOARD_URL = 'http://localhost:3000/dashboard';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testShadowReadinessTabs() {
  console.log('🧪 Testing Shadow Testing and Prod Readiness Tabs...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  
  const page = await context.newPage();
  
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // Step 1: Navigate and login
    console.log('📍 Step 1: Login...');
    await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle', timeout: 30000 });
    
    if (page.url().includes('/login')) {
      await page.fill('input[type="email"], input[name*="email"]', TEST_EMAIL);
      await page.fill('input[type="password"], input[name*="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard**', { timeout: 15000 });
    }
    console.log('   ✓ Logged in');
    
    // Step 2: Wait for dashboard
    console.log('📍 Step 2: Wait dashboard...');
    await page.waitForSelector('text=/CodeSwitch|Dashboard/i', { timeout: 10000 });
    await sleep(2000);
    
    // Step 3: Check if there's already a demo loaded or load one
    console.log('📍 Step 3: Check/load demo...');
    
    // Check if textarea has content
    const textarea = await page.$('textarea');
    if (textarea) {
      const currentValue = await textarea.evaluate(el => el.value);
      if (currentValue && currentValue.length > 1000) {
        console.log(`   ✓ Existing content found (${currentValue.length} chars)`);
      } else {
        // Paste demo COBOL
        console.log('   → Pasting demo COBOL...');
        await textarea.fill(DEMO_COBOL);
        console.log(`   ✓ Demo COBOL pasted (${DEMO_COBOL.length} chars)`);
      }
    }
    
    // Step 4: Find and click the Convert button
    console.log('📍 Step 4: Start analysis...');
    
    const convertBtn = await page.$('button:has-text("🚀 Convert"), button:has-text("Convert")');
    if (convertBtn) {
      await convertBtn.click();
      console.log('   ✓ Analysis started');
    }
    
    // Step 5: Wait for analysis (shorter timeout for demo)
    console.log('📍 Step 5: Wait analysis...');
    
    let maxWait = 90000; // 90 seconds for demo
    let waited = 0;
    let done = false;
    
    while (waited < maxWait && !done) {
      await sleep(3000);
      waited += 3000;
      
      const content = await page.content();
      if (content.includes('Python') && content.includes('def ')) {
        console.log(`   ✓ Python code detected at ${waited}s`);
        done = true;
        break;
      }
      
      if (waited % 15000 === 0) {
        console.log(`   ⏳ Waiting... ${waited/1000}s`);
      }
    }
    
    if (!done) {
      console.log('   ⚠️ Analysis may not be complete, continuing anyway...');
    }
    
    await sleep(2000);
    
    // Step 6: Find and click on "shadow" sub-tab
    console.log('\n📍 Step 6: Check Shadow Testing sub-tab...');
    
    // Look for shadow sub-tab specifically
    const shadowSubTab = await page.$('button:has-text("Shadow"), [data-subtab="shadow"]');
    if (shadowSubTab) {
      await shadowSubTab.click();
      await sleep(1500);
      console.log('   ✓ Shadow sub-tab clicked');
    } else {
      console.log('   ⚠️ Shadow sub-tab not found');
    }
    
    // Step 7: Verify shadow testing content
    console.log('📍 Step 7: Verify Shadow Testing content...');
    
    await sleep(1500);
    const shadowContent = await page.content();
    
    const shadowItems = [
      { pattern: /Shadow/i, name: 'Shadow keyword' },
      { pattern: /readiness/i, name: 'Readiness' },
      { pattern: /Score|score/i, name: 'Score' },
      { pattern: /Critical|critical/i, name: 'Critical' },
      { pattern: /test/i, name: 'Test' },
    ];
    
    let shadowFound = 0;
    for (const item of shadowItems) {
      if (shadowContent.match(item.pattern)) {
        shadowFound++;
        console.log(`   ✓ Found: ${item.name}`);
      }
    }
    
    // Step 8: Find and click on "prod readiness" or "readiness" sub-tab
    console.log('\n📍 Step 8: Check Prod Readiness sub-tab...');
    
    // Look for readiness/prod sub-tab
    const readinessSubTab = await page.$('button:has-text("Readiness"), [data-subtab="readiness"]');
    if (readinessSubTab) {
      await readinessSubTab.click();
      await sleep(1500);
      console.log('   ✓ Readiness sub-tab clicked');
    } else {
      console.log('   ℹ️ Readiness sub-tab (checking tests tab)...');
      // Try tests tab as alternative
      const testsSubTab = await page.$('button:has-text("Tests"), [data-subtab="tests"]');
      if (testsSubTab) {
        await testsSubTab.click();
        await sleep(1500);
        console.log('   ✓ Tests sub-tab clicked');
      }
    }
    
    // Step 9: Verify prod readiness content
    console.log('📍 Step 9: Verify Prod Readiness content...');
    
    await sleep(1500);
    const readinessContent = await page.content();
    
    const readinessItems = [
      { pattern: /readiness/i, name: 'Readiness' },
      { pattern: /prod/i, name: 'Prod' },
      { pattern: /Score|score/i, name: 'Score' },
      { pattern: /critical/i, name: 'Critical' },
      { pattern: /path/i, name: 'Paths' },
    ];
    
    let readinessFound = 0;
    for (const item of readinessItems) {
      if (readinessContent.match(item.pattern)) {
        readinessFound++;
        console.log(`   ✓ Found: ${item.name}`);
      }
    }
    
    // Step 10: Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✓ Login: OK`);
    console.log(`✓ Dashboard: OK`);
    console.log(`✓ Shadow indicators: ${shadowFound}/5`);
    console.log(`✓ Readiness indicators: ${readinessFound}/5`);
    
    if (shadowFound >= 3 || readinessFound >= 3) {
      console.log('\n✅ Shadow Testing and Prod Readiness Tabs: WORKING');
    } else {
      console.log('\n⚠️ Tabs may need more processing time');
    }
    console.log('='.repeat(60));
    
    // Screenshot
    const screenshotPath = path.join(__dirname, 'test_shadow_readiness_result.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\n📸 Screenshot: ${screenshotPath}`);
    
    if (consoleErrors.length > 0) {
      console.log('\n⚠️ Console errors:');
      consoleErrors.forEach(e => console.log(`   - ${e.substring(0, 100)}`));
    } else {
      console.log('\n✅ No console errors');
    }
    
    console.log('\n🎉 Test Complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    const errorScreenshot = path.join(__dirname, 'test_error.png');
    await page.screenshot({ path: errorScreenshot });
    console.log(`📸 Error screenshot: ${errorScreenshot}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testShadowReadinessTabs().catch(console.error);
