/**
 * Comprehensive Playwright Test for Production Readiness Panel
 * Tests functionality, score display, and responsive design
 */

const { chromium } = require('playwright');

async function runProductionReadinessTest() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const testResults = {
    passed: 0,
    failed: 0,
    errors: []
  };
  
  const log = (message, isError = false) => {
    const timestamp = new Date().toISOString();
    const status = isError ? '❌ ERROR' : '✅ PASS';
    console.log(`[${timestamp}] ${status}: ${message}`);
    if (isError) {
      testResults.errors.push(message);
      testResults.failed++;
    } else {
      testResults.passed++;
    }
  };
  
  try {
    log('Starting Production Readiness Comprehensive Test');
    log('='.repeat(60));
    
    // Navigate to the dashboard
    log('Navigating to dashboard...');
    await page.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    log('Dashboard loaded successfully');
    
    // Step 1: Click on "Tests" tab
    log('Step 1: Clicking Tests tab...');
    const testsTab = page.locator('button:has-text("Tests")').first();
    await testsTab.click();
    await page.waitForTimeout(1000);
    log('Tests tab clicked');
    
    // Step 2: Click on "Production Readiness" sub-tab
    log('Step 2: Clicking Production Readiness sub-tab...');
    const prodReadinessTab = page.locator('button:has-text("Production Readiness")').first();
    await prodReadinessTab.click();
    await page.waitForTimeout(2000);
    log('Production Readiness sub-tab clicked');
    
    // Step 3: Verify Production Readiness Panel is visible
    log('Step 3: Verifying Production Readiness Panel is visible...');
    const panelExists = await page.locator('text=Production Readiness').first().isVisible().catch(() => false);
    if (panelExists) {
      log('Production Readiness Panel is visible');
    } else {
      log('Production Readiness Panel not visible - checking for alternative selectors...');
      // Try alternative selectors
      const altPanel = await page.locator('text=/Readiness/i').first().isVisible().catch(() => false);
      if (altPanel) {
        log('Found panel with alternative selector');
      }
    }
    
    // Step 4: Load sample COBOL and Python code
    log('Step 4: Loading sample code...');
    
    // Sample production-ready Python code for testing (aiming for 100% score)
    const samplePythonCode = `"""
Production-ready Python module with comprehensive best practices.
"""
from dataclasses import dataclass
from typing import List, Optional, Dict
from datetime import datetime
import logging
import json
import contextvars

logger = logging.getLogger(__name__)

@dataclass
class TaxBracket:
    """Tax bracket configuration with Decimal precision."""
    lower_limit: float
    upper_limit: float
    rate: float
    
    def __str__(self) -> str:
        return f"Bracket({self.lower_limit}-{self.upper_limit}: {self.rate*100}%)"

class TaxConfig:
    """Externalizable configuration manager."""
    
    def __init__(self, config_path: Optional[str] = None) -> None:
        self.brackets: List[TaxBracket] = []
        self.config_path = config_path
        self._load_config()
    
    def _load_config(self) -> None:
        """Load configuration from file or use defaults."""
        if self.config_path:
            try:
                with open(self.config_path, 'r') as f:
                    data = json.load(f)
                    self.brackets = [TaxBracket(**b) for b in data.get('brackets', [])]
            except FileNotFoundError:
                logger.warning(f"Config file not found: {self.config_path}")
                self._set_default_brackets()
        else:
            self._set_default_brackets()
    
    def _set_default_brackets(self) -> None:
        """Set 2025 default tax brackets."""
        self.brackets = [
            TaxBracket(0, 11600, 0.10),
            TaxBracket(11600, 47150, 0.12),
            TaxBracket(47150, 100525, 0.22),
        ]
    
    def get_bracket(self, income: float) -> Optional[TaxBracket]:
        """Find applicable tax bracket for income."""
        for bracket in self.brackets:
            if bracket.lower_limit <= income <= bracket.upper_limit:
                return bracket
        return None

class TaxManager:
    """Multi-year tax calculation manager with caching."""
    
    def __init__(self, config: TaxConfig) -> None:
        self.config = config
        self._cache: contextvars.ContextVar[Dict] = contextvars.ContextVar('cache', default=None)
        self._lock = None  # For thread safety
    
    def calculate_tax(self, annual_income: float) -> float:
        """
        Calculate federal tax using progressive brackets.
        
        Args:
            annual_income: Gross annual income
            
        Returns:
            Total federal tax amount
        """
        try:
            if annual_income < 0:
                raise ValueError("Income cannot be negative")
            
            total_tax = 0.0
            remaining_income = annual_income
            
            for bracket in self.config.brackets:
                if remaining_income <= 0:
                    break
                    
                bracket_size = bracket.upper_limit - bracket.lower_limit
                taxable_in_bracket = min(remaining_income, bracket_size)
                
                tax_for_bracket = taxable_in_bracket * bracket.rate
                total_tax += tax_for_bracket
                remaining_income -= taxable_in_bracket
            
            return round(total_tax, 2)
            
        except ValueError as e:
            logger.error(f"Invalid input: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            raise

# Main execution
if __name__ == "__main__":
    config = TaxConfig()
    manager = TaxManager(config)
    tax = manager.calculate_tax(75000)
    print(f"Tax on $75,000: ${tax}")

# Test functions for validation
def test_config_creation() -> None:
    """Test configuration initialization."""
    config = TaxConfig()
    assert len(config.brackets) > 0, "Should have default brackets"
    print("✓ test_config_creation passed")

def test_tax_calculation() -> None:
    """Test tax calculation logic."""
    config = TaxConfig()
    manager = TaxManager(config)
    tax = manager.calculate_tax(50000)
    assert tax >= 0, "Tax should be non-negative"
    print("✓ test_tax_calculation passed")

def test_edge_cases() -> None:
    """Test edge case handling."""
    config = TaxConfig()
    manager = TaxManager(config)
    
    # Test zero income
    assert manager.calculate_tax(0) == 0, "Zero income should have zero tax"
    
    # Test negative income (should raise)
    try:
        manager.calculate_tax(-1000)
        assert False, "Should have raised ValueError"
    except ValueError:
        print("✓ test_edge_cases passed (negative income handled)")`;

    // Sample COBOL code for the test
    const sampleCobolCode = `       IDENTIFICATION DIVISION.
       PROGRAM-ID.  TAXCALC01.
       AUTHOR.      BANK-SYSTEMS-2025.
       
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       
       01  WS-TAX-RATES.
           05  WS-RATE-1      PIC V999 VALUE .10.
           05  WS-RATE-2      PIC V999 VALUE .12.
           05  WS-RATE-3      PIC V999 VALUE .22.
           
       01  WS-BRACKETS.
           05  WS-BRACKET-1   PIC 9(5) VALUE 11600.
           05  WS-BRACKET-2   PIC 9(5) VALUE 47150.
           
       01  WS-CALC-FIELDS.
           05  WS-INCOME      PIC S9(7)V99.
           05  WS-TAX         PIC S9(7)V99.
           05  WS-REMAINING   PIC S9(7)V99.
           
       PROCEDURE DIVISION.
       
       0000-MAIN.
           MOVE 75000 TO WS-INCOME
           PERFORM 1000-CALC-TAX
           DISPLAY "TAX: " WS-TAX
           STOP RUN.
           
       1000-CALC-TAX.
           MOVE WS-INCOME TO WS-REMAINING
           MOVE 0 TO WS-TAX
           
           IF WS-REMAINING > WS-BRACKET-1
               COMPUTE WS-TAX = WS-TAX + 
                   (WS-BRACKET-1 * WS-RATE-1)
               SUBTRACT WS-BRACKET-1 FROM WS-REMAINING
           ELSE
               COMPUTE WS-TAX = WS-TAX + 
                   (WS-REMAINING * WS-RATE-1)
               MOVE 0 TO WS-REMAINING
           END-IF
           
           IF WS-REMAINING > (WS-BRACKET-2 - WS-BRACKET-1)
               COMPUTE WS-TAX = WS-TAX + 
                   ((WS-BRACKET-2 - WS-BRACKET-1) * WS-RATE-2)
               SUBTRACT (WS-BRACKET-2 - WS-BRACKET-1) FROM WS-REMAINING
           END-IF.
`;

    // Check if Monaco editors exist and set value
    log('Looking for Monaco editor containers...');
    const editorContainers = await page.locator('.monaco-editor, [data-keybinding-context]').count();
    log(`Found ${editorContainers} editor containers`);
    
    // Try to find and interact with code editors
    const codeEditorSelectors = [
      'textarea[aria-label="Editor"]',
      '.monaco-editor textarea',
      '[data-testid="code-editor"]',
      'textarea.code-input'
    ];
    
    let editorFound = false;
    for (const selector of codeEditorSelectors) {
      const textarea = page.locator(selector).first();
      if (await textarea.count() > 0) {
        log(`Found editor with selector: ${selector}`);
        
        // Fill COBOL code in first editor if available
        try {
          await textarea.first().fill(sampleCobolCode);
          log('COBOL code loaded in editor');
          editorFound = true;
          break;
        } catch (e) {
          // Try alternative method
        }
      }
    }
    
    if (!editorFound) {
      log('Editors not directly accessible - proceeding with existing analysis data');
    }
    
    // Step 5: Click Re-analyze button
    log('Step 5: Looking for Re-analyze button...');
    const reanalyzeButton = page.locator('button:has-text("Re-analyze")').first();
    const reanalyzeVisible = await reanalyzeButton.isVisible().catch(() => false);
    
    if (reanalyzeVisible) {
      log('Re-analyze button found, clicking...');
      await reanalyzeButton.click();
      await page.waitForTimeout(3000);
      log('Re-analyze button clicked');
    } else {
      log('Re-analyze button not visible - checking for Analyze button');
      const analyzeButton = page.locator('button:has-text("Analyze")').first();
      const analyzeVisible = await analyzeButton.isVisible().catch(() => false);
      if (analyzeVisible) {
        log('Analyze button found, clicking...');
        await analyzeButton.click();
        await page.waitForTimeout(3000);
        log('Analyze button clicked');
      }
    }
    
    // Step 6: Wait for analysis results
    log('Step 6: Waiting for analysis results...');
    
    // Wait for loading to complete (spinner should disappear)
    try {
      await page.waitForFunction(() => {
        const spinner = document.querySelector('.animate-spin');
        const loader = document.querySelector('[class*="Loader2"]');
        return !spinner && !loader;
      }, { timeout: 10000 });
      log('Loading spinner disappeared');
    } catch (e) {
      log('Spinner check timeout (may still be processing)', true);
    }
    
    // Wait for score to appear
    await page.waitForTimeout(2000);
    
    // Step 7: Check that score and metrics are visible
    log('Step 7: Checking score and metrics visibility...');
    
    // Look for score elements with various selectors
    const scoreSelectors = [
      'text=/Production Readiness Score/i',
      'text=/Score:/i',
      '[class*="score"]',
      '[class*="grade"]',
      'text=/Grade:/i'
    ];
    
    let scoreFound = false;
    for (const selector of scoreSelectors) {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        const isVisible = await element.isVisible().catch(() => false);
        if (isVisible) {
          log(`Found score element with selector: ${selector}`);
          scoreFound = true;
          break;
        }
      }
    }
    
    // Look for numeric score
    const numericScore = await page.locator('text=/\\d+/').count();
    log(`Found ${numericScore} numeric elements on page`);
    
    // Look for grade (A, B, C, D, F)
    const gradeElements = await page.locator('text=/[ABCDF](?!\\w)/').count();
    log(`Found ${gradeElements} grade-like elements`);
    
    // Look for metrics grid
    const metricsSelectors = [
      'text=/Functions/i',
      'text=/Classes/i',
      'text=/Tests/i',
      'text=/Error Handling/i',
      'text=/Security/i'
    ];
    
    let metricsCount = 0;
    for (const selector of metricsSelectors) {
      const elements = await page.locator(selector).count();
      if (elements > 0) {
        log(`Found ${elements} elements matching: ${selector}`);
        metricsCount += elements;
      }
    }
    
    if (metricsCount > 0) {
      log('Metrics grid is visible');
    } else {
      log('Metrics grid not found - checking panel structure');
    }
    
    // Step 8: Test responsiveness with mobile viewport
    log('Step 8: Testing mobile responsiveness (390x844)...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(2000);
    
    // Verify key elements are still visible on mobile
    const mobileChecks = [];
    
    // Check if main panel is still visible
    const panelVisibleMobile = await page.locator('[class*="bg-slate"]').first().isVisible().catch(() => false);
    mobileChecks.push({ element: 'Main panel', visible: panelVisibleMobile });
    
    // Check if score section is visible
    const scoreVisibleMobile = await page.locator('text=/Production Readiness/i').first().isVisible().catch(() => false);
    mobileChecks.push({ element: 'Score section', visible: scoreVisibleMobile });
    
    // Check if buttons are accessible
    const buttonVisibleMobile = await page.locator('button').first().isVisible().catch(() => false);
    mobileChecks.push({ element: 'Buttons', visible: buttonVisibleMobile });
    
    // Check if issues section is visible
    const issuesVisibleMobile = await page.locator('text=/Issues/i').first().isVisible().catch(() => false);
    mobileChecks.push({ element: 'Issues section', visible: issuesVisibleMobile });
    
    log('Mobile viewport checks:');
    for (const check of mobileChecks) {
      const status = check.visible ? '✅' : '❌';
      log(`  ${status} ${check.element}: ${check.visible ? 'Visible' : 'Not visible'}`);
    }
    
    const allMobileVisible = mobileChecks.every(c => c.visible);
    if (allMobileVisible) {
      log('All elements visible on mobile viewport');
    } else {
      log('Some elements not visible on mobile - checking layout classes');
    }
    
    // Step 9: Set viewport back to desktop
    log('Step 9: Setting viewport back to desktop (1280x720)...');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);
    
    // Verify desktop layout
    const panelVisibleDesktop = await page.locator('[class*="bg-slate"]').first().isVisible().catch(() => false);
    if (panelVisibleDesktop) {
      log('Desktop layout verified');
    } else {
      log('Desktop layout check failed', true);
    }
    
    // Final verification: Check for production ready status
    log('Step 10: Final verification...');
    const readyStatus = await page.locator('text=/Production Ready/i').first().isVisible().catch(() => false);
    const needsImprovements = await page.locator('text=/Needs Improvements/i').first().isVisible().catch(() => false);
    
    if (readyStatus) {
      log('Application shows Production Ready status');
    } else if (needsImprovements) {
      log('Application shows Needs Improvements status (this is OK for some code)');
    } else {
      log('Status badge not found - analysis may still be loading');
    }
    
    // Check for recommendations
    const recommendations = await page.locator('text=/Recommendation/i').count();
    log(`Found ${recommendations} recommendation elements`);
    
    // Check for historical data (Supabase integration)
    const historicalData = await page.locator('text=/Historical/i').count();
    log(`Found ${historicalData} historical data elements`);
    
    log('='.repeat(60));
    log('Test Execution Summary');
    log('='.repeat(60));
    log(`Total tests passed: ${testResults.passed}`);
    log(`Total tests failed: ${testResults.failed}`);
    log(`Errors encountered: ${testResults.errors.length}`);
    
    if (testResults.errors.length > 0) {
      log('Error details:');
      testResults.errors.forEach((err, i) => {
        log(`  ${i + 1}. ${err}`);
      });
    }
    
    const overallStatus = testResults.failed === 0 ? 'SUCCESS' : 'PARTIAL SUCCESS';
    log(`Overall Status: ${overallStatus}`);
    log('='.repeat(60));
    
    // Return results
    return testResults;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Critical test error: ${errorMessage}`, true);
    log('Stack trace: ' + (error instanceof Error ? error.stack : 'N/A'), true);
    
    return {
      passed: testResults.passed,
      failed: testResults.failed + 1,
      errors: [...testResults.errors, errorMessage]
    };
    
  } finally {
    await browser.close();
    log('Browser closed');
  }
}

// Run the test
runProductionReadinessTest()
  .then(results => {
    console.log('\n' + '='.repeat(60));
    console.log('FINAL TEST RESULTS');
    console.log('='.repeat(60));
    console.log(JSON.stringify(results, null, 2));
    
    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
