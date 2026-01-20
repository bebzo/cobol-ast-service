'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Shield, CheckCircle, AlertTriangle, 
  Activity, Lock, Database, Cpu, FileText,
  ChevronRight, RefreshCw, Target, TrendingUp,
  Loader2, BarChart3, XCircle
} from 'lucide-react';

interface AnalysisResult {
  summary: string;
  python_code?: string;
  issues?: string[];
  improvements?: string[];
  security_warnings?: any[];
  migration_score?: {
    complexity?: string;
    risk_level?: string;
    estimated_effort?: string;
    confidence?: string | number;
  };
  coverage_metrics?: {
    total_paragraphs?: number;
    successful_translations?: number;
    translation_rate?: number;
  };
}

interface TestResults {
  running: boolean;
  total: number;
  passed: number;
  failed: number;
  details: { name: string; status: string; error?: string }[];
}

interface ProductionReadinessPanelProps {
  analysis: AnalysisResult | null;
  testResults?: TestResults;
  cobolLines?: number;
  pythonLines?: number;
}

interface ReadinessData {
  score: number;
  grade: string;
  summary: string;
  recommendations: string[];
  metrics: {
    functions: number;
    classes: number;
    dataclasses: number;
    async_functions: number;
    type_annotated: number;
    documented: number;
    error_handled: number;
    try_blocks: number;
    test_functions: number;
    hardcoded_secrets: number;
    dangerous_calls: number;
    input_validations: number;
    logging_statements: number;
    contextvars: number;
    locks: number;
    sql_queries: number;
    orm_usage: number;
  };
  issues: {
    severity: string;
    category: string;
    line_number: number;
    message: string;
    suggestion: string;
    code_snippet: string;
  }[];
  production_ready: boolean;
  historical_scores?: {
    timestamp: string;
    score: number;
    grade: string;
  }[];
  mode?: string;
}

type Category = 'all' | 'security' | 'error_handling' | 'testing' | 'architecture' | 'performance';

export default function ProductionReadinessPanel({ 
  analysis, 
  testResults 
}: ProductionReadinessPanelProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReadinessData | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [error, setError] = useState<string | null>(null);

  // Analyse statique réelle du code Python
  const performStaticAnalysis = useCallback((code: string): ReadinessData => {
    const lines = code.split('\n');
    const codeLines = lines.filter(l => l.trim() && !l.trim().startsWith('#'));
    
    // Métriques calculées réellement depuis le code
    const functionMatches = code.match(/def\s+\w+/g) || [];
    const classMatches = code.match(/class\s+\w+/g) || [];
    const dataclassMatches = code.match(/@dataclass/g) || [];
    const asyncMatches = code.match(/async\s+def/g) || [];
    const typeMatches = code.match(/:\s*\w+[:=]/g) || [];
    const docMatches = code.match(/"""[\s\S]*?"""/g) || [];
    const tryMatches = code.match(/try:/g) || [];
    const exceptMatches = code.match(/except\s+/g) || [];
    const testMatches = code.match(/def\s+test_/g) || [];
    const loggingMatches = code.match(/logger\.|logging\./g) || [];
    const contextMatches = code.match(/contextvars/g) || [];
    const lockMatches = code.match(/threading\.(Lock|RLock)/g) || [];
    const sqlMatches = code.match(/execute\(|cursor\./g) || [];
    const ormMatches = code.match(/\.filter\(|\.query\(/g) || [];
    const evalExecMatches = code.match(/eval\(|exec\(/g) || [];
    
    // Détection des secrets codés en dur
    const secretPattern = /(password|secret|api_key|token)\s*[:=]\s*['"][^'"]+['"]/gi;
    const secretMatches = code.match(secretPattern) || [];
    
    // Métriques détaillées
    const metrics = {
      functions: functionMatches.length,
      classes: classMatches.length,
      dataclasses: dataclassMatches.length,
      async_functions: asyncMatches.length,
      type_annotated: typeMatches.length,
      documented: docMatches.length,
      error_handled: exceptMatches.length,
      try_blocks: tryMatches.length,
      test_functions: testMatches.length,
      hardcoded_secrets: secretMatches.length,
      dangerous_calls: evalExecMatches.length,
      input_validations: 0,
      logging_statements: loggingMatches.length,
      contextvars: contextMatches.length,
      locks: lockMatches.length,
      sql_queries: sqlMatches.length,
      orm_usage: ormMatches.length,
    };

    // Calcul du score basé sur les métriques réelles
    let score = 40;
    
    // Couverture de typage
    if (metrics.functions > 0) {
      score += Math.min(15, (metrics.type_annotated / metrics.functions) * 15);
    }
    
    // Documentation
    if (metrics.functions > 0) {
      score += Math.min(10, (metrics.documented / metrics.functions) * 10);
    }
    
    // Gestion d'erreurs
    if (metrics.functions > 0) {
      score += Math.min(15, (metrics.error_handled / metrics.functions) * 15);
    }
    
    // Tests
    if (metrics.test_functions > 0) {
      score += Math.min(15, (metrics.test_functions / metrics.functions) * 15);
    }
    
    // Logging
    if (metrics.logging_statements > 0) {
      score += 5;
    }
    
    // Concurrence
    if (metrics.contextvars > 0 || metrics.locks > 0) {
      score += 3;
    }
    
    // Malus pour problèmes de sécurité
    score -= metrics.hardcoded_secrets * 8;
    score -= metrics.dangerous_calls * 5;
    
    // Bonus pour architecture moderne
    if (metrics.async_functions > 0) score += 3;
    if (metrics.dataclasses > 0) score += 3;
    if (metrics.orm_usage > 0) score += 2;
    
    // Normaliser le score entre 0 et 100
    score = Math.round(Math.min(100, Math.max(0, score)));
    
    // Calculer le grade
    const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

    // Générer les issues réels
    const issues: ReadinessData['issues'] = [];
    
    if (metrics.dangerous_calls > 0) {
      issues.push({
        severity: 'HIGH',
        category: 'Security',
        line_number: 0,
        message: `Dangerous code execution detected (${metrics.dangerous_calls} eval/exec calls)`,
        suggestion: 'Avoid using eval() or exec() with user input. Use safer alternatives like ast.literal_eval()',
        code_snippet: 'eval(...) or exec(...)'
      });
    }
    
    if (metrics.hardcoded_secrets > 0) {
      secretMatches.forEach((secret: string, idx: number) => {
        issues.push({
          severity: 'CRITICAL',
          category: 'Security',
          line_number: idx + 1,
          message: 'Hardcoded secret detected in source code',
          suggestion: 'Move secrets to environment variables or use a secrets manager (AWS Secrets Manager, HashiCorp Vault)',
          code_snippet: secret.substring(0, 50)
        });
      });
    }
    
    if (metrics.functions > metrics.try_blocks) {
      issues.push({
        severity: 'MEDIUM',
        category: 'Error Handling',
        line_number: 0,
        message: `${metrics.functions - metrics.try_blocks} functions lack error handling`,
        suggestion: 'Add try-except blocks to all functions that can fail',
        code_snippet: 'def function(...):  # Missing try-except'
      });
    }
    
    if (metrics.logging_statements === 0 && metrics.functions > 3) {
      issues.push({
        severity: 'LOW',
        category: 'Architecture',
        line_number: 0,
        message: 'No logging statements detected',
        suggestion: 'Add logging for production monitoring and debugging',
        code_snippet: 'logger = logging.getLogger(__name__)'
      });
    }
    
    if (metrics.test_functions === 0 && metrics.functions > 0) {
      issues.push({
        severity: 'MEDIUM',
        category: 'Testing',
        line_number: 0,
        message: 'No unit tests detected',
        suggestion: 'Add pytest unit tests for better code quality assurance',
        code_snippet: 'def test_function(): ...'
      });
    }
    
    if (metrics.type_annotated < metrics.functions * 0.5 && metrics.functions > 5) {
      issues.push({
        severity: 'LOW',
        category: 'Type Safety',
        line_number: 0,
        message: `Low type annotation coverage (${metrics.functions > 0 ? Math.round((metrics.type_annotated / metrics.functions) * 100) : 0}%)`,
        suggestion: 'Add type hints to improve code quality and enable better IDE support',
        code_snippet: 'def function(param: str) -> bool: ...'
      });
    }

    // Générer les recommandations
    const recommendations: string[] = [];
    
    if (metrics.try_blocks === 0 && metrics.functions > 0) {
      recommendations.push('Add try-except blocks for comprehensive error handling');
    }
    if (metrics.logging_statements === 0) {
      recommendations.push('Add logging statements using the logging module');
    }
    if (metrics.test_functions === 0) {
      recommendations.push('Create unit tests using pytest framework');
    }
    if (metrics.type_annotated < metrics.functions * 0.5) {
      recommendations.push('Increase type annotation coverage for better maintainability');
    }
    if (metrics.hardcoded_secrets > 0) {
      recommendations.push('Move all secrets to environment variables');
    }
    if (metrics.dangerous_calls > 0) {
      recommendations.push('Replace eval/exec with safer alternatives');
    }
    if (metrics.contextvars === 0 && metrics.locks === 0 && metrics.functions > 20) {
      recommendations.push('Consider adding thread safety mechanisms for concurrent access');
    }

    // Générer le résumé
    const summary = `Codebase with ${metrics.functions} functions, ${metrics.classes} classes. ` +
                    `Type coverage: ${metrics.functions > 0 ? Math.round((metrics.type_annotated / metrics.functions) * 100) : 0}%. ` +
                    `Error handling: ${metrics.error_handled}/${metrics.functions} functions. ` +
                    `Tests: ${metrics.test_functions} test functions.`;

    return {
      score,
      grade,
      summary,
      recommendations,
      metrics,
      issues,
      production_ready: score >= 75,
      mode: 'static_analysis'
    };
  }, []);

  // Analyse via l'API Supabase
  const analyzeReadiness = useCallback(async () => {
    if (!analysis?.python_code) {
      setError('No Python code available for analysis');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/readiness-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: analysis.python_code,
          targetPath: null
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Si l'API retourne des données valides, les utiliser
      if (result.score !== undefined) {
        setData({
          score: result.score,
          grade: result.grade,
          summary: result.summary,
          recommendations: result.recommendations || [],
          metrics: result.metrics,
          issues: result.issues || [],
          production_ready: result.production_ready,
          historical_scores: result.historical_scores || [],
          mode: result.mode
        });
      } else {
        // Fallback à l'analyse statique locale
        setData(performStaticAnalysis(analysis.python_code));
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      // Erreur - utiliser l'analyse statique locale au lieu de fake data
      setData(performStaticAnalysis(analysis.python_code));
    } finally {
      setLoading(false);
    }
  }, [analysis, performStaticAnalysis]);

  // Recalculer quand l'analyse change
  useEffect(() => {
    if (analysis?.python_code) {
      analyzeReadiness();
    }
  }, [analysis?.python_code, analyzeReadiness]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 45) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'from-green-500/20 to-emerald-500/20';
    if (score >= 75) return 'from-emerald-500/20 to-teal-500/20';
    if (score >= 60) return 'from-yellow-500/20 to-amber-500/20';
    if (score >= 45) return 'from-orange-500/20 to-red-500/20';
    return 'from-red-500/20 to-pink-500/20';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'LOW': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'security': return <Lock className="w-4 h-4" />;
      case 'error handling': return <AlertTriangle className="w-4 h-4" />;
      case 'testing': return <Target className="w-4 h-4" />;
      case 'database': return <Database className="w-4 h-4" />;
      case 'architecture': return <Cpu className="w-4 h-4" />;
      case 'type safety': return <FileText className="w-4 h-4" />;
      case 'performance': return <Activity className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const filteredIssues = activeCategory === 'all' 
    ? data?.issues || []
    : (data?.issues || []).filter(i => 
        i.category.toLowerCase().replace(' ', '_') === activeCategory
      );

  const metricsCards = data ? [
    {
      title: 'Functions',
      value: data.metrics.functions,
      subtitle: `${data.metrics.type_annotated} typed (${data.metrics.functions > 0 ? Math.round((data.metrics.type_annotated / data.metrics.functions) * 100) : 0}%)`,
      icon: <Cpu className="w-5 h-5" />,
      color: 'blue'
    },
    {
      title: 'Classes',
      value: data.metrics.classes,
      subtitle: `${data.metrics.dataclasses} @dataclass`,
      icon: <Shield className="w-5 h-5" />,
      color: 'purple'
    },
    {
      title: 'Tests',
      value: data.metrics.test_functions,
      subtitle: `${data.metrics.functions > 0 ? Math.round((data.metrics.test_functions / data.metrics.functions) * 100) : 0}% coverage`,
      icon: <Target className="w-5 h-5" />,
      color: 'green'
    },
    {
      title: 'Error Handling',
      value: data.metrics.try_blocks,
      subtitle: `${data.metrics.error_handled} exceptions caught`,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'yellow'
    },
    {
      title: 'Security',
      value: data.metrics.dangerous_calls + data.metrics.hardcoded_secrets,
      subtitle: `${data.metrics.hardcoded_secrets} secrets, ${data.metrics.dangerous_calls} dangerous calls`,
      icon: <Lock className="w-5 h-5" />,
      color: 'red'
    },
    {
      title: 'Logging',
      value: data.metrics.logging_statements,
      subtitle: 'logger/logging statements',
      icon: <Activity className="w-5 h-5" />,
      color: 'cyan'
    },
    {
      title: 'Thread Safety',
      value: data.metrics.contextvars + data.metrics.locks,
      subtitle: `${data.metrics.contextvars} ctxvars, ${data.metrics.locks} locks`,
      icon: <RefreshCw className="w-5 h-5" />,
      color: 'pink'
    },
    {
      title: 'Database',
      value: data.metrics.sql_queries,
      subtitle: `${data.metrics.orm_usage} ORM queries`,
      icon: <Database className="w-5 h-5" />,
      color: 'indigo'
    },
  ] : [];

  if (!analysis) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Production Readiness Analysis will appear after analysis</p>
          <p className="text-xs mt-2 text-slate-500">Static analysis of generated Python code</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Analyzing production readiness...</p>
            <p className="text-xs text-slate-500 mt-2">Static code analysis in progress</p>
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Score Section */}
          <div className={`bg-gradient-to-br ${getScoreBg(data.score)} border border-slate-700 rounded-2xl p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Production Readiness Score</h3>
                <p className="text-sm text-slate-300">{data.summary}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={`text-5xl font-black ${getScoreColor(data.score)} tabular-nums`}>
                    {data.score}
                  </p>
                  <p className="text-sm text-slate-400">Grade: <span className="font-semibold text-white">{data.grade}</span></p>
                </div>
                <div className={`w-24 h-24 rounded-full border-4 ${getScoreColor(data.score).replace('text-', 'border-')} flex items-center justify-center`}>
                  <span className={`text-3xl font-bold ${getScoreColor(data.score)}`}>{data.grade}</span>
                </div>
              </div>
            </div>
            
            {/* Status Badge */}
            <div className="mt-4 flex items-center gap-2">
              {data.production_ready ? (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full text-sm font-medium border border-green-500/30">
                  <CheckCircle className="w-4 h-4" />
                  Production Ready
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium border border-yellow-500/30">
                  <AlertTriangle className="w-4 h-4" />
                  Needs Improvements
                </span>
              )}
              <span className="text-xs text-slate-400">
                Based on {data.metrics.functions} functions, {data.metrics.test_functions} tests, and {data.issues.length} security/quality checks
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {metricsCards.map((card, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition">
                <div className={`inline-flex p-2 rounded-lg mb-2 ${
                  card.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                  card.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                  card.color === 'green' ? 'bg-green-500/20 text-green-400' :
                  card.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                  card.color === 'red' ? 'bg-red-500/20 text-red-400' :
                  card.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' :
                  card.color === 'pink' ? 'bg-pink-500/20 text-pink-400' :
                  'bg-indigo-500/20 text-indigo-400'
                }`}>
                  {card.icon}
                </div>
                <p className="text-2xl font-bold text-white">{card.value}</p>
                <p className="text-xs text-slate-400">{card.title}</p>
                <p className="text-[10px] text-slate-500">{card.subtitle}</p>
              </div>
            ))}
          </div>

          {/* Issues Section */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                Issues Found ({data.issues.length})
              </h4>
              <div className="flex items-center gap-2">
                {(['all', 'security', 'error_handling', 'testing', 'architecture', 'performance'] as Category[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      activeCategory === cat 
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {filteredIssues.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-slate-300">No issues found in this category</p>
                  <p className="text-xs text-slate-500 mt-1">Code passes all static analysis checks</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {filteredIssues.map((issue, i) => (
                    <div key={i} className="p-4 hover:bg-slate-700/30 transition">
                      <div className="flex items-start gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(issue.severity)}`}>
                          {issue.severity}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getCategoryIcon(issue.category)}
                            <span className="text-xs text-slate-500">Line {issue.line_number || 'N/A'}</span>
                          </div>
                          <p className="text-sm text-white font-medium">{issue.message}</p>
                          {issue.code_snippet && (
                            <code className="text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded mt-1 block font-mono">
                              {issue.code_snippet}
                            </code>
                          )}
                          <p className="text-xs text-blue-400 mt-1">→ {issue.suggestion}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          {data.recommendations.length > 0 && (
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-4">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Recommendations to Improve Score
              </h4>
              <ul className="space-y-2">
                {data.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <ChevronRight className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Historical Data from Supabase */}
          {data.historical_scores && data.historical_scores.length > 0 && (
            <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Historical Scores (Supabase)
              </h4>
              <div className="space-y-2">
                {data.historical_scores.slice(0, 5).map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">
                      {new Date(h.timestamp).toLocaleDateString()} {new Date(h.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`font-bold ${getScoreColor(h.score)}`}>
                      {h.score}/100 ({h.grade})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-400">Click "Re-analyze" to calculate production readiness</p>
        </div>
      )}
    </div>
  );
}
