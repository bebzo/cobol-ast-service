"use client";

import { useState, useMemo } from "react";
import { X, Search, BookOpen, Code2, ArrowRight } from "lucide-react";

interface GlossaryTerm {
  term: string;
  category: "cobol" | "python" | "migration" | "testing";
  definition: string;
  cobolExample?: string;
  pythonEquivalent?: string;
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  // COBOL Terms
  {
    term: "IDENTIFICATION DIVISION",
    category: "cobol",
    definition: "First division of a COBOL program containing metadata: program name, author, date.",
    cobolExample: "IDENTIFICATION DIVISION.\nPROGRAM-ID. PAYROLL.",
    pythonEquivalent: '"""Module docstring with author and description"""'
  },
  {
    term: "DATA DIVISION",
    category: "cobol",
    definition: "Division containing all variable and data structure definitions.",
    cobolExample: "DATA DIVISION.\nWORKING-STORAGE SECTION.",
    pythonEquivalent: "@dataclass\nclass DataStructure:"
  },
  {
    term: "WORKING-STORAGE",
    category: "cobol",
    definition: "Section for local variables that persist between paragraph calls.",
    cobolExample: "01 WS-COUNTER PIC 9(5) VALUE 0.",
    pythonEquivalent: "self.counter: int = 0"
  },
  {
    term: "PROCEDURE DIVISION",
    category: "cobol",
    definition: "Division containing the executable program logic (equivalent to main).",
    cobolExample: "PROCEDURE DIVISION.\n  PERFORM 1000-INIT.",
    pythonEquivalent: "def main(self):\n    self.init()"
  },
  {
    term: "PIC / PICTURE",
    category: "cobol",
    definition: "Clause defining a variable's format: type, size, decimals.",
    cobolExample: "PIC S9(7)V99 COMP-3",
    pythonEquivalent: "Decimal('0.00')  # with precision"
  },
  {
    term: "COMP-3",
    category: "cobol",
    definition: "Packed-decimal storage format used for precise financial calculations.",
    cobolExample: "01 WS-AMOUNT PIC S9(9)V99 COMP-3.",
    pythonEquivalent: "from decimal import Decimal"
  },
  {
    term: "PERFORM",
    category: "cobol",
    definition: "Instruction to call a paragraph or section (equivalent to a function call).",
    cobolExample: "PERFORM 2000-CALCULATE THRU 2000-EXIT.",
    pythonEquivalent: "self.calculate()"
  },
  {
    term: "COMPUTE",
    category: "cobol",
    definition: "Instruction to perform arithmetic calculations with expressions.",
    cobolExample: "COMPUTE WS-TAX = WS-GROSS * WS-RATE.",
    pythonEquivalent: "tax = gross * rate"
  },
  {
    term: "COPYBOOK",
    category: "cobol",
    definition: "Reusable file containing data definitions, included via COPY statement.",
    cobolExample: "COPY CUSTOMER-RECORD.",
    pythonEquivalent: "from models import CustomerRecord"
  },
  {
    term: "88 Level",
    category: "cobol",
    definition: "Condition-name: boolean value linked to a parent variable.",
    cobolExample: "01 WS-STATUS PIC X.\n   88 IS-ACTIVE VALUE 'A'.",
    pythonEquivalent: "@property\ndef is_active(self) -> bool:\n    return self.status == 'A'"
  },
  
  // Python Terms
  {
    term: "dataclass",
    category: "python",
    definition: "Python decorator that automatically generates __init__, __repr__, etc. for data classes.",
    pythonEquivalent: "@dataclass\nclass Employee:\n    name: str\n    salary: Decimal"
  },
  {
    term: "Decimal",
    category: "python",
    definition: "Python type for precise decimal calculations, essential for finance.",
    pythonEquivalent: "from decimal import Decimal, ROUND_HALF_UP"
  },
  {
    term: "typing",
    category: "python",
    definition: "Module for static type annotations in Python.",
    pythonEquivalent: "from typing import List, Optional, Dict"
  },

  // Migration Terms
  {
    term: "Numerical Equivalence",
    category: "migration",
    definition: "Validation that Python calculations produce exactly the same results as COBOL."
  },
  {
    term: "Behavioral Equivalence",
    category: "migration",
    definition: "Validation that control flow and state transitions are identical."
  },
  {
    term: "Transpilation",
    category: "migration",
    definition: "Conversion of source code from one language to another while preserving semantics."
  },
  {
    term: "Fallback",
    category: "migration",
    definition: "Generic code used when a COBOL instruction has no direct equivalent."
  },

  // Testing Terms
  {
    term: "Property-Based Testing",
    category: "testing",
    definition: "Tests that verify mathematical properties rather than specific values."
  },
  {
    term: "Edge Case",
    category: "testing",
    definition: "Boundary case: extreme values (0, negative, max) that may cause bugs."
  },
  {
    term: "Regression Safety",
    category: "testing",
    definition: "Guarantee that modifications don't introduce new bugs."
  }
];

interface GlossaryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Glossary({ isOpen, onClose }: GlossaryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredTerms = useMemo(() => {
    return GLOSSARY_TERMS.filter(term => {
      const matchesSearch = term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           term.definition.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !activeCategory || term.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory]);

  const categories = [
    { id: "cobol", label: "COBOL", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
    { id: "python", label: "Python", color: "bg-green-500/20 text-green-300 border-green-500/30" },
    { id: "migration", label: "Migration", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
    { id: "testing", label: "Testing", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-700 rounded-xl max-w-3xl w-full mx-4 max-h-[85vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <div>
              <h2 className="text-lg font-bold text-white">COBOL/Python Glossary</h2>
              <p className="text-xs text-slate-400">{GLOSSARY_TERMS.length} documented terms</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-700 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search for a term..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                !activeCategory 
                  ? "bg-indigo-500 text-white" 
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id === activeCategory ? null : cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                  activeCategory === cat.id 
                    ? cat.color 
                    : "bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Terms List */}
        <div className="overflow-y-auto max-h-[calc(85vh-180px)] p-4 space-y-3">
          {filteredTerms.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No terms found for "{searchTerm}"</p>
            </div>
          ) : (
            filteredTerms.map((term, idx) => {
              const catColor = categories.find(c => c.id === term.category)?.color || "";
              return (
                <div key={idx} className="bg-slate-900/50 rounded-lg border border-slate-700 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-indigo-400" />
                      {term.term}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${catColor}`}>
                      {term.category.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mb-3">{term.definition}</p>
                  
                  {(term.cobolExample || term.pythonEquivalent) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {term.cobolExample && (
                        <div className="bg-amber-500/10 rounded p-2 border border-amber-500/20">
                          <p className="text-[10px] text-amber-400 uppercase mb-1">COBOL</p>
                          <pre className="text-xs text-amber-200 font-mono whitespace-pre-wrap">{term.cobolExample}</pre>
                        </div>
                      )}
                      {term.pythonEquivalent && (
                        <div className="bg-green-500/10 rounded p-2 border border-green-500/20">
                          <p className="text-[10px] text-green-400 uppercase mb-1 flex items-center gap-1">
                            {term.cobolExample && <ArrowRight className="w-3 h-3" />}
                            Python
                          </p>
                          <pre className="text-xs text-green-200 font-mono whitespace-pre-wrap">{term.pythonEquivalent}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// Inline clickable term component
interface GlossaryTermProps {
  term: string;
  children?: React.ReactNode;
}

export function GlossaryTerm({ term, children }: GlossaryTermProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const termData = GLOSSARY_TERMS.find(t => 
    t.term.toLowerCase() === term.toLowerCase()
  );

  if (!termData) {
    return <span>{children || term}</span>;
  }

  return (
    <span 
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="border-b border-dashed border-indigo-400 text-indigo-300 cursor-help">
        {children || term}
      </span>
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 pointer-events-none">
          <div className="bg-slate-700 border border-slate-600 rounded-lg shadow-xl p-3">
            <p className="text-xs font-semibold text-indigo-300 mb-1">{termData.term}</p>
            <p className="text-xs text-slate-300">{termData.definition}</p>
          </div>
        </div>
      )}
    </span>
  );
}
