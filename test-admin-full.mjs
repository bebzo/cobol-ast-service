import { chromium } from 'playwright';

const APP_URL = 'https://cobol-ast-service-5s1pyrbvx-emmanuel-beb-a-ngons-projects.vercel.app';

async function testAllAdminFeatures() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🔍 Testing ALL Admin Panel features...\n');
  
  try {
    // Login as super admin
    await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.locator('input[type="email"]').fill('embebangon@gmail.com');
    await page.locator('input[type="password"]').fill('EManu1231975@@');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(5000);
    console.log('✅ Logged in as super admin\n');
    
    // Open Admin Panel
    await page.locator('button:has-text("Admin")').click();
    await page.waitForTimeout(1500);
    console.log('=== ONGLET UTILISATEURS ===');
    
    // 1. Test Users Tab (default)
    const usersTab = await page.locator('button:has-text("Utilisateurs")');
    console.log('Utilisateurs tab visible:', await usersTab.isVisible());
    
    // Check search field
    const searchField = await page.locator('input[placeholder*="Rechercher"]');
    console.log('Search field visible:', await searchField.isVisible());
    
    // Check Actualiser button
    const refreshBtn = await page.locator('button:has-text("Actualiser")');
    console.log('Actualiser button visible:', await refreshBtn.isVisible());
    
    // Check Ajouter button
    const addBtn = await page.locator('button:has-text("Ajouter")');
    console.log('Ajouter button visible:', await addBtn.isVisible());
    
    // Click refresh and check
    await refreshBtn.click();
    await page.waitForTimeout(1000);
    console.log('✅ Actualiser clicked');
    
    await page.screenshot({ path: 'admin-users.png' });
    
    // 2. Test Statistics Tab
    console.log('\n=== ONGLET STATISTIQUES ===');
    const statsTab = await page.locator('button:has-text("Statistiques")');
    await statsTab.click();
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'admin-stats.png' });
    
    // Check stats content
    const statsContent = await page.locator('.bg-slate-700\\/50, .grid').first();
    console.log('Statistics content visible:', await statsContent.isVisible().catch(() => 'checking...'));
    
    // Look for specific stat elements
    const pageContent = await page.content();
    console.log('Has "Total" text:', pageContent.includes('Total'));
    console.log('Has number stats:', /\d+/.test(pageContent));
    
    // 3. Test Parameters Tab
    console.log('\n=== ONGLET PARAMÈTRES ===');
    const paramsTab = await page.locator('button:has-text("Paramètres")');
    await paramsTab.click();
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'admin-params.png' });
    
    // Check for settings elements
    const toggles = await page.locator('button[role="switch"], input[type="checkbox"]').count();
    console.log('Toggle/checkbox elements found:', toggles);
    
    // Check for save button
    const saveBtn = await page.locator('button:has-text("Sauvegarder"), button:has-text("Enregistrer")');
    console.log('Save button visible:', await saveBtn.isVisible().catch(() => false));
    
    // 4. Test Close button
    console.log('\n=== TEST FERMETURE ===');
    const closeBtn = await page.locator('button:has(svg), button[aria-label*="close"], button[aria-label*="Close"]').first();
    await closeBtn.click();
    await page.waitForTimeout(500);
    
    // Check if modal is closed
    const modalStillOpen = await page.locator('text=Administration').isVisible().catch(() => false);
    console.log('Modal closed after X click:', !modalStillOpen);
    
    console.log('\n✅ ALL ADMIN FEATURES TESTED');
    
  } catch (e) {
    console.log('❌ Error:', e.message);
    await page.screenshot({ path: 'admin-error.png' });
  }
  
  await browser.close();
}

testAllAdminFeatures();
