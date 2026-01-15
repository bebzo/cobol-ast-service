"use client";

import { useState, ReactNode } from "react";
import { HelpCircle } from "lucide-react";

interface TooltipProps {
  content: string;
  title?: string;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  showIcon?: boolean;
}

export default function Tooltip({ 
  content, 
  title, 
  children, 
  position = "top",
  showIcon = false 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-slate-700 border-x-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-slate-700 border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-slate-700 border-y-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-slate-700 border-y-transparent border-l-transparent",
  };

  return (
    <div 
      className="relative inline-flex items-center gap-1"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {showIcon && (
        <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-indigo-400 cursor-help transition-colors" />
      )}
      
      {isVisible && (
        <div className={`absolute z-50 ${positionClasses[position]} pointer-events-none`}>
          <div className="bg-slate-700 border border-slate-600 rounded-lg shadow-xl px-3 py-2 max-w-xs">
            {title && (
              <p className="text-xs font-semibold text-indigo-300 mb-1">{title}</p>
            )}
            <p className="text-xs text-slate-300 whitespace-normal">{content}</p>
          </div>
          <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`} />
        </div>
      )}
    </div>
  );
}

// Metric-specific tooltips for the dashboard
export const METRIC_TOOLTIPS: Record<string, { title: string; content: string }> = {
  cobolLines: {
    title: "COBOL Lines",
    content: "Total number of lines in the original COBOL source code, including comments and blank lines."
  },
  pythonLines: {
    title: "Python Lines",
    content: "Number of lines generated in Python code. A reduction indicates better conciseness of modern code."
  },
  tests: {
    title: "Generated Tests",
    content: "Number of unit tests automatically generated to validate functional equivalence between COBOL and Python."
  },
  issues: {
    title: "Detected Issues",
    content: "Anomalies, obsolete patterns, or potential problems identified in the original COBOL code requiring attention."
  },
  improvements: {
    title: "Improvements",
    content: "Optimization suggestions for generated Python code: performance, readability, modern patterns."
  },
  confidence: {
    title: "Confidence Level",
    content: "Estimated probability that the migration is functionally equivalent. >85% = ready for UAT, <70% = expert review needed."
  },
  numericalEquivalence: {
    title: "Numerical Equivalence",
    content: "Arithmetic calculation precision: comparison of COBOL vs Python results on COMPUTE, ADD, SUBTRACT operations, etc."
  },
  behavioralEquivalence: {
    title: "Behavioral Equivalence",
    content: "Validation that control flow (IF, PERFORM, GO TO) produces the same state transitions."
  },
  edgeCaseCoverage: {
    title: "Edge Case Coverage",
    content: "Edge case testing: null values, negative values, very large values, empty strings, invalid dates."
  },
  semanticCoverage: {
    title: "Semantic Coverage",
    content: "Percentage of COBOL business logic correctly translated to Python."
  },
  performanceDeviation: {
    title: "Performance Deviation",
    content: "Execution time difference between COBOL and Python. Negative value = Python faster."
  },
  translationRate: {
    title: "Translation Rate",
    content: "Percentage of COBOL paragraphs successfully translated without fallback or stub."
  },
  complexity: {
    title: "Complexity",
    content: "Migration difficulty assessment: LOW (<50 lines, simple), MEDIUM (50-200 lines), HIGH (>200 lines, SQL, files)."
  },
  riskLevel: {
    title: "Risk Level",
    content: "Potential production impact: LOW = cosmetic, MEDIUM = functional, HIGH = data, CRITICAL = financial/legal."
  },
};
