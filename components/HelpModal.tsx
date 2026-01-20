"use client";

import { useState } from "react";
import { X, HelpCircle, AlertTriangle, Lightbulb, Shield, ExternalLink, BookOpen } from "lucide-react";

interface IssueHelp {
  title: string;
  description: string;
  whyImportant: string;
  pattern: string;
  fix: string;
  docLink?: string;
}

// Knowledge base for common COBOL migration issues
const ISSUE_KNOWLEDGE_BASE: Record<string, IssueHelp> = {
  "division": {
    title: "Division by Zero",
    description: "The COBOL code performs a division without checking if the divisor is zero.",
    whyImportant: "In COBOL, division by zero may produce different results depending on the compiler. In Python, this raises a ZeroDivisionError that interrupts the program.",
    pattern: "COMPUTE X = Y / Z",
    fix: "Add a check: if divisor != 0: result = dividend / divisor else: result = Decimal('0')",
    docLink: "https://docs.python.org/3/library/decimal.html"
  },
  "decimal": {
    title: "Decimal Precision",
    description: "COBOL calculations use PIC types with fixed precision (e.g., PIC 9(7)V99).",
    whyImportant: "Python float uses IEEE 754 which can introduce rounding errors. For financial calculations, this can cause penny differences.",
    pattern: "PIC S9(7)V99 COMP-3",
    fix: "Use decimal.Decimal with appropriate precision: from decimal import Decimal, ROUND_HALF_UP",
    docLink: "https://docs.python.org/3/library/decimal.html"
  },
  "date": {
    title: "Date Logic",
    description: "The code contains date or timestamp manipulations.",
    whyImportant: "COBOL and Python handle dates differently: formats (YYYYMMDD vs ISO), timezones, leap years.",
    pattern: "WS-DATE PIC 9(8)",
    fix: "Utilisez datetime avec timezone: from datetime import datetime, timezone",
    docLink: "https://docs.python.org/3/library/datetime.html"
  },
  "file": {
    title: "File Operations",
    description: "The COBOL program reads or writes sequential or indexed files.",
    whyImportant: "COBOL files have specific formats (fixed-width, EBCDIC) that are not directly compatible with Python.",
    pattern: "READ FILE-NAME INTO WS-RECORD",
    fix: "Use pandas for CSV or struct for fixed binary formats.",
    docLink: "https://pandas.pydata.org/docs/"
  },
  "sql": {
    title: "Embedded SQL",
    description: "The code contains EXEC SQL statements to access a database.",
    whyImportant: "COBOL SQL uses cursors and host variables that must be converted to Python parameters.",
    pattern: "EXEC SQL SELECT ... INTO :WS-VAR END-EXEC",
    fix: "Use SQLAlchemy or psycopg2 with parameterized queries to prevent SQL injection.",
    docLink: "https://docs.sqlalchemy.org/"
  },
  "obsolete": {
    title: "Obsolete Code",
    description: "The code uses rates, limits, or rules that are no longer valid.",
    whyImportant: "Hardcoded business constants (tax rates, thresholds) may be outdated and cause calculation errors.",
    pattern: "WS-TAX-RATE PIC V99 VALUE .15",
    fix: "Externalize configurations to JSON files or a database to allow updates without recompilation.",
  },
  "security": {
    title: "Security Vulnerability",
    description: "The code presents a potential security risk.",
    whyImportant: "Security flaws can expose sensitive data or allow attacks.",
    pattern: "MOVE PASSWORD TO WS-DISPLAY",
    fix: "Never display passwords. Use secure hashing libraries like bcrypt.",
  }
};

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  issueText: string;
  issueType?: "issue" | "improvement" | "security";
}

export function HelpModal({ isOpen, onClose, issueText, issueType = "issue" }: HelpModalProps) {
  if (!isOpen) return null;

  // Find matching help content based on keywords in the issue
  const findHelp = (): IssueHelp | null => {
    const lowerText = issueText.toLowerCase();
    if (lowerText.includes("division") || lowerText.includes("divide") || lowerText.includes("zero")) {
      return ISSUE_KNOWLEDGE_BASE.division;
    }
    if (lowerText.includes("decimal") || lowerText.includes("precision") || lowerText.includes("comp-3") || lowerText.includes("pic")) {
      return ISSUE_KNOWLEDGE_BASE.decimal;
    }
    if (lowerText.includes("date") || lowerText.includes("time") || lowerText.includes("timestamp")) {
      return ISSUE_KNOWLEDGE_BASE.date;
    }
    if (lowerText.includes("file") || lowerText.includes("read") || lowerText.includes("write") || lowerText.includes("sequential")) {
      return ISSUE_KNOWLEDGE_BASE.file;
    }
    if (lowerText.includes("sql") || lowerText.includes("database") || lowerText.includes("cursor")) {
      return ISSUE_KNOWLEDGE_BASE.sql;
    }
    if (lowerText.includes("obsolete") || lowerText.includes("1995") || lowerText.includes("outdated") || lowerText.includes("tax rate")) {
      return ISSUE_KNOWLEDGE_BASE.obsolete;
    }
    if (lowerText.includes("security") || lowerText.includes("password") || lowerText.includes("injection") || lowerText.includes("vulnerability")) {
      return ISSUE_KNOWLEDGE_BASE.security;
    }
    return null;
  };

  const help = findHelp();

  const iconMap = {
    issue: AlertTriangle,
    improvement: Lightbulb,
    security: Shield,
  };
  const colorMap = {
    issue: "text-red-400 bg-red-500/20",
    improvement: "text-amber-400 bg-amber-500/20",
    security: "text-purple-400 bg-purple-500/20",
  };

  const Icon = iconMap[issueType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-700 rounded-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${colorMap[issueType]} flex items-center justify-center`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white">{help?.title || "Help"}</h3>
              <p className="text-xs text-slate-400">Contextual Documentation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Original Issue */}
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Detected Issue</p>
            <p className="text-slate-200">{issueText}</p>
          </div>

          {help ? (
            <>
              {/* Description */}
              <div>
                <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Description</p>
                <p className="text-slate-300 text-sm">{help.description}</p>
              </div>

              {/* Why Important */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <p className="text-xs text-amber-400 mb-2 uppercase tracking-wide flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Why It's Important
                </p>
                <p className="text-amber-200 text-sm">{help.whyImportant}</p>
              </div>

              {/* Pattern */}
              <div>
                <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Typical COBOL Pattern</p>
                <pre className="bg-slate-900 rounded-lg p-3 text-amber-300 font-mono text-sm overflow-x-auto">
                  {help.pattern}
                </pre>
              </div>

              {/* Fix */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-xs text-green-400 mb-2 uppercase tracking-wide flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" /> Recommended Fix
                </p>
                <p className="text-green-200 text-sm font-mono">{help.fix}</p>
              </div>

              {/* Documentation Link */}
              {help.docLink && (
                <a
                  href={help.docLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm transition"
                >
                  <BookOpen className="w-4 h-4" />
                  Python Documentation
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No specific documentation available for this issue.</p>
              <p className="text-xs mt-2 text-slate-500">
                Consult COBOL/Python documentation or ask a question in the Gemini chat.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Small help button to trigger modal
interface HelpButtonProps {
  issueText: string;
  issueType?: "issue" | "improvement" | "security";
}

export function HelpButton({ issueText, issueType = "issue" }: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1 hover:bg-slate-600 rounded transition-colors"
        title="View help"
      >
        <HelpCircle className="w-4 h-4 text-slate-400 hover:text-indigo-400" />
      </button>
      <HelpModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        issueText={issueText}
        issueType={issueType}
      />
    </>
  );
}
