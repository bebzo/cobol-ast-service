import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

page.on('console', msg => {
  const t = msg.text();
  if (t.includes('SSE') || t.includes('python_code') || t.includes('Complete')) {
    console.log('BROWSER:', t.substring(0, 150));
  }
});

console.log('1. Chargement dashboard...');
await page.goto('http://localhost:3000/dashboard?test=1', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);

console.log('2. Chargement Demo...');
await page.locator('button:has-text("Load Demo")').first().click();
await page.waitForTimeout(2000);

// Vérifier COBOL
const cobolText = await page.locator('textarea').first().inputValue();
console.log('   COBOL:', cobolText.length, 'chars');

console.log('3. Lancement analyse...');
await page.locator('button:has-text("Refactor"), button:has-text("Gemini")').first().click();

// Attendre completion - max 3 minutes
console.log('4. Attente completion...');
let completed = false;
for (let i = 0; i < 90; i++) {
  await page.waitForTimeout(2000);
  
  // Vérifier si loading spinner disparu ET pas de message "Generating"
  const isLoading = await page.locator('text=/Generating|Analyzing|Parsing|Processing/i').first().isVisible().catch(() => false);
  const hasComplete = await page.locator('text=/Complete|Terminée/i').first().isVisible().catch(() => false);
  const hasGreen = await page.locator('.bg-green-500, .bg-green-600').first().isVisible().catch(() => false);
  
  if (!isLoading && (hasComplete || hasGreen)) {
    console.log('   ✅ Analyse terminée à', i*2, 's');
    completed = true;
    break;
  }
  
  if (i % 15 === 0) {
    const progress = await page.locator('text=/\\d+%/').first().textContent().catch(() => '?');
    console.log('   ⏳', i*2, 's -', progress);
  }
}

if (!completed) {
  console.log('   ⚠️ Timeout - prenant screenshot quand même');
}

await page.waitForTimeout(3000);
await page.screenshot({ path: 'screenshots/local-complete.png', fullPage: true });

// Cliquer Python tab
console.log('5. Vérification Python...');
await page.locator('button:has-text("Python")').first().click();
await page.waitForTimeout(2000);

// Lire le contenu
const pythonPre = await page.locator('pre').first().textContent().catch(() => '');
console.log('   Python chars:', pythonPre.length);
console.log('   Python lines:', pythonPre.split('\n').length);

if (pythonPre.length > 10000) {
  console.log('   ✅ Code Python présent!');
  console.log('   Début:', pythonPre.substring(0, 80).replace(/\n/g, ' '));
} else if (pythonPre.length > 100) {
  console.log('   ⚠️ Code Python partiel');
} else {
  console.log('   ❌ Code Python manquant');
}

await page.screenshot({ path: 'screenshots/local-python.png', fullPage: true });
await browser.close();

console.log('\n=== TEST TERMINÉ ===');
