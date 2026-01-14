"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  GitCompare,
  Link2,
  Scroll,
  FileDown,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Maximize2,
  Minimize2,
  Copy,
  Download,
  Layers,
  ArrowLeftRight,
} from 'lucide-react';
import {
  generateLineMappings,
  findPythonLinesForCobol,
  findCobolLinesForPython,
  calculateScrollSync,
  applyScrollSync,
  exportDiffToPDF,
  compareVersions,
  extractPythonMetrics,
  generateCodeDiff,
  LineMapping,
  ABTestVersion,
} from '@/lib/diff-features';

interface DiffPanelProps {
  cobolCode: string;
  pythonCode: string;
  filename?: string;
  versions?: ABTestVersion[];
  onVersionSelect?: (version: ABTestVersion) => void;
}

export default function DiffPanel({
  cobolCode,
  pythonCode,
  filename = 'program',
  versions = [],
  onVersionSelect,
}: DiffPanelProps) {
  // State
  const [selectedCobolLine, setSelectedCobolLine] = useState<number | null>(null);
  const [selectedPythonLine, setSelectedPythonLine] = useState<number | null>(null);
  const [highlightedPythonLines, setHighlightedPythonLines] = useState<number[]>([]);
  const [highlightedCobolLines, setHighlightedCobolLines] = useState<number[]>([]);
  const [syncScrollEnabled, setSyncScrollEnabled] = useState(true);
  const [showLineMapping, setShowLineMapping] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showABTest, setShowABTest] = useState(false);
  const [selectedVersionA, setSelectedVersionA] = useState<string | null>(null);
  const [selectedVersionB, setSelectedVersionB] = useState<string | null>(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [copiedSide, setCopiedSide] = useState<'cobol' | 'python' | null>(null);

  // Refs
  const cobolPanelRef = useRef<HTMLDivElement>(null);
  const pythonPanelRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  // Memoized line mappings
  const lineMappings = useMemo(() => {
    if (!cobolCode || !pythonCode) return [];
    return generateLineMappings(cobolCode, pythonCode);
  }, [cobolCode, pythonCode]);

  // Handle COBOL line click
  const handleCobolLineClick = useCallback((lineNumber: number) => {
    setSelectedCobolLine(lineNumber);
    setSelectedPythonLine(null); // Clear Python selection
    setHighlightedCobolLines([]); // Clear COBOL highlights
    const pythonLines = findPythonLinesForCobol(lineNumber, lineMappings);
    setHighlightedPythonLines(pythonLines);

    // Scroll Python panel to highlighted lines
    if (pythonLines.length > 0 && pythonPanelRef.current) {
      const targetLine = pythonLines[0];
      const lineHeight = 20; // Approximate line height
      pythonPanelRef.current.scrollTop = (targetLine - 5) * lineHeight;
    }
  }, [lineMappings]);

  // Handle Python line click (reverse mapping)
  const handlePythonLineClick = useCallback((lineNumber: number) => {
    setSelectedPythonLine(lineNumber);
    setSelectedCobolLine(null); // Clear COBOL selection
    setHighlightedPythonLines([]); // Clear Python highlights
    const cobolLines = findCobolLinesForPython(lineNumber, lineMappings);
    setHighlightedCobolLines(cobolLines);

    // Scroll COBOL panel to highlighted lines
    if (cobolLines.length > 0 && cobolPanelRef.current) {
      const targetLine = cobolLines[0];
      const lineHeight = 20; // Approximate line height
      cobolPanelRef.current.scrollTop = (targetLine - 5) * lineHeight;
    }
  }, [lineMappings]);

  // Sync scroll handler
  const handleScroll = useCallback((source: 'cobol' | 'python') => {
    if (!syncScrollEnabled || isScrolling.current) return;

    isScrolling.current = true;

    const sourcePanel = source === 'cobol' ? cobolPanelRef.current : pythonPanelRef.current;
    const targetPanel = source === 'cobol' ? pythonPanelRef.current : cobolPanelRef.current;

    if (sourcePanel && targetPanel) {
      const scrollPercent = calculateScrollSync(
        sourcePanel.scrollTop,
        sourcePanel.scrollHeight,
        sourcePanel.clientHeight
      );
      applyScrollSync(targetPanel, scrollPercent);
    }

    setTimeout(() => {
      isScrolling.current = false;
    }, 50);
  }, [syncScrollEnabled]);

  // Export PDF
  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      const blob = await exportDiffToPDF(cobolCode, pythonCode, filename);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_diff_report.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF export failed:', error);
    }
    setExportingPDF(false);
  };

  // Copy code to clipboard
  const handleCopy = async (side: 'cobol' | 'python') => {
    const code = side === 'cobol' ? cobolCode : pythonCode;
    await navigator.clipboard.writeText(code);
    setCopiedSide(side);
    setTimeout(() => setCopiedSide(null), 2000);
  };

  // A/B Test comparison
  const abTestResult = useMemo(() => {
    if (!showABTest || !selectedVersionA || !selectedVersionB) return null;
    const versionA = versions.find(v => v.id === selectedVersionA);
    const versionB = versions.find(v => v.id === selectedVersionB);
    if (!versionA || !versionB) return null;
    return compareVersions(versionA, versionB);
  }, [showABTest, selectedVersionA, selectedVersionB, versions]);

  // Render code with line numbers and highlighting
  const renderCode = (
    code: string,
    type: 'cobol' | 'python',
    onLineClick?: (line: number) => void,
    highlightedLines: number[] = []
  ) => {
    const lines = code.split('\n');
    return (
      <div className="font-mono text-xs">
        {lines.map((line, idx) => {
          const lineNum = idx + 1;
          const isHighlighted = highlightedLines.includes(lineNum);
          const isSelected = (type === 'cobol' && selectedCobolLine === lineNum) || 
                            (type === 'python' && selectedPythonLine === lineNum);
          
          return (
            <div
              key={lineNum}
              className={`flex hover:bg-slate-700/50 cursor-pointer transition-colors ${
                isHighlighted ? 'bg-yellow-500/20 border-l-2 border-yellow-400' : ''
              } ${isSelected ? 'bg-cyan-500/30 border-l-2 border-cyan-400' : ''}`}
              onClick={() => onLineClick?.(lineNum)}
            >
              <span className="text-slate-500 select-none w-12 text-right pr-3 py-0.5 flex-shrink-0">
                {lineNum}
              </span>
              <span className={`py-0.5 pr-4 whitespace-pre ${
                type === 'cobol' ? 'text-amber-200' : 'text-green-200'
              }`}>
                {highlightSyntax(line, type)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Simple syntax highlighting
  const highlightSyntax = (line: string, type: 'cobol' | 'python') => {
    if (type === 'cobol') {
      // COBOL keywords
      return line
        .replace(/(IDENTIFICATION|ENVIRONMENT|DATA|PROCEDURE|DIVISION|SECTION|PROGRAM-ID|AUTHOR|WORKING-STORAGE|PERFORM|MOVE|COMPUTE|IF|ELSE|END-IF|DISPLAY|STOP RUN|COPY|PIC|VALUE|CALL)/gi, 
          '<span class="text-purple-400 font-semibold">$1</span>')
        .replace(/(\d+)/g, '<span class="text-cyan-400">$1</span>')
        .replace(/(".*?")/g, '<span class="text-green-400">$1</span>')
        .replace(/(\*.*$)/gm, '<span class="text-slate-500 italic">$1</span>');
    } else {
      // Python keywords
      return line
        .replace(/\b(def|class|import|from|return|if|else|elif|for|while|try|except|with|as|self|True|False|None)\b/g,
          '<span class="text-purple-400 font-semibold">$1</span>')
        .replace(/(\d+\.?\d*)/g, '<span class="text-cyan-400">$1</span>')
        .replace(/(["'].*?["'])/g, '<span class="text-green-400">$1</span>')
        .replace(/(#.*$)/gm, '<span class="text-slate-500 italic">$1</span>');
    }
  };

  const cobolLines = cobolCode.split('\n').length;
  const pythonLines = pythonCode.split('\n').length;
  const ratio = cobolLines > 0 ? (pythonLines / cobolLines * 100).toFixed(0) : 0;

  return (
    <div className={`bg-slate-900 rounded-xl border border-slate-700 overflow-hidden ${
      isFullscreen ? 'fixed inset-4 z-50' : ''
    }`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-indigo-900/30 px-4 py-3 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitCompare className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-white">Interactive Diff v6.1</h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                COBOL: {cobolLines} lines
              </span>
              <span className="text-slate-500">→</span>
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                Python: {pythonLines} lines
              </span>
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded">
                {ratio}% ratio
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Line Mapping Toggle */}
            <button
              onClick={() => setShowLineMapping(!showLineMapping)}
              className={`p-2 rounded-lg transition ${
                showLineMapping ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
              title="Line Mapping"
            >
              <Link2 className="w-4 h-4" />
            </button>

            {/* Sync Scroll Toggle */}
            <button
              onClick={() => setSyncScrollEnabled(!syncScrollEnabled)}
              className={`p-2 rounded-lg transition ${
                syncScrollEnabled ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
              title="Sync Scroll"
            >
              <Scroll className="w-4 h-4" />
            </button>

            {/* A/B Test Toggle */}
            {versions.length >= 2 && (
              <button
                onClick={() => setShowABTest(!showABTest)}
                className={`p-2 rounded-lg transition ${
                  showABTest ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
                title="A/B Testing"
              >
                <FlaskConical className="w-4 h-4" />
              </button>
            )}

            {/* Export PDF */}
            <button
              onClick={handleExportPDF}
              disabled={exportingPDF}
              className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition disabled:opacity-50"
              title="Export PDF"
            >
              {exportingPDF ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Feature hints */}
        {showLineMapping && (
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
            <Link2 className="w-3 h-3" />
            <span>Click on a COBOL line to highlight the corresponding Python code</span>
          </div>
        )}
      </div>

      {/* A/B Test Panel */}
      {showABTest && versions.length >= 2 && (
        <div className="bg-purple-900/20 border-b border-purple-500/30 p-4">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-purple-400 font-semibold text-sm">A/B Testing</span>
            <div className="flex items-center gap-2">
              <select
                value={selectedVersionA || ''}
                onChange={(e) => setSelectedVersionA(e.target.value)}
                className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white"
              >
                <option value="">Select Version A</option>
                {versions.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              <ArrowLeftRight className="w-4 h-4 text-purple-400" />
              <select
                value={selectedVersionB || ''}
                onChange={(e) => setSelectedVersionB(e.target.value)}
                className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white"
              >
                <option value="">Select Version B</option>
                {versions.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>

          {abTestResult && (
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <p className={`text-xl font-bold ${abTestResult.linesDiff < 0 ? 'text-green-400' : abTestResult.linesDiff > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {abTestResult.linesDiff > 0 ? '+' : ''}{abTestResult.linesDiff}
                </p>
                <p className="text-xs text-slate-400">Lines Diff</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-cyan-400">
                  {abTestResult.linesPercent > 0 ? '+' : ''}{abTestResult.linesPercent.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-400">Size Change</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-purple-400">
                  {abTestResult.methodsDiff > 0 ? '+' : ''}{abTestResult.methodsDiff}
                </p>
                <p className="text-xs text-slate-400">Methods Diff</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <p className={`text-xl font-bold ${
                  abTestResult.winner === 'A' ? 'text-amber-400' : 
                  abTestResult.winner === 'B' ? 'text-green-400' : 'text-slate-400'
                }`}>
                  {abTestResult.winner === 'tie' ? 'TIE' : `Version ${abTestResult.winner}`}
                </p>
                <p className="text-xs text-slate-400">Winner</p>
              </div>
            </div>
          )}

          {abTestResult && abTestResult.analysis.length > 0 && (
            <div className="mt-3 space-y-1">
              {abTestResult.analysis.map((item, idx) => (
                <p key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-400" />
                  {item}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Code Panels */}
      <div className={`flex ${isFullscreen ? 'h-[calc(100%-120px)]' : 'h-[500px]'}`}>
        {/* COBOL Panel */}
        <div className="flex-1 flex flex-col border-r border-slate-700">
          <div className="flex items-center justify-between px-4 py-2 bg-amber-900/20 border-b border-amber-500/30">
            <span className="text-amber-400 font-semibold text-sm flex items-center gap-2">
              <Layers className="w-4 h-4" />
              COBOL Original
            </span>
            <button
              onClick={() => handleCopy('cobol')}
              className="p-1.5 rounded hover:bg-amber-500/20 transition"
              title="Copy COBOL code"
            >
              {copiedSide === 'cobol' ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-amber-400" />
              )}
            </button>
          </div>
          <div
            ref={cobolPanelRef}
            className="flex-1 overflow-auto bg-slate-950"
            onScroll={() => handleScroll('cobol')}
          >
            {renderCode(cobolCode, 'cobol', showLineMapping ? handleCobolLineClick : undefined, highlightedCobolLines)}
          </div>
        </div>

        {/* Python Panel */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 bg-green-900/20 border-b border-green-500/30">
            <span className="text-green-400 font-semibold text-sm flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Python Generated
            </span>
            <div className="flex items-center gap-2">
              {highlightedPythonLines.length > 0 && (
                <span className="text-xs text-yellow-400 bg-yellow-500/20 px-2 py-0.5 rounded">
                  {highlightedPythonLines.length} lines highlighted
                </span>
              )}
              <button
                onClick={() => handleCopy('python')}
                className="p-1.5 rounded hover:bg-green-500/20 transition"
                title="Copy Python code"
              >
                {copiedSide === 'python' ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-green-400" />
                )}
              </button>
            </div>
          </div>
          <div
            ref={pythonPanelRef}
            className="flex-1 overflow-auto bg-slate-950"
            onScroll={() => handleScroll('python')}
          >
            {renderCode(pythonCode, 'python', showLineMapping ? handlePythonLineClick : undefined, highlightedPythonLines)}
          </div>
        </div>
      </div>

      {/* Mapping Info */}
      {showLineMapping && lineMappings.length > 0 && (
        <div className="bg-slate-800/50 border-t border-slate-700 px-4 py-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {lineMappings.length} line mappings detected
            </span>
            {selectedCobolLine && (
              <span className="text-cyan-400">
                COBOL Line {selectedCobolLine} → Python Lines {highlightedPythonLines.join(', ') || 'none'}
              </span>
            )}
            {selectedPythonLine && (
              <span className="text-green-400">
                Python Line {selectedPythonLine} → COBOL Lines {highlightedCobolLines.join(', ') || 'none'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
