const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleMessages = [];
  const networkErrors = [];
  
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.message}`);
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });

  try {
    console.log('=== TEST DE CONNEXION AVEC Playwright ===\n');
    console.log('URL de test: http://localhost:3000/login');
    console.log('Email: embebengon@gmail.com\n');
    
    console.log('1. Navigation vers la page de connexion...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('   ✓ Page chargée\n');

    console.log('2. Vérification de la page de connexion...');
    const title = await page.title();
    console.log(`   Titre de la page: ${title}`);
    
    // Check if login form exists
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const submitButton = await page.$('button[type="submit"]');
    
    console.log(`   - Champ email: ${emailInput ? '✓' : '✗'}`);
    console.log(`   - Champ mot de passe: ${passwordInput ? '✓' : '✗'}`);
    console.log(`   - Bouton submit: ${submitButton ? '✓' : '✗'}\n`);

    console.log('3. Remplissage du formulaire...');
    await page.fill('input[type="email"]', 'embebengon@gmail.com');
    await page.fill('input[type="password"]', 'EManu1231975@@');
    console.log('   ✓ Formulaire rempli\n');

    console.log('4. Soumission du formulaire...');
    await page.click('button[type="submit"]');
    
    console.log('5. Attente de la réponse (5 secondes)...\n');
    await page.waitForTimeout(5000);

    // Check current URL
    const currentUrl = page.url();
    console.log('=== RÉSULTATS ===');
    console.log(`URL finale: ${currentUrl}\n`);

    // Check for errors
    const errors = consoleMessages.filter(m => m.type === 'error');
    const criticalErrors = errors.filter(e => 
      !e.text.includes('RSC payload') && 
      !e.text.includes('Failed to fetch')
    );

    if (currentUrl.includes('/dashboard')) {
      console.log('✅ SUCCÈS: Connexion réussie! Redirigé vers le dashboard');
      console.log('\nL\'utilisateur peut maintenant:');
      console.log('  - Voir son tableau de bord');
      console.log('  - Utiliser l\'application CodeSwitch');
      console.log('  - Converter du code COBOL en Python');
    } else if (currentUrl.includes('/login')) {
      console.log('⚠️仍在页面登录 - 可能存在认证问题');
      
      if (criticalErrors.length > 0) {
        console.log('\nErreurs critiques:');
        criticalErrors.forEach(e => console.log(`  - ${e.text.substring(0, 100)}`));
      }
    } else {
      console.log(`⚠️ 重定向到: ${currentUrl}`);
    }

    // Console summary
    console.log('\n=== RÉSUMÉ DE LA CONSOLE ===');
    if (errors.length > 0) {
      console.log(`Total erreurs: ${errors.length}`);
      console.log('Erreurs critiques:', criticalErrors.length);
      if (criticalErrors.length > 0) {
        console.log('\nDétails des erreurs critiques:');
        criticalErrors.forEach((e, i) => {
          console.log(`  ${i + 1}. ${e.text.substring(0, 80)}`);
        });
      }
    } else {
      console.log('✓ Aucune erreur de console');
    }

  } catch (error) {
    console.error('\n❌ Erreur de test:', error.message);
  } finally {
    await browser.close();
    console.log('\n=== TEST TERMINÉ ===');
  }
})();
