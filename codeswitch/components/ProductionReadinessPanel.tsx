'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Shield, CheckCircle, XCircle, AlertTriangle, 
  Activity, Lock, Database, Cpu, FileText,
  ChevronRight, RefreshCw, Zap, Target, TrendingUp,
  Eye, EyeOff, Play, Loader2, BarChart3
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

  // Analyse réelle du code Python via l'API Supabase
  const analyzeReadiness = useCallback(async () => {
    if (!analysis?.python_code) {
      setError('No Python code available for analysis');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Appel API vers notre route qui utilise Supabase
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
      
      setData({
        score: result.score || calculateScoreFromAnalysis(analysis),
        grade: result.grade || calculateGrade(result.score || 70),
        summary: result.summary || generateSummary(analysis),
        recommendations: result.recommendations || generateRecommendations(analysis),
        metrics: result.metrics || calculateMetricsFromCode(analysis.python_code),
        issues: result.issues || generateIssuesFromAnalysis(analysis),
        production_ready: result.production_ready !== undefined ? result.production_ready : (result.score || 70) >= 75,
        historical_scores: result.historical_scores || []
      });
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message);
      
      // Fallback avec analyse réelle du code (pas de fake data)
      setData(generateRealAnalysis(analysis));
    } finally {
      setLoading(false);
    }
  }, [analysis]);

  // Recalculer quand l'analyse change
  useEffect(() => {
    if (analysis?.python_code) {
      analyzeReadiness();
    }
  }, [analysis?.python_code, analyzeReadiness]);

  // Fonctions de calcul réel (pas de placeholders)
  function calculateScoreFromAnalysis(analysis: AnalysisResult): number {
    let score = 50; // Score de base
    
    // Bonus pour les tests
    if (testResults) {
      const passRate = testResults.total > 0 ? testResults.passed / testResults.total : 0;
      score += Math.round(passRate * 20);
    }
    
    // Bonus pour la couverture de traduction
    if (analysis.coverage_metrics?.translation_rate) {
      score += Math.round((analysis.coverage_metrics.translation_rate / 100) * 15);
    }
    
    // Bonus pour la confiance
    const confidence = typeof analysis.migration_score?.confidence === 'number' 
      ? analysis.migration_score.confidence 
      : parseInt(String(analysis.migration_score?.confidence || '0').replace(/[^0-9]/g, '')) || 0;
    score += Math.round((confidence / 100) * 10);
    
    // Malus pour les issues de sécurité
    const securityCount = Array.isArray(analysis.security_warnings) ? analysis.security_warnings.length : 0;
    score -= securityCount * 5;
    
    // Malus pour les improvements recommandées
    const improvementsCount = Array.isArray(analysis.improvements) ? analysis.improvements.length : 0;
    score -= improvementsCount * 2;
    
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  function calculateGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  function generateSummary(analysis: AnalysisResult): string {
    const pythonCode = analysis.python_code || '';
    const functions = (pythonCode.match(/def\s+\w+/g) || []).length;
    const classes = (pythonCode.match(/class\s+\w+/g) || []).length;
    
    return `Codebase with ${functions} functions and ${classes} classes. ` +
           `Migration complexity: ${analysis.migration_score?.complexity || 'Unknown'}. ` +
           `Translation coverage: ${analysis.coverage_metrics?.translation_rate || 0}%.`;
  }

  function generateRecommendations(analysis: AnalysisResult): string[] {
    const recommendations: string[] = [];
    const pythonCode = analysis.python_code || '';
    
    if (!pythonCode.includes('try:')) {
      recommendations.push('Add try-except blocks for error handling');
    }
    if (!pythonCode.includes('logging')) {
      recommendations.push('Add logging statements for production monitoring');
    }
    if (!pythonCode.includes('@pytest') && !pythonCode.includes('def test_')) {
      recommendations.push('Add unit tests using pytest');
    }
    if (!pythonCode.match(/:\s*\w+:/)) {
      recommendations.push('Add type annotations for better code quality');
    }
    
    if (Array.isArray(analysis.improvements)) {
      recommendations.push(...analysis.improvements.slice(0, 3));
    }
    
    return recommendations;
  }

  function calculateMetricsFromCode(code: string): ReadinessData['metrics'] {
    const metrics = {
      functions: (code.match(/def\s+\w+/g) || []).length,
      classes: (code.match(/class\s+\w+/g) || []).length,
      dataclasses: (code.match(/@dataclass/g) || []).length,
      async_functions: (code.match(/async\s+def/g) || []).length,
      type_annotated: (code.match(/:\s*\w+:/g) || []).length,
      documented: (code.match(/"""[\s\S]*?"""/g) || []).length,
      error_handled: (code.match(/except\s+/g) || []).length,
      try_blocks: (code.match(/try:/g) || []).length,
      test_functions: (code.match(/def\s+test_/g) || []).length,
      hardcoded_secrets: (code.match(/(password|secret|api_key|token)\s*=\s*['"][^'"]+['"]/gi) || []).length,
      dangerous_calls: (code.match(/eval\(|exec\(/g) || []).length,
      input_validations: (code.match(/if\s+.*isinstance|if\s+.*>=\s*0|if\s+.*\.strip\(\)/g) || []).length,
      logging_statements: (code.match(/logger\.|logging\./g) || []).length,
      contextvars: (code.match(/contextvars/g) || []).length,
      locks: (code.match(/threading\.(Lock|RLock)/g) || []).length,
      sql_queries: (code.match(/execute\(|cursor\./g) || []).length,
      orm_usage: (code.match(/\.filter\(|\.query\(/g) || []).length,
    };
    return metrics;
  }

  function generateIssuesFromAnalysis(analysis: AnalysisResult): ReadinessData['issues'] {
    const issues: ReadinessData['issues'] = [];
    const code = analysis.python_code || '';
    
    // Détecter les problèmes de sécurité
    if (code.includes('eval(') || code.includes('exec(')) {
      issues.push({
        severity: 'HIGH',
        category: 'Security',
        line_number: code.indexOf('eval(') || code.indexOf('exec('),
        message: 'Dangerous code execution detected (eval/exec)',
        suggestion: 'Avoid using eval() or exec() with user input',
        code_snippet: code.includes('eval(') ? 'eval(...)' : 'exec(...)'
      });
    }
    
    // Vérifier les secrets codés en dur
    const secretPattern = /(password|secret|api_key|token)\s*=\s*['"][^'"]+['"]/gi;
    let match;
    while ((match = secretPattern.exec(code)) !== null) {
      issues.push({
        severity: 'CRITICAL',
        category: 'Security',
        line_number: code.substring(0, match.index).split('\n').length,
        message: 'Hardcoded secret detected',
        suggestion: 'Use environment variables or secrets manager',
        code_snippet: match[0]
      });
    }
    
    // Vérifier le manque de gestion d'erreurs
    const functions = code.match(/def\s+\w+/g) || [];
    const tryBlocks = (code.match(/try:/g) || []).length;
    if (functions.length > tryBlocks) {
      issues.push({
        severity: 'MEDIUM',
        category: 'Error Handling',
        line_number: 0,
        message: `${functions.length - tryBlocks} functions lack error handling`,
        suggestion: 'Add try-except blocks to all functions',
        code_snippet: 'def function(...):  # No try-except'
      });
    }
    
    // Ajouter les warnings de sécurité de l'analyse
    if (Array.isArray(analysis.security_warnings)) {
      analysis.security_warnings.forEach((warning: any) => {
        issues.push({
          severity: warning.severity || 'MEDIUM',
          category: 'Security',
          line_number: warning.location?.split(':')[0] || 0,
          message: warning.title || warning.description || 'Security issue detected',
          suggestion: warning.fix || 'Review and fix this security issue',
          code_snippet: warning.vulnerable_code || ''
        });
      });
    }
    
    return issues;
  }

  function generateRealAnalysis(analysis: AnalysisResult): ReadinessData {
    if (!analysis?.python_code) {
      return {
        score: 0,
        grade: 'N/A',
        summary: 'No code available for analysis',
        recommendations: ['Please generate Python code first'],
        metrics: {
          functions: 0, classes: 0, dataclasses: 0, async_functions: 0,
          type_annotated: 0, documented: 0, error_handled: 0, try_blocks: 0,
          test_functions: 0, hardcoded_secrets: 0, dangerous_calls: 0,
          input_validations: 0, logging_statements: 0, contextvars: 0,
          locks: 0, sql_queries: 0, orm_usage: 0
        },
        issues: [],
        production_ready: false
      };
    }

    const score = calculateScoreFromAnalysis(analysis);
    
    return {
      score,
      grade: calculateGrade(score),
      summary: generateSummary(analysis),
      recommendations: generateRecommendations(analysis),
      metrics: calculateMetricsFromCode(analysis.python_code),
      issues: generateIssuesFromAnalysis(analysis),
      production_ready: score >= 75
    };
  }

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
      subtitle: `${data.metrics.type_annotated} typed`,
      icon: <Cpu className="w-5 h-5" />,
      color: 'blue'
    },
    {
      title: 'Classes',
      value: data.metrics.classes,
      subtitle: `${data.metrics.dataclasses} dataclasses`,
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
      subtitle: `${data.metrics.error_handled} handled`,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'yellow'
    },
    {
      title: 'Security',
      value: data.metrics.dangerous_calls + data.metrics.hardcoded_secrets,
      subtitle: `${data.metrics.hardcoded_secrets} secrets found`,
      icon: <Lock className="w-5 h-5" />,
      color: 'red'
    },
    {
      title: 'Logging',
      value: data.metrics.logging_statements,
      subtitle: 'statements',
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
      subtitle: `${data.metrics.orm_usage} ORM`,
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
            <p className="text-xs text-slate-500 mt-2">Evaluating security, error handling, tests, and architecture</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Analysis Error</span>
          </div>
          <p className="text-sm text-slate-300 mt-2">{error}</p>
          <button
            onClick={analyzeReadiness}
            className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition"
          >
            Retry Analysis
          </button>
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
                Based on {data.metrics.functions} functions, {data.metrics.test_functions} tests, and {data.issues.length} checks
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
                            <span className="text-xs text-slate-500">Line {issue.line_number}</span>
                          </div>
                          <p className="text-sm text-white font-medium">{issue.message}</p>
                          {issue.code_snippet && (
                            <code className="text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded mt-1 block">
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
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-400">Click "Re-analyze" to calculate production readiness</p>
        </div>
      )}
    </div>
  );
}
