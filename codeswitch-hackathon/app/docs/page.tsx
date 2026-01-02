'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('quickstart');

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 p-6 fixed h-full">
        <Link href="/" className="text-2xl font-bold text-blue-400 block mb-8">CodeSwitch</Link>
        <nav className="space-y-2">
          {['quickstart', 'api', 'features', 'faq'].map((key) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`w-full text-left px-4 py-2 rounded-lg transition ${
                activeSection === key
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {key === 'quickstart' ? 'Quick Start' : key === 'api' ? 'API Reference' : key === 'features' ? 'Features' : 'FAQ'}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-6 left-6 right-6">
          <Link href="/" className="block text-center bg-slate-700 hover:bg-slate-600 py-2 rounded-lg text-sm">
            Back to App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-12">
        <div className="max-w-4xl">
          
          {activeSection === 'quickstart' && (
            <div>
              <h1 className="text-4xl font-bold mb-8">Quick Start</h1>
              <div className="prose prose-invert prose-lg max-w-none space-y-8">
                <section>
                  <h2 className="text-2xl font-semibold text-blue-400 mb-4">1. Upload Your COBOL Code</h2>
                  <ul className="list-disc list-inside space-y-2 text-slate-300">
                    <li>Click <strong>&quot;Upload .cbl&quot;</strong> or paste your code directly in the editor</li>
                    <li>Supports files up to 50,000 lines</li>
                    <li>Click <strong>&quot;Load Demo&quot;</strong> to try with a sample 10,000-line banking system</li>
                  </ul>
                </section>
                <section>
                  <h2 className="text-2xl font-semibold text-blue-400 mb-4">2. Analyze with Gemini AI</h2>
                  <ul className="list-disc list-inside space-y-2 text-slate-300">
                    <li>Click <strong>&quot;Refactor with Gemini&quot;</strong> to start the analysis</li>
                    <li>Large files are automatically split and processed in parallel</li>
                    <li>Wait for the transformation to complete (typically 3-15 seconds)</li>
                  </ul>
                </section>
                <section>
                  <h2 className="text-2xl font-semibold text-blue-400 mb-4">3. Explore the Results</h2>
                  <p className="text-slate-300 mb-2">Navigate through the tabs to see:</p>
                  <ul className="list-disc list-inside space-y-2 text-slate-300">
                    <li><strong>Python</strong>: Generated Python code with modern patterns</li>
                    <li><strong>Tests</strong>: Auto-generated pytest test suite</li>
                    <li><strong>Config</strong>: Extracted business rules as JSON</li>
                    <li><strong>Architecture</strong>: Visual module diagram</li>
                    <li><strong>Impact</strong>: Change risk analysis</li>
                  </ul>
                </section>
                <section>
                  <h2 className="text-2xl font-semibold text-blue-400 mb-4">4. Export Your Code</h2>
                  <p className="text-slate-300">Click <strong>&quot;Export&quot;</strong> to download Python source files, test files, configuration JSON, or a full PDF report.</p>
                </section>
              </div>
            </div>
          )}

          {activeSection === 'api' && (
            <div>
              <h1 className="text-4xl font-bold mb-8">API Reference</h1>
              <div className="prose prose-invert prose-lg max-w-none space-y-8">
                <section>
                  <h2 className="text-2xl font-semibold text-blue-400 mb-4">Authentication</h2>
                  <p className="text-slate-300 mb-4">All API requests require a Supabase API key:</p>
                  <pre className="bg-slate-800 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>Authorization: Bearer YOUR_SUPABASE_ANON_KEY</code>
                  </pre>
                </section>
                <section>
                  <h2 className="text-2xl font-semibold text-blue-400 mb-4">POST /api/analyse</h2>
                  <p className="text-slate-300 mb-4">Analyze COBOL code and generate Python translation.</p>
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">Request:</h3>
                  <pre className="bg-slate-800 p-4 rounded-lg overflow-x-auto text-sm mb-4">
                    <code>{`{
  "cobolCode": "IDENTIFICATION DIVISION...",
  "filename": "program.cbl"
}`}</code>
                  </pre>
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">Response:</h3>
                  <pre className="bg-slate-800 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{`{
  "python_code": "class Program:...",
  "unit_tests": "def test_program():...",
  "security_warnings": [...],
  "migration_score": { "confidence": 95 }
}`}</code>
                  </pre>
                </section>
                <section>
                  <h2 className="text-2xl font-semibold text-blue-400 mb-4">POST /api/chat</h2>
                  <p className="text-slate-300">Ask questions about the analyzed code using natural language.</p>
                </section>
                <section>
                  <h2 className="text-2xl font-semibold text-blue-400 mb-4">GET /api/health</h2>
                  <p className="text-slate-300">Check service status and Gemini API connectivity.</p>
                </section>
              </div>
            </div>
          )}

          {activeSection === 'features' && (
            <div>
              <h1 className="text-4xl font-bold mb-8">Features</h1>
              <div className="grid gap-6">
                {[
                  { title: 'Python Translation', desc: 'Converts COBOL to idiomatic Python 3.10+ with type hints, dataclasses, and clean architecture.' },
                  { title: 'Test Oracle', desc: 'Generates comprehensive pytest test suites with 85%+ coverage on average.' },
                  { title: 'Security Scanner', desc: 'Detects 50+ vulnerability patterns with CVSS scoring and remediation suggestions.' },
                  { title: 'Configuration Extraction', desc: 'Extracts business rules to JSON for easy maintenance and environment-specific overrides.' },
                  { title: 'Smart Chunking', desc: 'Automatically splits large files for parallel processing with intelligent merge and deduplication.' },
                  { title: 'Impact Analysis', desc: 'Maps module dependencies and identifies high-risk changes.' },
                  { title: 'Voice Assistant', desc: 'Natural language queries about any section of your codebase, powered by Gemini 2.0.' },
                ].map((feature, i) => (
                  <div key={i} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-xl font-semibold text-blue-400 mb-2">{feature.title}</h3>
                    <p className="text-slate-300">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'faq' && (
            <div>
              <h1 className="text-4xl font-bold mb-8">FAQ</h1>
              <div className="space-y-6">
                {[
                  { q: 'Is my code secure?', a: 'Yes. Your COBOL code is processed in-memory and never stored. All communication uses TLS encryption.' },
                  { q: 'What COBOL dialects are supported?', a: 'CodeSwitch supports COBOL-85, COBOL-2002, and most IBM Enterprise COBOL constructs.' },
                  { q: 'How accurate is the translation?', a: 'On average, 85-95% of code translates correctly. Complex date arithmetic and file I/O may require manual review.' },
                  { q: 'Can I use the generated code in production?', a: 'The generated code is a starting point. We strongly recommend running the generated test suite, code review, and additional integration testing.' },
                  { q: 'What is the maximum file size?', a: 'Free tier: 1,000 lines. Professional: 50,000 lines. Enterprise: Unlimited with chunking.' },
                  { q: 'Do you support CICS/DB2?', a: 'Partial support. EXEC CICS and EXEC SQL blocks are identified and translated to Python equivalents.' },
                  { q: 'Can I integrate with my CI/CD pipeline?', a: 'Yes! Use our REST API to integrate CodeSwitch into your build pipeline.' },
                ].map((faq, i) => (
                  <div key={i} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-2">{faq.q}</h3>
                    <p className="text-slate-400">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Hackathon Badge */}
        <div className="mt-16 pt-8 border-t border-slate-700">
          <p className="text-slate-500 text-sm">
            Powered by Google Gemini 2.0 | <span className="text-blue-400">Gemini API Developer Competition 2024</span>
          </p>
        </div>
      </main>
    </div>
  );
}
