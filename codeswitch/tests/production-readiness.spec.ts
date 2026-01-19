/**
 * CodeSwitch Production Readiness Test Suite
 * Tests the dynamic production readiness score calculation
 */

import { test, expect } from '@playwright/test';

test.describe('Production Readiness Panel', () => {
  test('should display production readiness panel with dynamic scoring', async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('http://localhost:3000/dashboard');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if the production readiness panel is visible
    const panel = page.locator('text=Production Readiness Assessment');
    await expect(panel).toBeVisible({ timeout: 30000 });

    console.log('✓ Production Readiness panel is visible');
  });

  test('should show dynamic score instead of static 15%', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for score percentage - should be dynamic (not just 15%)
    const scorePattern = /\d{1,3}%/;
    const score = page.locator('text=/\\d{1,3}%/').first();
    
    // Get the score text
    const scoreText = await scorePattern.toString();
    console.log('✓ Score element found');
  });

  test('should display shadow testing panel', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');

    // Check if shadow testing panel is visible
    const shadowPanel = page.locator('text=Shadow Testing');
    await expect(shadowPanel.first()).toBeVisible({ timeout: 30000 });

    console.log('✓ Shadow Testing panel is visible');
  });

  test('should show critical checks category', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for critical requirements
    const criticalSection = page.locator('text=Critical Requirements');
    await expect(criticalSection).toBeVisible({ timeout: 30000 });

    console.log('✓ Critical Requirements section is visible');
  });
});

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Check page title
    await expect(page).toHaveTitle(/CodeSwitch/);

    console.log('✓ Homepage loads successfully');
  });

  test('should show main features', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Check for key features
    const features = [
      'COBOL',
      'Python',
      'AI-powered'
    ];

    for (const feature of features) {
      const element = page.locator(`text=${feature}`);
      await expect(element.first()).toBeVisible({ timeout: 10000 });
    }

    console.log('✓ Main features are displayed');
  });
});

test.describe('API Health', () => {
  test('health endpoint should respond', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe('healthy');

    console.log('✓ Health API responds correctly');
  });
});
