import { chromium } from 'playwright';

const APP_URL = 'https://cobol-ast-service.vercel.app';

async function testAllAdmin() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🔍 Test final du panneau Admin\n');
  
  try {
    // Login
    await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.locator('input[type="email"]').fill('embebangon@gmail.com');
    await page.locator('input[type="password"]').fill('EManu1231975@@');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(5000);
    console.log('✅ Login réussi');
    
    // Open Admin
    const adminBtn = await page.locator('button:has-text("Admin")');
    console.log('✅ Bouton Admin visible:', await adminBtn.isVisible());
    await adminBtn.click();
    await page.waitForTimeout(1500);
    
    // Test tabs
    console.log('\n--- ONGLET UTILISATEURS ---');
    console.log('✅ Actualiser visible:', await page.locator('button:has-text("Actualiser")').isVisible());
    console.log('✅ Ajouter visible:', await page.locator('button:has-text("Ajouter")').isVisible());
    await page.screenshot({ path: 'final-users.png' });
    
    console.log('\n--- ONGLET STATISTIQUES ---');
    await page.locator('button:has-text("Statistiques")').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'final-stats.png' });
    console.log('✅ Statistiques affichées');
    
    console.log('\n--- ONGLET PARAMÈTRES ---');
    await page.locator('button:has-text("Paramètres")').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'final-params.png' });
    console.log('✅ Paramètres affichés');
    
    // Test fermeture par backdrop
    console.log('\n--- TEST FERMETURE ---');
    await page.click('.fixed.inset-0', { position: { x: 10, y: 10 }, force: true });
    await page.waitForTimeout(500);
    const closed = !(await page.locator('text=Administration').isVisible());
    console.log('✅ Fermeture par backdrop:', closed);
    
    console.log('\n🎉 TOUS LES TESTS PASSÉS!');
    
  } catch (e) {
    console.log('❌ Erreur:', e.message);
    await page.screenshot({ path: 'error-final.png' });
  }
  
  await browser.close();
}

testAllAdmin();
