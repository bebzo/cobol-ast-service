const { chromium } = require('playwright');

(async () => {
  console.log('='.repeat(70));
  console.log('VÉRIFICATION AVEC AUTHENTIFICATION');
  console.log('='.repeat(70));
  console.log();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console and network
  const consoleLogs = [];
  const networkLogs = [];

  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('response', response => {
    if (response.url().includes('test') || response.url().includes('transpile')) {
      networkLogs.push(`${response.status()} ${response.url()}`);
    }
  });

  try {
    console.log('1. Navigation vers l\'application...');
    await page.goto('https://cobol-ast-service.vercel.app/', {
      waitUntil: 'networkidle',
      timeout: 90000
    });
    console.log('   ✓ Page chargée');

    // Check if login is required
    await page.waitForTimeout(2000);

    // Look for login elements
    const loginButton = await page.$('button:has-text("Sign in"), a:has-text("Login"), button:has-text("Login")');
    if (loginButton) {
      console.log();
      console.log('2. Tentative d\'authentification avec embabangon@gmail.com...');

      // Click login
      await loginButton.click();
      await page.waitForTimeout(2000);

      // Look for email input
      const emailInput = await page.$('input[type="email"], input[name="email"]');
      if (emailInput) {
        await emailInput.fill('embabangon@gmail.com');
        console.log('   ✓ Email saisi');

        // Look for continue/submit button
        const submitButton = await page.$('button[type="submit"], button:has-text("Continue"), button:has-text("Sign in")');
        if (submitButton) {
          await submitButton.click();
          console.log('   ✓ Bouton cliqué');

          // Wait for auth to complete or redirect
          await page.waitForTimeout(5000);
        }
      }
    }

    console.log();
    console.log('3. Vérification de l\'état de connexion...');

    // Check if logged in
    const pageContent = await page.content();
    const isLoggedIn = pageContent.includes('embebangon') ||
                       pageContent.includes('Logout') ||
                       pageContent.includes('Sign out');

    if (isLoggedIn) {
      console.log('   ✓ Utilisateur connecté!');
    } else {
      console.log('   ⚠ Session non vérifiable (peut être en cache)');
    }

    console.log();
    console.log('4. Analyse du Test Oracle...');

    // Check for errors
    const hasLiteralError = pageContent.includes('unterminated string literal');
    const hasDecimalError = pageContent.includes("decimal.Decimal object is not callable");
    const hasCompilationError = pageContent.includes('Failed to compile Python code');
    const hasTestsPassed = pageContent.includes('Tests Passed');
    const hasTestsFailed = pageContent.includes('Tests Failed');

    console.log(`   ${hasLiteralError ? '⚠' : '✓'} unterminated string literal: ${hasLiteralError ? 'PRÉSENT' : 'ABSENT'}`);
    console.log(`   ${hasDecimalError ? '⚠' : '✓'} Decimal error: ${hasDecimalError ? 'PRÉSENT' : 'ABSENT'}`);
    console.log(`   ${hasCompilationError ? '⚠' : '✓'} Compilation error: ${hasCompilationError ? 'PRÉSENT' : 'ABSENT'}`);
    console.log(`   ${hasTestsPassed ? '✓' : '⚠'} Tests Passed: ${hasTestsPassed ? 'OUI' : 'NON'}`);
    console.log(`   ${hasTestsFailed ? '⚠' : '✓'} Tests Failed: ${hasTestsFailed ? 'OUI' : 'NON'}`);

    console.log();
    console.log('5. Statistiques des tests...');

    // Extract test counts
    const generatedMatch = pageContent.match(/(\d+)\s*Tests\s*Generated/i);
    const passedMatch = pageContent.match(/(\d+)\s*Tests\s*Passed/i);
    const failedMatch = pageContent.match(/(\d+)\s*Tests\s*Failed/i);
    const passRateMatch = pageContent.match(/(\d+)%\s*Pass\s*Rate/i);

    console.log(`   Generated: ${generatedMatch ? generatedMatch[1] : 'N/A'}`);
    console.log(`   Passed: ${passedMatch ? passedMatch[1] : 'N/A'}`);
    console.log(`   Failed: ${failedMatch ? failedMatch[1] : 'N/A'}`);
    console.log(`   Pass Rate: ${passRateMatch ? passRateMatch[1] + '%' : 'N/A'}`);

    console.log();
    console.log('6. Logs réseau...');
    for (const log of networkLogs.slice(0, 5)) {
      console.log(`   ${log}`);
    }

    console.log();
    console.log('='.repeat(70));
    console.log('RÉSULTAT FINAL');
    console.log('='.repeat(70));

    if (hasLiteralError || hasDecimalError || hasCompilationError) {
      console.log('⚠ LE FIX N\'EST PAS ENCORE ACTIF');
      console.log('');
      console.log('Les erreurs suivantes sont présentes:');
      if (hasLiteralError) console.log('  - unterminated string literal');
      if (hasDecimalError) console.log('  - decimal.Decimal object is not callable');
      if (hasCompilationError) console.log('  - Failed to compile Python code');
      console.log('');
      console.log('Causes possibles:');
      console.log('  1. Le déploiement n\'est pas encore complet');
      console.log('  2. Le cache navigateur contient l\'ancien code');
      console.log('  3. Le Test Oracle utilise encore Gemini');
      console.log('');
      console.log('Actions recommandées:');
      console.log('  1. Vider le cache: Ctrl+Shift+R (hard refresh)');
      console.log('  2. Attendre 2-3 minutes');
      console.log('  3. Uploader à nouveau le fichier COBOL');
    } else if (hasTestsPassed && !hasTestsFailed) {
      console.log('✓ LE FIX EST ACTIF!');
      console.log('');
      console.log('Le Test Oracle déterministe (v9.0) fonctionne correctement.');
      console.log('Les tests passent sans erreur.');
    } else {
      console.log('? ÉTAT INDÉTERMINÉ');
      console.log('');
      console.log('Les tests n\'ont pas pu être analysés automatiquement.');
      console.log('Veuillez vérifier manuellement dans l\'interface.');
    }

    console.log('='.repeat(70));

  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    await browser.close();
  }
})();
