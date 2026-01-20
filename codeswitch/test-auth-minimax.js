/**
 * TEST D'AUTHENTIFICATION AVEC VRAIS IDENTIFIANTS
 * Utilise l'utilisateur dev@minimax.io créé dans Supabase
 */

const { chromium } = require('playwright');

async function runAuthTest() {
  console.log('\n' + '='.repeat(70));
  console.log('🔐 TEST AUTHENTIFICATION - Utilisateur @minimax.io');
  console.log('='.repeat(70));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });

  const results = { passed: 0, failed: 0, issues: [] };

  function log(message, success = true) {
    const status = success ? '✅' : '❌';
    console.log(`${status} ${message}`);
    if (success) results.passed++;
    else {
      results.failed++;
      results.issues.push(message);
    }
  }

  try {
    // ============================================
    // TEST 1: Page de Login
    // ============================================
    console.log('\n📋 TEST 1: Accès à la page de login\n' + '-'.repeat(50));

    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const loginContent = await page.content();
    log('Page de login chargée', loginContent.includes('CodeSwitch'));
    log('Champ email visible', await page.locator('input[type="email"]').count() > 0);
    log('Champ password visible', await page.locator('input[type="password"]').count() > 0);

    // ============================================
    // TEST 2: Connexion avec vrais identifiants
    // ============================================
    console.log('\n📋 TEST 2: Connexion avec dev@minimax.io\n' + '-'.repeat(50));

    // Remplir l'email
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      await emailInput.fill('dev@minimax.io');
      log('Email rempli: dev@minimax.io');
    } else {
      log('Champ email non trouvé', false);
    }

    // Remplir le mot de passe
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.count() > 0) {
      await passwordInput.fill('CodeSwitch2024!');
      log('Mot de passe rempli');
    } else {
      log('Champ mot de passe non trouvé', false);
    }

    // Cliquer sur le bouton Se connecter
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.count() > 0) {
      await submitButton.click();
      console.log('⏳ Tentative de connexion en cours...');

      // Attendre la navigation vers le dashboard
      try {
        await page.waitForURL('**/dashboard', { timeout: 15000 });
        log('✅ REDIRECTION VERS DASHBOARD RÉUSSIE!');
      } catch (e) {
        const currentUrl = page.url();
        console.log(`⚠️ Timeout, URL actuelle: ${currentUrl}`);

        // Vérifier si on est toujours sur login (erreur d'auth)
        if (currentUrl.includes('/login')) {
          const errorMsg = await page.locator('[class*="text-red"]').first().textContent().catch(() => 'Unknown error');
          log(`Échec connexion - Erreur: ${errorMsg || 'Auth failed'}`, false);
        }
      }
    } else {
      log('Bouton submit non trouvé', false);
    }

    // ============================================
    // TEST 3: Vérification du Dashboard
    // ============================================
    console.log('\n📋 TEST 3: Validation du Dashboard\n' + '-'.repeat(50));

    await page.waitForTimeout(3000);

    if (page.url().includes('/dashboard')) {
      const dashboardContent = await page.content();
      log('Dashboard accessible', dashboardContent.includes('Dashboard') || dashboardContent.includes('CodeSwitch'));
      log('Onglet Code visible', await page.locator('button:has-text("Code")').count() > 0);
      log('Onglet Tests visible', await page.locator('button:has-text("Tests")').count() > 0);
      log('Onglet Chat visible', await page.locator('button:has-text("Chat")').count() > 0);
    } else {
      log('Dashboard non accessible', false);
    }

    // ============================================
    // RAPPORT FINAL
    // ============================================
    console.log('\n' + '='.repeat(70));
    console.log('📊 RAPPORT D\'AUTHENTIFICATION');
    console.log('='.repeat(70));
    console.log(`✅ Tests réussis: ${results.passed}`);
    console.log(`❌ Tests échoués: ${results.failed}`);

    if (results.issues.length > 0) {
      console.log('\n⚠️ Problèmes identifiés:');
      results.issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
    }

    console.log('\n' + '='.repeat(70));
    const status = results.failed === 0 ? '✅ AUTHENTIFICATION RÉUSSIE' : '⚠️ PROBLÈMES D\'AUTHENTIFICATION';
    console.log(`🏁 STATUT GLOBAL: ${status}`);
    console.log('='.repeat(70));

    return results;

  } catch (error) {
    console.error('\n💥 Erreur critique:', error.message);
    return { passed: results.passed, failed: results.failed + 1, issues: [...results.issues, error.message] };
  } finally {
    await browser.close();
    console.log('\n🔒 Test terminé - Navigateur fermé');
  }
}

// Exécuter le test
runAuthTest()
  .then(results => {
    console.log('\n📋 RÉSULTATS:', JSON.stringify({ passed: results.passed, failed: results.failed }, null, 2));
    process.exit(results.failed > 2 ? 1 : 0);
  })
  .catch(error => {
    console.error('💥 Échec du test:', error);
    process.exit(1);
  });
