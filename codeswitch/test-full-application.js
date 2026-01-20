/**
 * Test Complet de l'Application CodeSwitch
 * Teste toutes les fonctionnalités principales de manière systématique
 */

const { chromium } = require('playwright');
const https = require('https');
const fs = require('fs');

const TEST_USER = {
  email: 'test@codeswitch.app',
  password: 'TestPassword123!@#'
};

const results = {
  auth: { passed: 0, failed: 0, tests: [] },
  dashboard: { passed: 0, failed: 0, tests: [] },
  analysis: { passed: 0, failed: 0, tests: [] },
  tabs: { passed: 0, failed: 0, tests: [] },
  api: { passed: 0, failed: 0, tests: [] },
  issues: []
};

function log(category, message, success = true) {
  const status = success ? '✅' : '❌';
  console.log(`${status} [${category}] ${message}`);
  if (success) {
    results[category].passed++;
  } else {
    results[category].failed++;
    results.issues.push({ category, message });
  }
  results[category].tests.push({ message, success });
}

async function testSupabaseConnection() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST 1: Connexion Supabase API');
  console.log('='.repeat(70));

  return new Promise((resolve) => {
    const options = {
      hostname: 'jcizfxniwgwfdmubapyb.supabase.co',
      path: '/auth/v1/token?grant_type=password',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'sb_secret_shFxZneKeDr497TLAbmn3Q_83Lw7zgZ'
      }
    };

    const postData = JSON.stringify({
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    options.headers['Content-Length'] = Buffer.byteLength(postData);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          log('api', 'Connexion Supabase: SUCCÈS');
          resolve(true);
        } else {
          log('api', `Connexion Supabase: ÉCHEC (${res.statusCode})`, false);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      log('api', `Connexion Supabase: ERREUR - ${e.message}`, false);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

async function testAuthentication(page) {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST 2: Authentication');
  console.log('='.repeat(70));

  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Vérifier que la page de login charge
  const loginContent = await page.content();
  if (loginContent.includes('CodeSwitch') || loginContent.includes('Sign In')) {
    log('auth', 'Page de login chargée');
  } else {
    log('auth', 'Page de login: NON CHARGÉE', false);
  }

  // Vérifier le bouton Demo Access
  const demoButton = page.locator('button:has-text("Demo Access")');
  if (await demoButton.count() > 0 && await demoButton.isVisible()) {
    log('auth', 'Bouton Demo Access présent et visible');
  } else {
    log('auth', 'Bouton Demo Access: ABSENT', false);
  }

  // Vérifier les boutons OAuth
  const googleButton = page.locator('button:has-text("Continue with Google")');
  const githubButton = page.locator('button:has-text("Continue with GitHub")');
  if (await googleButton.count() > 0) log('auth', 'Bouton Google OAuth présent');
  if (await githubButton.count() > 0) log('auth', 'Bouton GitHub OAuth présent');

  // Vérifier le formulaire email/password
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  if (await emailInput.count() > 0) log('auth', 'Champ email présent');
  else log('auth', 'Champ email: ABSENT', false);

  if (await passwordInput.count() > 0) log('auth', 'Champ password présent');
  else log('auth', 'Champ password: ABSENT', false);

  // Tenter la connexion
  if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
    await emailInput.fill(TEST_USER.email);
    await passwordInput.fill(TEST_USER.password);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      log('auth', 'Connexion réussie - redirection vers dashboard');
      return true;
    } else {
      // Vérifier le message d'erreur
      const errorMsg = await page.locator('[class*="error"], [class*="red"], .text-red').first().textContent().catch(() => '');
      if (errorMsg.includes('Email not confirmed') || errorMsg.includes('invalid login')) {
        log('auth', `Connexion: ${errorMsg}`, false);
        log('auth', 'Solution: Désactiver "Confirm email" dans Supabase Auth > Providers', false);
      } else {
        log('auth', `Connexion échouée - URL: ${currentUrl}`, false);
      }
      return false;
    }
  }

  return false;
}

async function testDashboard(page) {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST 3: Dashboard');
  console.log('='.repeat(70));

  // Naviguer directement au dashboard
  await page.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const dashboardContent = await page.content();

  // Vérifier si on est sur le dashboard ou redirigé vers login
  if (page.url().includes('/login')) {
    log('dashboard', 'Dashboard redirige vers login (auth requise)');
    log('dashboard', 'Impossible de tester le dashboard sans auth', false);
    return false;
  }

  // Vérifier les éléments du dashboard
  if (dashboardContent.includes('CodeSwitch') || dashboardContent.includes('Dashboard')) {
    log('dashboard', 'Dashboard chargé');
  } else {
    log('dashboard', 'Dashboard: NON CHARGÉ', false);
  }

  // Vérifier les onglets principaux
  const tabs = ['Code', 'Tests', 'Architecture', 'Insights', 'Chat', 'Config'];
  for (const tab of tabs) {
    const tabButton = page.locator(`button:has-text("${tab}")`);
    if (await tabButton.count() > 0) {
      log('dashboard', `Onglet "${tab}" présent`);
    }
  }

  return true;
}

async function testTabs(page) {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST 4: Onglets et Sous-onglets');
  console.log('='.repeat(70));

  if (!page.url().includes('/dashboard')) {
    log('tabs', 'Dashboard non accessible - test ignoré', false);
    return;
  }

  // Tester l'onglet Tests
  const testsTab = page.locator('button:has-text("Tests")').first();
  if (await testsTab.count() > 0) {
    await testsTab.click();
    await page.waitForTimeout(2000);
    log('tabs', 'Onglet Tests cliqué');

    // Vérifier les sous-onglets Tests
    const subTabs = ['Unit', 'Shadow', 'Production'];
    for (const subTab of subTabs) {
      const subTabButton = page.locator(`button:has-text("${subTab}")`);
      if (await subTabButton.count() > 0) {
        log('tabs', `Sous-onglet Tests > ${subTab} présent`);
      }
    }
  } else {
    log('tabs', 'Onglet Tests: ABSENT', false);
  }
}

async function testBackendAPI() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST 5: Backend APIs');
  console.log('='.repeat(70));

  // Tester l'API de base
  const apis = [
    { path: '/api/health', name: 'Health Check' },
    { path: '/api/readiness-analysis', name: 'Readiness Analysis', method: 'POST' }
  ];

  for (const api of apis) {
    await new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 3001,
        path: api.path,
        method: api.method || 'GET',
        headers: { 'Content-Type': 'application/json' }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            log('api', `${api.name}: SUCCÈS (${res.statusCode})`);
          } else if (res.statusCode === 401 || res.statusCode === 302) {
            log('api', `${api.name}: Auth requise (${res.statusCode})`);
          } else {
            log('api', `${api.name}: ${res.statusCode} - ${data.substring(0, 100)}`, false);
          }
          resolve();
        });
      });

      if (api.method === 'POST') {
        req.write('{"test": true}');
      }

      req.on('error', (e) => {
        log('api', `${api.name}: ERREUR - ${e.message}`, false);
        resolve();
      });

      req.end();
    });
  }
}

async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 TEST COMPLET DE L\'APPLICATION CODESWITCH');
  console.log('='.repeat(70));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // Exécuter tous les tests
    await testSupabaseConnection();
    const isAuthenticated = await testAuthentication(page);
    await testDashboard(page);
    await testTabs(page);
    await testBackendAPI();

    // Rapport final
    console.log('\n' + '='.repeat(70));
    console.log('📊 RAPPORT FINAL DES TESTS');
    console.log('='.repeat(70));

    for (const [category, data] of Object.entries(results)) {
      if (category === 'issues') continue;
      const total = data.passed + data.failed;
      const percentage = total > 0 ? Math.round((data.passed / total) * 100) : 0;
      const status = data.failed === 0 ? '✅' : (data.failed <= total * 0.3 ? '⚠️' : '❌');
      console.log(`${status} ${category.toUpperCase()}: ${data.passed}/${total} (${percentage}%)`);
    }

    if (results.issues.length > 0) {
      console.log('\n⚠️ PROBLÈMES IDENTIFIÉS:');
      results.issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. [${issue.category}] ${issue.message}`);
      });
    }

    if (consoleErrors.length > 0) {
      console.log('\n🚨 ERREURS CONSOLE:');
      consoleErrors.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.substring(0, 200)}`);
      });
    }

    console.log('\n' + '='.repeat(70));
    const totalPassed = Object.values(results).reduce((sum, r) => sum + (r.passed || 0), 0);
    const totalFailed = Object.values(results).reduce((sum, r) => sum + (r.failed || 0), 0);
    const overallStatus = totalFailed === 0 ? '✅ SUCCÈS' : (totalFailed <= totalPassed * 0.3 ? '⚠️ PARTIEL' : '❌ ÉCHEC');
    console.log(`🏁 STATUT GLOBAL: ${overallStatus} (${totalPassed} passed, ${totalFailed} failed)`);
    console.log('='.repeat(70));

    return results;

  } finally {
    await browser.close();
  }
}

runAllTests().catch(console.error);
