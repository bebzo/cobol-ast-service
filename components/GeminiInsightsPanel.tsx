'use client';

import React, { useState, useEffect, useRef } from 'react';

interface InsightData {
  review?: {
    score: number;
    grade: string;
    issues: Array<{ severity: 'critical' | 'warning' | 'info'; message: string; line?: number }>;
    strengths: string[];
  };
  tests?: {
    unitTests: string;
    edgeCases: string[];
    coverage: string;
  };
  optimization?: {
    suggestions: Array<{ type: string; description: string; impact: 'high' | 'medium' | 'low'; code?: string }>;
    performanceScore: number;
  };
  explanation?: {
    summary: string;
    businessLogic: string[];
    dataFlow: string;
    keyVariables: Array<{ name: string; purpose: string }>;
  };
  architecture?: {
    diagram: string;
    layers: string[];
    patterns: string[];
    recommendations: string[];
  };
}

interface GeminiInsightsPanelProps {
  cobolCode: string;
  pythonCode: string;
  programName?: string;
  isVisible: boolean;
  onClose: () => void;
}

type TabType = 'review' | 'tests' | 'optimize' | 'explain' | 'architecture';

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: 'review', label: 'Review', icon: '🔍' },
  { id: 'explain', label: 'Explain', icon: '💡' },
  { id: 'tests', label: 'Tests', icon: '🧪' },
  { id: 'optimize', label: 'Optimize', icon: '⚡' },
  { id: 'architecture', label: 'Architecture', icon: '🏗️' },
];

export default function GeminiInsightsPanel({
  cobolCode,
  pythonCode,
  programName = 'Program',
  isVisible,
  onClose
}: GeminiInsightsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('review');
  const [insights, setInsights] = useState<InsightData>({});
  const [loading, setLoading] = useState<Record<TabType, boolean>>({
    review: false, tests: false, optimize: false, explain: false, architecture: false
  });
  const [loadedTabs, setLoadedTabs] = useState<Set<TabType>>(new Set());
  const [analysisSteps, setAnalysisSteps] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState('');
  
  // Draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.initialX + deltaX,
        y: dragRef.current.initialY + deltaY
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Analysis step messages for each tab
  const STEP_MESSAGES: Record<TabType, string[]> = {
    review: [
      'Parsing Python code structure...',
      'Analyzing code quality patterns...',
      'Checking naming conventions...',
      'Evaluating error handling...',
      'Scoring maintainability...',
      'Generating review report...'
    ],
    explain: [
      'Extracting business logic...',
      'Mapping COBOL to Python constructs...',
      'Identifying data transformations...',
      'Tracing variable flow...',
      'Building explanation model...'
    ],
    tests: [
      'Identifying testable functions...',
      'Generating unit test cases...',
      'Creating edge case scenarios...',
      'Building mock data...',
      'Calculating coverage estimate...'
    ],
    optimize: [
      'Profiling code complexity...',
      'Finding performance bottlenecks...',
      'Analyzing memory patterns...',
      'Generating optimization suggestions...',
      'Scoring performance...'
    ],
    architecture: [
      'Mapping module dependencies...',
      'Identifying design patterns...',
      'Analyzing layer separation...',
      'Building architecture diagram...',
      'Generating recommendations...'
    ]
  };

  // Load insight when tab is selected (lazy loading)
  useEffect(() => {
    if (!isVisible || !pythonCode || loadedTabs.has(activeTab)) return;
    
    const loadInsight = async () => {
      setLoading(prev => ({ ...prev, [activeTab]: true }));
      setAnalysisSteps([]);
      setCurrentStep('');
      
      // Simulate progressive steps for better UX
      const steps = STEP_MESSAGES[activeTab];
      let stepIndex = 0;
      const stepInterval = setInterval(() => {
        if (stepIndex < steps.length) {
          setCurrentStep(steps[stepIndex]);
          setAnalysisSteps(prev => [...prev, steps[stepIndex]]);
          stepIndex++;
        }
      }, 800);
      
      try {
        const response = await fetch('/api/gemini-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cobolCode,
            pythonCode,
            type: activeTab,
            context: { programName }
          })
        });
        
        clearInterval(stepInterval);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success && data.insights) {
          setInsights(prev => ({ ...prev, ...data.insights }));
          setLoadedTabs(prev => new Set([...prev, activeTab]));
        } else if (data.error) {
          console.error('API returned error:', data.error);
        }
      } catch (error) {
        clearInterval(stepInterval);
        console.error('Failed to load insight:', error);
        setCurrentStep('Analysis failed. Please try again.');
      } finally {
        setLoading(prev => ({ ...prev, [activeTab]: false }));
      }
    };
    
    loadInsight();
  }, [activeTab, isVisible, pythonCode, cobolCode, programName, loadedTabs]);

  // Reset when code changes
  useEffect(() => {
    setInsights({});
    setLoadedTabs(new Set());
  }, [pythonCode]);

  // Reset position when opening
  useEffect(() => {
    if (isVisible) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const renderReview = () => {
    const review = insights.review;
    if (!review) return <LoadingPlaceholder />;
    
    return (
      <div className="space-y-4">
        {/* Score Badge */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg">
          <div>
            <span className="text-3xl font-bold text-white">{review.score ?? 'N/A'}</span>
            <span className="text-gray-400 text-lg">/100</span>
          </div>
          <div className={`text-4xl font-bold ${getGradeColor(review.grade)}`}>
            {review.grade || 'N/A'}
          </div>
        </div>
        
        {/* Issues */}
        {review.issues?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Issues Found</h4>
            <div className="space-y-2">
              {review.issues.map((issue, i) => (
                <div key={i} className={`p-2 rounded text-sm ${getSeverityBg(issue.severity)}`}>
                  <span className="mr-2">{getSeverityIcon(issue.severity)}</span>
                  {issue.message}
                  {issue.line && <span className="text-gray-500 ml-2">Line {issue.line}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Strengths */}
        {review.strengths?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Strengths</h4>
            <ul className="space-y-1">
              {review.strengths.map((s, i) => (
                <li key={i} className="text-green-400 text-sm flex items-start">
                  <span className="mr-2">✓</span>{s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderExplain = () => {
    const explain = insights.explanation;
    if (!explain) return <LoadingPlaceholder />;
    
    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-gray-200 text-sm">{explain.summary || 'Analysis in progress...'}</p>
        </div>
        
        {/* Business Logic */}
        {explain.businessLogic?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Business Logic Flow</h4>
            <ol className="space-y-1 text-sm text-gray-300">
              {explain.businessLogic.map((step, i) => (
                <li key={i} className="flex">
                  <span className="text-blue-400 mr-2 w-5">{i + 1}.</span>
                  {typeof step === 'string' ? step.replace(/^\d+\.\s*/, '') : String(step || '')}
                </li>
              ))}
            </ol>
          </div>
        )}
        
        {/* Data Flow */}
        {explain.dataFlow && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Data Flow</h4>
            <p className="text-sm text-gray-300 p-2 bg-gray-800/50 rounded font-mono">
              {explain.dataFlow}
            </p>
          </div>
        )}
        
        {/* Key Variables */}
        {explain.keyVariables?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Key Variables</h4>
            <div className="grid gap-2">
              {explain.keyVariables.slice(0, 5).map((v, i) => (
                <div key={i} className="flex text-sm">
                  <code className="text-purple-400 mr-2 min-w-[120px]">{v.name}</code>
                  <span className="text-gray-400">{v.purpose}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTests = () => {
    const tests = insights.tests;
    if (!tests) return <LoadingPlaceholder />;
    
    return (
      <div className="space-y-4">
        {/* Coverage */}
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-green-400 text-sm font-medium">{tests.coverage || 'Coverage analysis pending'}</p>
        </div>
        
        {/* Edge Cases */}
        {tests.edgeCases?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Edge Cases Covered</h4>
            <div className="flex flex-wrap gap-2">
              {tests.edgeCases.map((ec, i) => (
                <span key={i} className="px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded text-xs">
                  {ec}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Generated Tests Preview */}
        {tests.unitTests && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Generated Tests</h4>
            <pre className="text-xs text-gray-300 bg-gray-900 p-3 rounded-lg overflow-auto max-h-64">
              {tests.unitTests.substring(0, 1500)}
              {tests.unitTests.length > 1500 && '\n\n... (truncated)'}
            </pre>
          </div>
        )}
      </div>
    );
  };

  const renderOptimize = () => {
    const opt = insights.optimization;
    if (!opt) return <LoadingPlaceholder />;
    
    return (
      <div className="space-y-4">
        {/* Performance Score */}
        <div className="flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <div className="text-2xl font-bold text-purple-400">{opt.performanceScore ?? 'N/A'}</div>
          <div className="text-sm text-gray-400">Performance Score</div>
          <div className="ml-auto">
            <ProgressBar value={opt.performanceScore} color="purple" />
          </div>
        </div>
        
        {/* Suggestions */}
        {opt.suggestions?.length > 0 && (
          <div className="space-y-3">
            {opt.suggestions.map((s, i) => (
              <div key={i} className="p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-200">{s.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${getImpactColor(s.impact || 'low')}`}>
                    {(s.impact || 'low').toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-2">{s.description}</p>
                {s.code && (
                  <pre className="text-xs text-green-400 bg-gray-900 p-2 rounded overflow-x-auto">
                    {s.code}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderArchitecture = () => {
    const arch = insights.architecture;
    if (!arch) return <LoadingPlaceholder />;
    
    return (
      <div className="space-y-4">
        {/* Layers */}
        {arch.layers?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Architecture Layers</h4>
            <div className="flex flex-col gap-1">
              {arch.layers.map((layer, i) => (
                <div key={i} className="p-2 bg-gradient-to-r from-blue-500/20 to-transparent rounded text-sm text-blue-300">
                  {layer}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Patterns */}
        {arch.patterns?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Design Patterns</h4>
            <div className="flex flex-wrap gap-2">
              {arch.patterns.map((p, i) => (
                <span key={i} className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Recommendations */}
        {arch.recommendations?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Recommendations</h4>
            <ul className="space-y-2">
              {arch.recommendations.map((r, i) => (
                <li key={i} className="text-sm text-gray-300 flex items-start">
                  <span className="text-blue-400 mr-2">→</span>{r}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Mermaid Diagram */}
        {arch.diagram && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Architecture Diagram</h4>
            <pre className="text-xs text-gray-400 bg-gray-900 p-3 rounded overflow-x-auto">
              {arch.diagram}
            </pre>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (loading[activeTab]) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-blue-400 text-sm font-medium mb-4">Analyzing with Gemini 3...</p>
          
          {/* Live analysis steps */}
          <div className="w-full max-w-xs space-y-2">
            {analysisSteps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="text-green-400">✓</span>
                <span className="text-gray-500">{step}</span>
              </div>
            ))}
            {currentStep && !analysisSteps.includes(currentStep) && (
              <div className="flex items-center gap-2 text-xs animate-pulse">
                <span className="text-blue-400">→</span>
                <span className="text-gray-300">{currentStep}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    try {
      switch (activeTab) {
        case 'review': return renderReview();
        case 'explain': return renderExplain();
        case 'tests': return renderTests();
        case 'optimize': return renderOptimize();
        case 'architecture': return renderArchitecture();
        default: return null;
      }
    } catch (error) {
      console.error('Error rendering insight:', error);
      return (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">Failed to render analysis. Please try again.</p>
          <button 
            onClick={() => setLoadedTabs(prev => { const n = new Set(prev); n.delete(activeTab); return n; })}
            className="mt-2 text-xs text-blue-400 hover:underline"
          >
            Retry
          </button>
        </div>
      );
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      
      {/* Modal */}
      <div 
        className="fixed w-[500px] h-[600px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 flex flex-col"
        style={{
          left: `calc(50% - 250px + ${position.x}px)`,
          top: `calc(50% - 300px + ${position.y}px)`,
        }}
      >
        {/* Header - Draggable */}
        <div 
          className="flex items-center justify-between p-4 border-b border-gray-700 cursor-move select-none"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <span className="font-semibold text-white">AI Insights</span>
            <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">Gemini 3</span>
          </div>
          <button 
            onClick={onClose}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-700 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-0 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id 
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
            {loadedTabs.has(tab.id) && <span className="ml-1 text-green-400">✓</span>}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderContent()}
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t border-gray-700 bg-gray-800/50">
        <p className="text-xs text-gray-500 text-center">
          Powered by Gemini 3 Pro Preview
        </p>
      </div>
      </div>
    </>
  );
}

// Helper Components
function LoadingPlaceholder() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-800 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  const colorClass = {
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500'
  }[color] || 'bg-blue-500';
  
  return (
    <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
      <div 
        className={`h-full ${colorClass} transition-all duration-500`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

// Helper Functions
function getGradeColor(grade: string | undefined): string {
  if (!grade) return 'text-slate-400';
  if (grade.startsWith('A')) return 'text-green-400';
  if (grade.startsWith('B')) return 'text-blue-400';
  if (grade.startsWith('C')) return 'text-yellow-400';
  return 'text-red-400';
}

function getSeverityBg(severity: string): string {
  switch (severity) {
    case 'critical': return 'bg-red-500/10 border border-red-500/20 text-red-400';
    case 'warning': return 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400';
    default: return 'bg-blue-500/10 border border-blue-500/20 text-blue-400';
  }
}

function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'critical': return '🔴';
    case 'warning': return '🟡';
    default: return '🔵';
  }
}

function getImpactColor(impact: string): string {
  switch (impact) {
    case 'high': return 'bg-red-500/20 text-red-400';
    case 'medium': return 'bg-yellow-500/20 text-yellow-400';
    default: return 'bg-green-500/20 text-green-400';
  }
}
