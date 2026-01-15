import { chromium } from 'playwright';
import * as fs from 'fs';

const BASE_URL = 'https://cobol-ast-service.vercel.app';

// Read COBOL file
const cobolCode = fs.readFileSync('/workspace/user_input_files/4.deepseek_cobol_20260114_3fcf3b assurances.txt', 'utf8');

async function testFullAnalysis() {
  console.log('🚀 Testing Full CodeSwitch v8.5 Analysis Pipeline\n');
  console.log('='.repeat(70));
  console.log(`📄 COBOL File: Ultra-Assurances System (${cobolCode.split('\n').length} lines)`);
  console.log('='.repeat(70));
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Test 1: Direct API Call to /api/analyse
    console.log('\n📍 Test 1: API Analyse Call');
    console.log('   Sending COBOL code to API...');
    
    const startTime = Date.now();
    const response = await page.request.post(`${BASE_URL}/api/analyse`, {
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ 
        cobolCode: cobolCode.substring(0, 15000), // First 15K chars for speed
        filename: 'ULTRA-ASSURANCES-SYSTEM.cbl'
      }),
      timeout: 120000 // 2 minutes
    });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`   ✅ Response received in ${elapsed}s (Status: ${response.status()})`);
    
    if (response.status() !== 200) {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${errorText.substring(0, 200)}`);
      return;
    }
    
    const data = await response.json();
    
    // Display results
    console.log('\n' + '='.repeat(70));
    console.log('📊 ANALYSIS RESULTS');
    console.log('='.repeat(70));
    
    // Summary
    console.log(`\n📝 Summary: ${data.summary || 'N/A'}`);
    
    // Business Context
    console.log('\n🏢 Business Context:');
    if (data.business_context) {
      console.log(`   Domain: ${data.business_context.domain || 'N/A'}`);
      console.log(`   Detected Year: ${data.business_context.detected_year || 'N/A'}`);
      console.log(`   Regulatory: ${data.business_context.regulatory_context || 'N/A'}`);
      console.log(`   Is Obsolete: ${data.business_context.is_obsolete || false}`);
    }
    
    // Migration Score
    console.log('\n📈 Migration Score:');
    if (data.migration_score) {
      console.log(`   Complexity: ${data.migration_score.complexity || 'N/A'}`);
      console.log(`   Risk Level: ${data.migration_score.risk_level || data.migration_score.risk || 'N/A'}`);
      console.log(`   Effort: ${data.migration_score.estimated_effort || data.migration_score.effort || 'N/A'}`);
      console.log(`   Confidence: ${data.migration_score.confidence || 'N/A'}`);
    }
    
    // Python Code
    console.log('\n🐍 Python Code:');
    if (data.python_code) {
      const lines = data.python_code.split('\n').length;
      console.log(`   ✅ Generated: ${lines} lines`);
      console.log(`   Valid: ${data.code_valid === true ? '✅ Yes' : data.code_valid === false ? '❌ No' : '⚠️ Unknown'}`);
      // Show first 5 lines
      const preview = data.python_code.split('\n').slice(0, 5).join('\n');
      console.log(`   Preview:\n${preview.split('\n').map(l => '      ' + l).join('\n')}`);
    } else {
      console.log('   ❌ No Python code generated');
    }
    
    // Unit Tests
    console.log('\n🧪 Unit Tests:');
    const tests = data.unit_tests || data.tests;
    if (tests) {
      const testStr = Array.isArray(tests) ? tests.join('\n') : tests;
      const testCount = (testStr.match(/def test_/g) || []).length;
      console.log(`   ✅ Generated: ${testCount} tests`);
    } else {
      console.log('   ⚠️ No tests generated');
    }
    
    // Issues & Improvements
    console.log('\n⚠️ Issues:');
    if (data.issues && data.issues.length > 0) {
      data.issues.slice(0, 5).forEach((issue, i) => {
        console.log(`   ${i+1}. ${typeof issue === 'string' ? issue : JSON.stringify(issue)}`);
      });
      if (data.issues.length > 5) console.log(`   ... and ${data.issues.length - 5} more`);
    } else {
      console.log('   ✅ No critical issues');
    }
    
    console.log('\n💡 Improvements:');
    if (data.improvements && data.improvements.length > 0) {
      data.improvements.slice(0, 5).forEach((imp, i) => {
        console.log(`   ${i+1}. ${typeof imp === 'string' ? imp : JSON.stringify(imp)}`);
      });
    }
    
    // Security Warnings
    console.log('\n🔒 Security Warnings:');
    if (data.security_warnings && data.security_warnings.length > 0) {
      data.security_warnings.slice(0, 3).forEach((warn, i) => {
        if (typeof warn === 'object') {
          console.log(`   ${i+1}. [${warn.severity}] ${warn.title}: ${warn.description?.substring(0, 60)}...`);
        } else {
          console.log(`   ${i+1}. ${warn}`);
        }
      });
    } else {
      console.log('   ✅ No security warnings');
    }
    
    // v8.5 Features - Shadow Testing
    console.log('\n' + '='.repeat(70));
    console.log('🆕 v8.5 FEATURES');
    console.log('='.repeat(70));
    
    console.log('\n🔄 Shadow Testing Plan:');
    if (data.shadow_testing_plan) {
      console.log(`   ✅ PRESENT`);
      console.log(`   Readiness Score: ${data.shadow_testing_plan.readiness_score || 'N/A'}%`);
      console.log(`   Readiness Status: ${data.shadow_testing_plan.readiness_status || 'N/A'}`);
      console.log(`   Estimated Duration: ${data.shadow_testing_plan.estimated_duration || 'N/A'}`);
      
      if (data.shadow_testing_plan.critical_paths) {
        console.log(`   Critical Paths: ${data.shadow_testing_plan.critical_paths.length}`);
        data.shadow_testing_plan.critical_paths.slice(0, 3).forEach((path, i) => {
          console.log(`      ${i+1}. [${path.priority}] ${path.category}: ${path.description?.substring(0, 50)}...`);
        });
      }
      
      if (data.shadow_testing_plan.execution_plan) {
        const phases = Object.keys(data.shadow_testing_plan.execution_plan);
        console.log(`   Execution Phases: ${phases.length}`);
        phases.forEach(phase => {
          const p = data.shadow_testing_plan.execution_plan[phase];
          console.log(`      - ${p.name}: ${p.duration}`);
        });
      }
      
      if (data.shadow_testing_plan.risk_mitigation) {
        console.log(`   Risk Mitigations: ${data.shadow_testing_plan.risk_mitigation.length}`);
      }
    } else {
      console.log('   ❌ NOT PRESENT');
    }
    
    // v8.5 Features - Compliance
    console.log('\n📋 Compliance Assessment:');
    if (data.compliance_assessment) {
      console.log(`   ✅ PRESENT`);
      console.log(`   Overall Risk: ${data.compliance_assessment.overall_risk || 'N/A'}`);
      
      if (data.compliance_assessment.applicable_regulations) {
        console.log(`   Applicable Regulations: ${data.compliance_assessment.applicable_regulations.join(', ')}`);
      }
      
      if (data.compliance_assessment.sox?.applicable) {
        console.log(`   SOX: ${data.compliance_assessment.sox.status} (${data.compliance_assessment.sox.findings?.length || 0} findings)`);
      }
      if (data.compliance_assessment.pci_dss?.applicable) {
        console.log(`   PCI-DSS: ${data.compliance_assessment.pci_dss.status}`);
      }
      if (data.compliance_assessment.gdpr?.applicable) {
        console.log(`   GDPR: ${data.compliance_assessment.gdpr.status}`);
      }
      if (data.compliance_assessment.hipaa?.applicable) {
        console.log(`   HIPAA: ${data.compliance_assessment.hipaa.status}`);
      }
      
      if (data.compliance_assessment.recommendations) {
        console.log(`   Recommendations: ${data.compliance_assessment.recommendations.length}`);
      }
    } else {
      console.log('   ❌ NOT PRESENT');
    }
    
    // v8.5 Features - Cyclomatic Complexity
    console.log('\n🔢 Cyclomatic Complexity:');
    if (data.cyclomatic_complexity) {
      console.log(`   ✅ PRESENT`);
      console.log(`   Average: ${data.cyclomatic_complexity.average}`);
      if (data.cyclomatic_complexity.highest) {
        console.log(`   Highest: ${data.cyclomatic_complexity.highest.name} (${data.cyclomatic_complexity.highest.complexity})`);
      }
      console.log(`   Paragraphs analyzed: ${data.cyclomatic_complexity.paragraphs?.length || 0}`);
    } else {
      console.log('   ⚠️ Not present (may be in modules)');
    }
    
    // AST Metrics
    console.log('\n📊 AST Metrics:');
    if (data.ast_metrics) {
      console.log(`   Paragraphs: ${data.ast_metrics.paragraphs || 0}`);
      console.log(`   Variables: ${data.ast_metrics.variables || 0}`);
      console.log(`   Copybooks: ${data.ast_metrics.copybooks || 0}`);
      console.log(`   Total Lines: ${data.ast_metrics.totalLines || 0}`);
      console.log(`   Cyclomatic: ${data.ast_metrics.cyclomaticComplexity || 'N/A'}`);
    }
    
    // Coverage Metrics
    console.log('\n📈 Coverage Metrics:');
    if (data.coverage_metrics) {
      console.log(`   Translation Rate: ${data.coverage_metrics.translation_rate}%`);
      console.log(`   Paragraphs: ${data.coverage_metrics.successful_translations}/${data.coverage_metrics.total_paragraphs}`);
      console.log(`   Fallbacks: ${data.coverage_metrics.fallback_count}`);
      console.log(`   Variables: ${data.coverage_metrics.variables_detected}`);
      console.log(`   Python Methods: ${data.coverage_metrics.python_methods_generated}`);
    }
    
    // Modules
    console.log('\n📦 Modules:');
    if (data.modules && data.modules.length > 0) {
      console.log(`   Total: ${data.modules.length}`);
      data.modules.slice(0, 5).forEach((mod, i) => {
        console.log(`      ${i+1}. ${mod.name} (${mod.type}) - ${mod.lines} lines`);
      });
      if (data.modules.length > 5) console.log(`      ... and ${data.modules.length - 5} more`);
    }
    
    // Save Python code to file
    if (data.python_code) {
      fs.writeFileSync('/workspace/output-assurances.py', data.python_code);
      console.log('\n💾 Python code saved to: output-assurances.py');
    }
    
    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ ANALYSIS COMPLETE');
    console.log('='.repeat(70));
    
    const v85Features = {
      shadow_testing: !!data.shadow_testing_plan,
      compliance: !!data.compliance_assessment,
      cyclomatic: !!data.cyclomatic_complexity || !!data.ast_metrics?.cyclomaticComplexity,
      coverage_metrics: !!data.coverage_metrics
    };
    
    console.log('\nv8.5 Features Status:');
    console.log(`   Shadow Testing Plan: ${v85Features.shadow_testing ? '✅' : '❌'}`);
    console.log(`   Compliance Assessment: ${v85Features.compliance ? '✅' : '❌'}`);
    console.log(`   Cyclomatic Complexity: ${v85Features.cyclomatic ? '✅' : '❌'}`);
    console.log(`   Coverage Metrics: ${v85Features.coverage_metrics ? '✅' : '❌'}`);
    
    const allV85 = Object.values(v85Features).every(v => v);
    console.log(`\n${allV85 ? '🎉 ALL v8.5 FEATURES WORKING!' : '⚠️ Some v8.5 features missing'}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('timeout')) {
      console.log('   The API is taking too long. This is normal for large COBOL files.');
    }
  } finally {
    await browser.close();
  }
}

testFullAnalysis().catch(console.error);
