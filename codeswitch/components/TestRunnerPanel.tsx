"use client";

import { useState, useEffect } from 'react';
import { 
  TestTube, 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  TrendingUp,
  Shield,
  Activity,
  Database,
  FileCode,
  ChevronDown,
  RefreshCw,
  Download,
  Eye,
  Settings,
  BarChart3,
  Target
} from 'lucide-react';

interface TestRunnerPanelProps {
  pythonCode: string;
  testCode: string;
  analysis: any;
  onRunTests: (testType: string) => void;
  testResults: {
    running: boolean;
    total: number;
    passed: number;
    failed: number;
    details: { name: string; status: string; error?: string }[];
  };
  shadowTestResults?: {
    ready: boolean;
    score: number;
    paths: { name: string; status: string; inputs: string[]; outputs: string[] }[];
  };
  productionReadiness?: {
    score: number;
    categories: { name: string; score: number; items: string[] }[];
  };
}

type TestSubTab = 'unit' | 'shadow' | 'production' | 'coverage';

export default function TestRunnerPanel({
  pythonCode,
  testCode,
  analysis,
  onRunTests,
  testResults,
  shadowTestResults,
  productionReadiness
}: TestRunnerPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<TestSubTab>('unit');
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');

  // Extract test categories from test code
  const testCategories = (() => {
    const categories: { name: string; count: number; tests: { name: string; status: string; error?: string }[] }[] = [];
    
    // Parse test file header
    const headerMatch = testCode.match(/Comprehensive Unit Tests for (.+?)(?:\n|$)/);
    const categoryMatches = testCode.match(/(\d+)\.\s+([A-Za-z\s]+)/g) || [];
    
    if (testResults.details.length > 0) {
      // Group by first part of test name
      const grouped: Record<string, { name: string; status: string; error?: string }[]> = {};
      testResults.details.forEach(test => {
        const parts = test.name.split('.');
        const category = parts.length > 1 ? parts[0] : 'General';
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(test);
      });
      
      Object.entries(grouped).forEach(([name, tests]) => {
        categories.push({
          name: name.replace(/_/g, ' ').replace(/test/gi, '').trim() || 'General',
          count: tests.length,
          tests
        });
      });
    } else {
      // Fallback to parsing test file structure
      const testNames = testCode.match(/def (test_[a-z0-9_]+)/gi) || [];
      const uniqueTests = [...new Set(testNames.map(t => t.replace(/^def\s+/i, '')))];
      
      categories.push({
        name: 'All Tests',
        count: uniqueTests.length,
        tests: uniqueTests.map(name => ({ name, status: 'pending' }))
      });
    }
    
    return categories;
  })();

  // Filtered tests based on current filter
  const filteredTests = (() => {
    if (filter === 'all') return testResults.details;
    return testResults.details.filter(t => 
      filter === 'passed' ? t.status === 'passed' : t.status === 'failed' || t.status === 'error'
    );
  })();

  // Sub-tab configuration
  const subTabs = [
    { id: 'unit' as TestSubTab, label: 'Unit Tests', icon: TestTube, count: testResults.total },
    { id: 'shadow' as TestSubTab, label: 'Shadow Tests', icon: Eye, count: shadowTestResults?.paths?.length || 0 },
    { id: 'production' as TestSubTab, label: 'Production', icon: Shield, count: productionReadiness?.categories?.length || 0 },
    { id: 'coverage' as TestSubTab, label: 'Coverage', icon: BarChart3, count: 0 },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-lg overflow-hidden">
      {/* Sub-tabs Header */}
      <div className="flex items-center gap-1 px-2 py-1 bg-slate-800 border-b border-slate-700">
        {subTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive 
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive ? 'bg-indigo-500/30' : 'bg-slate-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
        
        {/* Actions */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => onRunTests(activeSubTab)}
            disabled={testResults.running}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            {testResults.running ? 'Running...' : 'Run Tests'}
          </button>
          <button
            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Test Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-tab Content */}
      <div className="flex-1 overflow-y-auto">
        {/* UNIT TESTS TAB */}
        {activeSubTab === 'unit' && (
          <div className="p-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-slate-800 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-white">{testResults.total}</p>
                <p className="text-xs text-slate-400">Total</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-emerald-400">{testResults.passed}</p>
                <p className="text-xs text-slate-400">Passed</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-red-400">{testResults.failed}</p>
                <p className="text-xs text-slate-400">Failed</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-indigo-400">
                  {testResults.total > 0 ? Math.round((testResults.passed / testResults.total) * 100) : 0}%
                </p>
                <p className="text-xs text-slate-400">Pass Rate</p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-4">
              {(['all', 'passed', 'failed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filter === f 
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-white bg-slate-800'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Test Categories */}
            {testCategories.map(category => (
              <div key={category.name} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-white">{category.name}</span>
                  <span className="text-xs text-slate-500">({category.count} tests)</span>
                </div>
                
                <div className="space-y-1 ml-6">
                  {category.tests.slice(0, 10).map((test, idx) => {
                    const isExpanded = expandedTest === test.name;
                    const isValidation = test.error?.toLowerCase().includes('validation') || 
                                         test.error?.toLowerCase().includes('not allowed');
                    
                    return (
                      <div 
                        key={idx}
                        className={`rounded-lg transition-all ${
                          test.status === 'passed' 
                            ? 'bg-emerald-500/10 border border-emerald-500/20' 
                            : test.status === 'error' && isValidation
                              ? 'bg-blue-500/10 border border-blue-500/20'
                              : 'bg-red-500/10 border border-red-500/20'
                        }`}
                      >
                        <button
                          onClick={() => setExpandedTest(isExpanded ? null : test.name)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left"
                        >
                          {test.status === 'passed' ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          ) : test.status === 'error' && isValidation ? (
                            <AlertTriangle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          )}
                          <span className={`text-sm flex-1 ${
                            test.status === 'passed' 
                              ? 'text-emerald-300' 
                              : test.status === 'error' && isValidation
                                ? 'text-blue-300'
                                : 'text-red-300'
                          }`}>
                            {test.name}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            test.status === 'passed' 
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : test.status === 'error' && isValidation
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-red-500/20 text-red-400'
                          }`}>
                            {test.status === 'error' && isValidation ? 'VALIDATED' : test.status}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isExpanded && test.error && (
                          <div className="px-9 py-2 border-t border-slate-700/50">
                            <div className="text-xs text-slate-400 font-mono bg-slate-800/50 rounded p-2">
                              {test.error}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {category.tests.length > 10 && (
                    <p className="text-xs text-slate-500 ml-6">... and {category.tests.length - 10} more tests</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SHADOW TESTS TAB */}
        {activeSubTab === 'shadow' && (
          <div className="p-4">
            {shadowTestResults ? (
              <>
                {/* Shadow Test Score */}
                <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-lg p-4 border border-purple-500/30 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-purple-400" />
                      <span className="font-semibold text-white">Shadow Testing Score</span>
                    </div>
                    <span className={`text-2xl font-bold ${
                      shadowTestResults.score >= 80 ? 'text-emerald-400' :
                      shadowTestResults.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {shadowTestResults.score}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        shadowTestResults.score >= 80 ? 'bg-emerald-500' :
                        shadowTestResults.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${shadowTestResults.score}%` }}
                    />
                  </div>
                </div>

                {/* Critical Paths */}
                <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  Critical Paths Tested
                </h4>
                <div className="space-y-2">
                  {shadowTestResults.paths?.map((path, idx) => (
                    <div 
                      key={idx}
                      className="bg-slate-800 rounded-lg p-3 border border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">{path.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          path.status === 'ready' 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {path.status}
                        </span>
                      </div>
                      
                      {/* Inputs/Outputs Flow */}
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex-1 bg-slate-700/50 rounded p-2">
                          <span className="text-slate-500 block mb-1">Inputs</span>
                          <div className="flex flex-wrap gap-1">
                            {path.inputs.slice(0, 3).map((input, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                                {input}
                              </span>
                            ))}
                            {path.inputs.length > 3 && (
                              <span className="text-slate-500">+{path.inputs.length - 3}</span>
                            )}
                          </div>
                        </div>
                        <ArrowRightIcon className="w-4 h-4 text-slate-500" />
                        <div className="flex-1 bg-slate-700/50 rounded p-2">
                          <span className="text-slate-500 block mb-1">Outputs</span>
                          <div className="flex flex-wrap gap-1">
                            {path.outputs.slice(0, 3).map((output, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                                {output}
                              </span>
                            ))}
                            {path.outputs.length > 3 && (
                              <span className="text-slate-500">+{path.outputs.length - 3}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No shadow test data available</p>
                  <p className="text-xs mt-2 text-slate-500">Run analysis to generate shadow tests</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PRODUCTION READINESS TAB */}
        {activeSubTab === 'production' && (
          <div className="p-4">
            {productionReadiness ? (
              <>
                {/* Overall Score */}
                <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg p-4 border border-green-500/30 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-400" />
                      <span className="font-semibold text-white">Production Readiness</span>
                    </div>
                    <span className={`text-2xl font-bold ${
                      productionReadiness.score >= 80 ? 'text-emerald-400' :
                      productionReadiness.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {productionReadiness.score}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        productionReadiness.score >= 80 ? 'bg-emerald-500' :
                        productionReadiness.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${productionReadiness.score}%` }}
                    />
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-3">
                  {productionReadiness.categories?.map((cat, idx) => (
                    <div key={idx} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">{cat.name}</span>
                        <span className={`text-sm font-bold ${
                          cat.score >= 80 ? 'text-emerald-400' :
                          cat.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {cat.score}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1.5 mb-2">
                        <div 
                          className={`h-1.5 rounded-full ${
                            cat.score >= 80 ? 'bg-emerald-500' :
                            cat.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${cat.score}%` }}
                        />
                      </div>
                      <div className="space-y-1">
                        {cat.items.slice(0, 3).map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                            {item.toLowerCase().includes('pass') || item.toLowerCase().includes('ready') ? (
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                            )}
                            {item}
                          </div>
                        ))}
                        {cat.items.length > 3 && (
                          <p className="text-xs text-slate-500">+{cat.items.length - 3} more items</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No production readiness data</p>
                  <p className="text-xs mt-2 text-slate-500">Run analysis to assess production readiness</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* COVERAGE TAB */}
        {activeSubTab === 'coverage' && (
          <div className="p-4">
            {analysis?.coverage_metrics ? (
              <div className="space-y-4">
                {/* Coverage Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/10 rounded-lg p-4 border border-emerald-500/30 text-center">
                    <p className="text-3xl font-bold text-emerald-400">
                      {analysis.coverage_metrics.translation_rate}%
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Translation Rate</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
                    <p className="text-3xl font-bold text-white">
                      {analysis.coverage_metrics.successful_translations}/{analysis.coverage_metrics.total_paragraphs}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Paragraphs Translated</p>
                  </div>
                </div>

                {/* Detailed Metrics */}
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    Detailed Coverage
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Variables</span>
                      <span className="text-white">{analysis.coverage_metrics.variables_detected}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Fallbacks</span>
                      <span className={analysis.coverage_metrics.fallback_count === 0 ? 'text-emerald-400' : 'text-amber-400'}>
                        {analysis.coverage_metrics.fallback_count}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Python Methods</span>
                      <span className="text-white">{analysis.coverage_metrics.python_methods_generated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">COBOL Functions</span>
                      <span className="text-white">
                        {analysis.coverage_metrics.cobol_functions_ai_translated}/{analysis.coverage_metrics.cobol_functions_unknown}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Code Lines */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/30">
                    <p className="text-2xl font-bold text-amber-400">
                      {analysis.cobol_lines || pythonCode.split('\n').length}
                    </p>
                    <p className="text-xs text-slate-400">COBOL Lines</p>
                  </div>
                  <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/30">
                    <p className="text-2xl font-bold text-green-400">
                      {analysis.python_lines || (analysis.python_code || '').split('\n').length}
                    </p>
                    <p className="text-xs text-slate-400">Python Lines</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No coverage data available</p>
                  <p className="text-xs mt-2 text-slate-500">Run analysis to get coverage metrics</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}
