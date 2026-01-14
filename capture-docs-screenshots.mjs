import { chromium } from 'playwright';

const BASE_URL = 'https://cobol-ast-service.vercel.app';

async function captureScreenshots() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('📸 Starting screenshot capture for documentation...\n');

  try {
    // 1. Go to dashboard directly (for demo purposes)
    console.log('1. Loading dashboard...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'public/docs/doc-01-dashboard-empty.png', fullPage: false });
    console.log('   ✓ Empty dashboard captured');

    // 2. Load demo COBOL
    console.log('2. Loading demo COBOL code...');
    const loadDemoBtn = page.locator('button:has-text("Load Demo")');
    if (await loadDemoBtn.isVisible()) {
      await loadDemoBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'public/docs/doc-02-cobol-loaded.png', fullPage: false });
      console.log('   ✓ COBOL loaded captured');
    }

    // 3. Click Refactor
    console.log('3. Starting analysis...');
    const refactorBtn = page.locator('button:has-text("Refactor")');
    if (await refactorBtn.isVisible()) {
      await refactorBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'public/docs/doc-03-analyzing.png', fullPage: false });
      console.log('   ✓ Analyzing state captured');

      // Wait for analysis to complete
      console.log('   Waiting for analysis to complete...');
      await page.waitForTimeout(30000);
    }

    // 4. Python tab
    console.log('4. Capturing Python result...');
    await page.screenshot({ path: 'public/docs/doc-04-python-full.png', fullPage: false });
    console.log('   ✓ Python result captured');

    // 5. Tests tab
    console.log('5. Capturing Tests tab...');
    const testsTab = page.locator('button:has-text("Tests")');
    if (await testsTab.isVisible()) {
      await testsTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'public/docs/doc-05-tests.png', fullPage: false });
      console.log('   ✓ Tests tab captured');
    }

    // 6. Diff tab
    console.log('6. Capturing Diff tab...');
    const diffTab = page.locator('button:has-text("Diff")');
    if (await diffTab.isVisible()) {
      await diffTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'public/docs/doc-06-diff.png', fullPage: false });
      console.log('   ✓ Diff tab captured');
    }

    // 7. Architecture tab
    console.log('7. Capturing Architecture tab...');
    const archTab = page.locator('button:has-text("Architecture")');
    if (await archTab.isVisible()) {
      await archTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'public/docs/doc-07-architecture.png', fullPage: false });
      console.log('   ✓ Architecture tab captured');
    }

    // 8. Modules tab
    console.log('8. Capturing Modules tab...');
    const modulesTab = page.locator('button:has-text("Modules")');
    if (await modulesTab.isVisible()) {
      await modulesTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'public/docs/doc-08-modules.png', fullPage: false });
      console.log('   ✓ Modules tab captured');
    }

    // 9. DDD tab
    console.log('9. Capturing DDD tab...');
    const dddTab = page.locator('button:has-text("DDD")');
    if (await dddTab.isVisible()) {
      await dddTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'public/docs/doc-09-ddd.png', fullPage: false });
      console.log('   ✓ DDD tab captured');
    }

    // 10. Impact tab
    console.log('10. Capturing Impact tab...');
    const impactTab = page.locator('button:has-text("Impact")');
    if (await impactTab.isVisible()) {
      await impactTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'public/docs/doc-10-impact.png', fullPage: false });
      console.log('   ✓ Impact tab captured');
    }

    // 11. Report tab
    console.log('11. Capturing Report tab...');
    const reportTab = page.locator('button:has-text("Report")');
    if (await reportTab.isVisible()) {
      await reportTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'public/docs/doc-11-report.png', fullPage: false });
      console.log('   ✓ Report tab captured');
    }

    // 12. Dashboard tab
    console.log('12. Capturing Dashboard metrics...');
    const dashTab = page.locator('button:has-text("Dashboard")');
    if (await dashTab.isVisible()) {
      await dashTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'public/docs/doc-12-dashboard-metrics.png', fullPage: false });
      console.log('   ✓ Dashboard metrics captured');
    }

    // 13. Call Graph tab
    console.log('13. Capturing Call Graph...');
    const callGraphTab = page.locator('button:has-text("Call Graph")');
    if (await callGraphTab.isVisible()) {
      await callGraphTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'public/docs/doc-13-callgraph.png', fullPage: false });
      console.log('   ✓ Call Graph captured');
    }

    // 14. Full page scroll
    console.log('14. Capturing full interface...');
    await page.locator('button:has-text("Python")').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'public/docs/doc-14-full-interface.png', fullPage: true });
    console.log('   ✓ Full interface captured');

    console.log('\n✅ All screenshots captured successfully!');

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'public/docs/error-state.png', fullPage: false });
  }

  await browser.close();
}

captureScreenshots();
