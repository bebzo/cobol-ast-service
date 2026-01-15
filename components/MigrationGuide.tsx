"use client";

import { useState } from "react";
import { 
  X, 
  BookOpen, 
  Upload, 
  Cpu, 
  TestTube, 
  FileCheck, 
  ChevronRight,
  HelpCircle,
  Zap,
  Shield,
  MessageSquare
} from "lucide-react";

interface MigrationGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MigrationGuide({ isOpen, onClose }: MigrationGuideProps) {
  const [activeStep, setActiveStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      icon: Upload,
      title: "1. Upload COBOL Code",
      description: "Import your COBOL file (.cbl, .cob) or paste the code directly.",
      details: [
        "Supported formats: COBOL-85, COBOL-2002, IBM Enterprise COBOL",
        "Recommended max size: 5000 lines per file",
        "COPYBOOKS can be uploaded separately",
        "Code is analyzed locally before sending to the API"
      ],
      tip: "💡 Use 'Load Demo' to test with a sample payroll code."
    },
    {
      icon: Cpu,
      title: "2. Analysis & Transpilation",
      description: "AI analyzes the structure and generates equivalent Python code.",
      details: [
        "AST parsing of COBOL code (paragraphs, variables, divisions)",
        "Detection of obsolete patterns and vulnerabilities",
        "Python code generation with dataclasses and typing",
        "Automatic unit test creation"
      ],
      tip: "💡 SSE analysis shows real-time progress."
    },
    {
      icon: TestTube,
      title: "3. Test Validation",
      description: "Tests are executed to validate functional equivalence.",
      details: [
        "Unit tests with numeric assertions",
        "Edge case tests (zero, negative, overflow)",
        "Property tests (monotonicity, identity)",
        "Execution via Pyodide in the browser"
      ],
      tip: "💡 A pass rate >95% indicates reliable migration."
    },
    {
      icon: FileCheck,
      title: "4. Certification & Export",
      description: "Generate an equivalence certificate and export the code.",
      details: [
        "PDF certificate with detailed metrics",
        "Export to Django, FastAPI, or standard Python module",
        "Mermaid architecture diagram",
        "Security report with CVSS score"
      ],
      tip: "💡 The certificate can serve as audit proof for compliance."
    }
  ];

  const faqs = [
    {
      q: "Is the Python code truly equivalent to the COBOL?",
      a: "Yes, within the limits of language differences. Decimal calculations use Decimal to preserve COMP-3 precision. Tests validate numerical equivalence."
    },
    {
      q: "Can I use the generated code in production?",
      a: "The code is designed to be production-ready, but we recommend review by a COBOL expert and UAT testing before deployment."
    },
    {
      q: "How is sensitive data handled?",
      a: "COBOL code is sent to the Gemini API for analysis. Data is not stored. For regulated environments, use a private instance."
    },
    {
      q: "What to do if tests fail?",
      a: "Failures may indicate expected behavioral differences (variable initialization). Use the Gemini chat to understand each failure."
    },
    {
      q: "Are COPYBOOKS supported?",
      a: "Yes! Upload your COPYBOOK files (.cpy) separately. They will be automatically included in the analysis."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-slate-800 border border-indigo-500/30 rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-lg font-bold text-white">COBOL → Python Migration Guide</h2>
              <p className="text-xs text-indigo-200">CodeSwitch Pro - Interactive Documentation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Workflow Steps */}
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
              Migration Workflow
            </h3>
            
            {/* Step Progress */}
            <div className="flex items-center justify-between mb-6">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center">
                  <button
                    onClick={() => setActiveStep(idx)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                      activeStep === idx 
                        ? "bg-indigo-500 text-white" 
                        : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                    }`}
                  >
                    <step.icon className="w-5 h-5" />
                  </button>
                  {idx < steps.length - 1 && (
                    <ChevronRight className="w-5 h-5 text-slate-600 mx-2" />
                  )}
                </div>
              ))}
            </div>

            {/* Active Step Details */}
            <div className="bg-slate-900/50 rounded-lg p-5 border border-slate-700">
              <h4 className="text-lg font-semibold text-white mb-2">
                {steps[activeStep].title}
              </h4>
              <p className="text-slate-300 mb-4">{steps[activeStep].description}</p>
              
              <ul className="space-y-2 mb-4">
                {steps[activeStep].details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                    <ChevronRight className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    {detail}
                  </li>
                ))}
              </ul>

              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg px-4 py-2">
                <p className="text-sm text-indigo-300">{steps[activeStep].tip}</p>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
              Key Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-emerald-500/30">
                <Zap className="w-8 h-8 text-emerald-400 mb-2" />
                <h4 className="font-semibold text-emerald-300 mb-1">AI Transpilation</h4>
                <p className="text-xs text-slate-400">
                  Gemini 2.0 analyzes business context and generates idiomatic Python code.
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-purple-500/30">
                <TestTube className="w-8 h-8 text-purple-400 mb-2" />
                <h4 className="font-semibold text-purple-300 mb-1">Automatic Tests</h4>
                <p className="text-xs text-slate-400">
                  Unit tests and property-based tests generated and executed in the browser.
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-red-500/30">
                <Shield className="w-8 h-8 text-red-400 mb-2" />
                <h4 className="font-semibold text-red-300 mb-1">Security Analysis</h4>
                <p className="text-xs text-slate-400">
                  Vulnerability detection with CVSS scoring and recommendations.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              Frequently Asked Questions
            </h3>
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <details key={idx} className="bg-slate-900/50 rounded-lg border border-slate-700 group">
                  <summary className="px-4 py-3 cursor-pointer text-slate-200 font-medium hover:text-indigo-300 transition">
                    {faq.q}
                  </summary>
                  <div className="px-4 pb-3 text-sm text-slate-400">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-slate-900/50 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <MessageSquare className="w-4 h-4" />
                Questions? Use the Gemini chat for contextual help.
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition"
              >
                Start Migration
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
