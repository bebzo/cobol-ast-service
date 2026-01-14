'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { 
  ChevronRight, Code2, TestTube, Shield, FileText, 
  GitCompare, Boxes, Layers, BarChart3, Network, MessageSquare,
  Download, Zap, Lock, Globe, Terminal, BookOpen, Play,
  CheckCircle, ArrowRight, ExternalLink
} from 'lucide-react';

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('quickstart');
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const sections = [
    { id: 'quickstart', label: 'Quick Start', icon: <Play className="w-4 h-4" /> },
    { id: 'features', label: 'Features', icon: <Zap className="w-4 h-4" /> },
    { id: 'python', label: 'Python Translation', icon: <Code2 className="w-4 h-4" /> },
    { id: 'tests', label: 'Test Oracle', icon: <TestTube className="w-4 h-4" /> },
    { id: 'diff', label: 'Smart Diff', icon: <GitCompare className="w-4 h-4" /> },
    { id: 'architecture', label: 'Architecture', icon: <Boxes className="w-4 h-4" /> },
    { id: 'ddd', label: 'DDD Export', icon: <Layers className="w-4 h-4" /> },
    { id: 'security', label: 'Security Scanner', icon: <Shield className="w-4 h-4" /> },
    { id: 'chat', label: 'AI Assistant', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'api', label: 'API Reference', icon: <Terminal className="w-4 h-4" /> },
    { id: 'faq', label: 'FAQ', icon: <BookOpen className="w-4 h-4" /> },
  ];

  const ImageModal = ({ src, onClose }: { src: string; onClose: () => void }) => (
    <div 
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8 cursor-zoom-out"
      onClick={onClose}
    >
      <img src={src} alt="Enlarged view" className="max-w-full max-h-full rounded-lg shadow-2xl" />
      <button className="absolute top-4 right-4 text-white bg-slate-800 rounded-full p-2 hover:bg-slate-700">
        ✕
      </button>
    </div>
  );

  const Screenshot = ({ src, alt, caption }: { src: string; alt: string; caption?: string }) => (
    <div className="my-6">
      <div 
        className="rounded-xl overflow-hidden border border-slate-600 shadow-2xl cursor-zoom-in hover:border-blue-500 transition-all"
        onClick={() => setExpandedImage(src)}
      >
        <img src={src} alt={alt} className="w-full" />
      </div>
      {caption && <p className="text-sm text-slate-400 mt-2 text-center italic">{caption}</p>}
    </div>
  );

  const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
    <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-blue-500/50 transition-all group">
      <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400">{desc}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      {/* Expanded Image Modal */}
      {expandedImage && <ImageModal src={expandedImage} onClose={() => setExpandedImage(null)} />}

      {/* Sidebar */}
      <aside className="w-72 bg-slate-800/50 border-r border-slate-700 p-6 fixed h-full overflow-y-auto">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Code2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-white">CodeSwitch</span>
            <span className="text-xs text-blue-400 block">Pro v8.5</span>
          </div>
        </Link>

        <div className="mb-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Documentation</span>
        </div>

        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition text-sm ${
                activeSection === section.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              {section.icon}
              {section.label}
              {activeSection === section.id && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6 space-y-2">
          <Link href="/dashboard" className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 py-2.5 rounded-lg text-sm font-medium transition">
            <Play className="w-4 h-4" /> Launch App
          </Link>
          <Link href="/" className="block text-center text-slate-400 hover:text-white py-2 text-sm">
            ← Back to Home
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-72 flex-1 p-12">
        <div className="max-w-5xl">
          
          {/* QUICK START */}
          {activeSection === 'quickstart' && (
            <div className="animate-fadeIn">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-xs font-medium">Getting Started</span>
              </div>
              <h1 className="text-4xl font-bold mb-4">Quick Start Guide</h1>
              <p className="text-xl text-slate-400 mb-8">Transform your COBOL codebase to Python in minutes with AI-powered analysis.</p>

              <Screenshot 
                src="/docs/02-cobol-loaded.png" 
                alt="CodeSwitch interface with COBOL loaded"
                caption="The CodeSwitch Pro interface with a 10,000-line COBOL banking system loaded"
              />

              <div className="space-y-8 mt-8">
                <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <h2 className="text-2xl font-semibold">Upload Your COBOL Code</h2>
                  </div>
                  <ul className="space-y-3 text-slate-300 ml-11">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Click <strong className="text-white">"Upload .cbl"</strong> or paste your code directly in the editor</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Supports files up to <strong className="text-white">50,000+ lines</strong> with smart chunking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Try <strong className="text-white">"Load Demo"</strong> to explore with a sample banking system</span>
                    </li>
                  </ul>
                </section>

                <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <h2 className="text-2xl font-semibold">Analyze with Gemini AI</h2>
                  </div>
                  <ul className="space-y-3 text-slate-300 ml-11">
                    <li className="flex items-start gap-2">
                      <Zap className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span>Click <strong className="text-white">"Refactor with Gemini"</strong> to start AI analysis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Zap className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span>Large files are automatically split and processed in parallel</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Zap className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span>Typical processing: <strong className="text-white">3-15 seconds</strong> depending on size</span>
                    </li>
                  </ul>
                </section>

                <Screenshot 
                  src="/docs/03-analyzing.png" 
                  alt="Analysis in progress"
                  caption="Real-time progress during Gemini AI analysis"
                />

                <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <h2 className="text-2xl font-semibold">Explore Results</h2>
                  </div>
                  <p className="text-slate-300 mb-4 ml-11">Navigate through 12+ specialized tabs to explore every aspect of your migration:</p>
                  <div className="grid grid-cols-2 gap-3 ml-11">
                    {[
                      { name: 'Python', desc: 'Generated code with type hints' },
                      { name: 'Tests', desc: 'Auto-generated pytest suite' },
                      { name: 'Diff', desc: 'Line-by-line mapping' },
                      { name: 'Architecture', desc: 'Visual module diagram' },
                      { name: 'DDD', desc: 'Clean architecture export' },
                      { name: 'Report', desc: 'Security & migration report' },
                    ].map((tab) => (
                      <div key={tab.name} className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
                        <ArrowRight className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-medium">{tab.name}</span>
                        <span className="text-slate-500 text-sm">- {tab.desc}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">4</div>
                    <h2 className="text-2xl font-semibold">Export & Deploy</h2>
                  </div>
                  <ul className="space-y-3 text-slate-300 ml-11">
                    <li className="flex items-start gap-2">
                      <Download className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>Export Python source files, tests, and configuration</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Download className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>Download complete PDF migration report</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Download className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>Export to Django, FastAPI, or Flask frameworks</span>
                    </li>
                  </ul>
                </section>
              </div>
            </div>
          )}

          {/* FEATURES OVERVIEW */}
          {activeSection === 'features' && (
            <div className="animate-fadeIn">
              <h1 className="text-4xl font-bold mb-4">All Features</h1>
              <p className="text-xl text-slate-400 mb-8">CodeSwitch Pro v8.5 includes everything you need for enterprise COBOL migration.</p>

              <div className="grid md:grid-cols-2 gap-6">
                <FeatureCard 
                  icon={<Code2 className="w-6 h-6" />}
                  title="Python Translation"
                  desc="Modern Python 3.10+ with type hints, dataclasses, Decimal precision, and PEP8 compliance."
                />
                <FeatureCard 
                  icon={<TestTube className="w-6 h-6" />}
                  title="Test Oracle"
                  desc="Auto-generated pytest suite with 85%+ coverage, edge cases, and equivalence testing."
                />
                <FeatureCard 
                  icon={<GitCompare className="w-6 h-6" />}
                  title="Smart Diff View"
                  desc="Interactive line-by-line mapping between COBOL and Python with clickable navigation."
                />
                <FeatureCard 
                  icon={<Boxes className="w-6 h-6" />}
                  title="Architecture Diagram"
                  desc="Auto-generated Mermaid diagrams showing module dependencies and data flow."
                />
                <FeatureCard 
                  icon={<Layers className="w-6 h-6" />}
                  title="DDD Export"
                  desc="Domain-Driven Design structure with clean architecture layers ready for production."
                />
                <FeatureCard 
                  icon={<Shield className="w-6 h-6" />}
                  title="Security Scanner"
                  desc="50+ vulnerability patterns detected with CVSS scoring and remediation guidance."
                />
                <FeatureCard 
                  icon={<MessageSquare className="w-6 h-6" />}
                  title="AI Chat Assistant"
                  desc="Ask questions about your code in natural language, powered by Gemini 2.0."
                />
                <FeatureCard 
                  icon={<BarChart3 className="w-6 h-6" />}
                  title="Real-time Dashboard"
                  desc="Live metrics showing confidence scores, complexity analysis, and migration progress."
                />
                <FeatureCard 
                  icon={<Network className="w-6 h-6" />}
                  title="Call Graph"
                  desc="Interactive visualization of function calls and procedure dependencies."
                />
                <FeatureCard 
                  icon={<FileText className="w-6 h-6" />}
                  title="Impact Analysis"
                  desc="Risk assessment for each module with change impact predictions."
                />
                <FeatureCard 
                  icon={<Globe className="w-6 h-6" />}
                  title="Framework Export"
                  desc="One-click export to Django, FastAPI, or Flask with proper project structure."
                />
                <FeatureCard 
                  icon={<Lock className="w-6 h-6" />}
                  title="Enterprise Security"
                  desc="No code storage, TLS encryption, SOC2 compliant processing."
                />
              </div>

              <Screenshot 
                src="/docs/07-metrics.png" 
                alt="Dashboard metrics"
                caption="Real-time dashboard showing migration metrics and code quality scores"
              />
            </div>
          )}

          {/* PYTHON TRANSLATION */}
          {activeSection === 'python' && (
            <div className="animate-fadeIn">
              <h1 className="text-4xl font-bold mb-4">Python Translation</h1>
              <p className="text-xl text-slate-400 mb-8">Generate modern, idiomatic Python code from legacy COBOL.</p>

              <Screenshot 
                src="/docs/04-python-result.png" 
                alt="Python translation result"
                caption="Generated Python code with syntax highlighting and confidence indicators"
              />

              <div className="space-y-6 mt-8">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-xl font-semibold text-blue-400 mb-4">What You Get</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      'Type hints for all parameters and returns',
                      'Dataclasses for COBOL record structures',
                      'Decimal type for precise financial math',
                      'Proper error handling with try/except',
                      'Clean function and class naming',
                      'Comprehensive docstrings',
                      'PEP8 compliant formatting',
                      'Preserved business logic comments',
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-slate-300">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-xl font-semibold text-blue-400 mb-4">Example Translation</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500 mb-2">COBOL Input:</p>
                      <pre className="bg-slate-900 p-4 rounded-lg text-sm overflow-x-auto text-green-400">
{`01 WS-ACCOUNT.
   05 WS-ACCT-NO    PIC 9(10).
   05 WS-BALANCE    PIC S9(13)V99.
   05 WS-STATUS     PIC X(1).
   
COMPUTE WS-BALANCE = 
   WS-BALANCE + WS-DEPOSIT
   - WS-WITHDRAWAL.`}
                      </pre>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-2">Python Output:</p>
                      <pre className="bg-slate-900 p-4 rounded-lg text-sm overflow-x-auto text-blue-400">
{`@dataclass
class Account:
    acct_no: str  # PIC 9(10)
    balance: Decimal  # S9(13)V99
    status: str  # PIC X(1)

def compute_balance(
    account: Account,
    deposit: Decimal,
    withdrawal: Decimal
) -> Decimal:
    return (account.balance 
            + deposit - withdrawal)`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TEST ORACLE */}
          {activeSection === 'tests' && (
            <div className="animate-fadeIn">
              <h1 className="text-4xl font-bold mb-4">Test Oracle</h1>
              <p className="text-xl text-slate-400 mb-8">Automatically generated test suites ensure your migration preserves business logic.</p>

              <Screenshot 
                src="/docs/05-tests.png" 
                alt="Generated tests"
                caption="Auto-generated pytest test suite with comprehensive coverage"
              />

              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 mt-8">
                <h3 className="text-xl font-semibold text-blue-400 mb-4">Test Categories</h3>
                <div className="space-y-4">
                  {[
                    { name: 'Unit Tests', desc: 'Individual function testing with mock data', color: 'blue' },
                    { name: 'Boundary Tests', desc: 'Edge cases like PIC field limits and overflow', color: 'yellow' },
                    { name: 'Equivalence Tests', desc: 'COBOL vs Python output comparison', color: 'green' },
                    { name: 'Integration Tests', desc: 'Module interaction verification', color: 'purple' },
                    { name: 'Regression Tests', desc: 'Ensure fixes don\'t break existing logic', color: 'red' },
                  ].map((test) => (
                    <div key={test.name} className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full bg-${test.color}-400 mt-2`}></div>
                      <div>
                        <span className="font-semibold text-white">{test.name}</span>
                        <span className="text-slate-400"> — {test.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Screenshot 
                src="/docs/08-test-oracle.png" 
                alt="Test oracle detailed view"
                caption="Detailed test results with pass/fail indicators"
              />
            </div>
          )}

          {/* DIFF VIEW */}
          {activeSection === 'diff' && (
            <div className="animate-fadeIn">
              <h1 className="text-4xl font-bold mb-4">Smart Diff View</h1>
              <p className="text-xl text-slate-400 mb-8">Interactive line-by-line mapping between COBOL source and Python output.</p>

              <Screenshot 
                src="/docs/diff-panel-full.png" 
                alt="Diff panel"
                caption="Side-by-side COBOL-Python comparison with line mapping"
              />

              <div className="grid md:grid-cols-3 gap-4 mt-8">
                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 text-center">
                  <div className="text-3xl mb-2">🔗</div>
                  <h4 className="font-semibold text-white mb-1">Line Mapping</h4>
                  <p className="text-sm text-slate-400">Click any COBOL line to highlight the corresponding Python code</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 text-center">
                  <div className="text-3xl mb-2">🎨</div>
                  <h4 className="font-semibold text-white mb-1">Syntax Highlighting</h4>
                  <p className="text-sm text-slate-400">Full syntax highlighting for both COBOL and Python</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 text-center">
                  <div className="text-3xl mb-2">📍</div>
                  <h4 className="font-semibold text-white mb-1">Visual Connectors</h4>
                  <p className="text-sm text-slate-400">SVG arrows show exact mapping relationships</p>
                </div>
              </div>
            </div>
          )}

          {/* ARCHITECTURE */}
          {activeSection === 'architecture' && (
            <div className="animate-fadeIn">
              <h1 className="text-4xl font-bold mb-4">Architecture Visualization</h1>
              <p className="text-xl text-slate-400 mb-8">Auto-generated diagrams showing your system's structure and dependencies.</p>

              <Screenshot 
                src="/docs/tab-architecture.png" 
                alt="Architecture diagram"
                caption="Mermaid-based architecture diagram showing module relationships"
              />

              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 mt-8">
                <h3 className="text-xl font-semibold text-blue-400 mb-4">Diagram Types</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-slate-900 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Module Dependency Graph</h4>
                    <p className="text-sm text-slate-400">Shows how COBOL sections map to Python modules with import relationships.</p>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Data Flow Diagram</h4>
                    <p className="text-sm text-slate-400">Visualizes how data moves through procedures and copybooks.</p>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Class Hierarchy</h4>
                    <p className="text-sm text-slate-400">Generated Python class structure with inheritance relationships.</p>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Call Graph</h4>
                    <p className="text-sm text-slate-400">Interactive visualization of PERFORM statements and function calls.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DDD EXPORT */}
          {activeSection === 'ddd' && (
            <div className="animate-fadeIn">
              <h1 className="text-4xl font-bold mb-4">DDD Clean Architecture</h1>
              <p className="text-xl text-slate-400 mb-8">Export your converted code as a production-ready Domain-Driven Design structure.</p>

              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h3 className="text-xl font-semibold text-blue-400 mb-4">Generated Project Structure</h3>
                <pre className="bg-slate-900 p-4 rounded-lg text-sm overflow-x-auto text-slate-300">
{`banking_system/
├── app/                    # Application layer
│   ├── services/           # Use cases
│   │   ├── account_service.py
│   │   └── transaction_service.py
│   └── dto/                # Data Transfer Objects
│
├── domain/                 # Domain layer
│   ├── entities/           # Business entities
│   │   ├── account.py
│   │   └── customer.py
│   ├── value_objects/      # Immutable values
│   └── repositories/       # Repository interfaces
│
├── infra/                  # Infrastructure layer
│   ├── persistence/        # Database implementations
│   ├── external/           # External service adapters
│   └── config/             # Configuration
│
└── tests/                  # Comprehensive test suite
    ├── unit/
    ├── integration/
    └── equivalence/`}
                </pre>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="bg-gradient-to-br from-blue-900/50 to-slate-800 rounded-xl p-5 border border-blue-700/50">
                  <h4 className="font-semibold text-blue-400 mb-2">Domain Layer</h4>
                  <p className="text-sm text-slate-300">Pure business logic, no external dependencies</p>
                </div>
                <div className="bg-gradient-to-br from-green-900/50 to-slate-800 rounded-xl p-5 border border-green-700/50">
                  <h4 className="font-semibold text-green-400 mb-2">Application Layer</h4>
                  <p className="text-sm text-slate-300">Use cases orchestrating domain operations</p>
                </div>
                <div className="bg-gradient-to-br from-purple-900/50 to-slate-800 rounded-xl p-5 border border-purple-700/50">
                  <h4 className="font-semibold text-purple-400 mb-2">Infrastructure</h4>
                  <p className="text-sm text-slate-300">Database, APIs, and external integrations</p>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY */}
          {activeSection === 'security' && (
            <div className="animate-fadeIn">
              <h1 className="text-4xl font-bold mb-4">Security Scanner</h1>
              <p className="text-xl text-slate-400 mb-8">Comprehensive vulnerability detection with remediation guidance.</p>

              <Screenshot 
                src="/docs/06-report.png" 
                alt="Security report"
                caption="Security analysis with CVSS scoring and remediation suggestions"
              />

              <div className="space-y-4 mt-8">
                <h3 className="text-xl font-semibold text-blue-400">Detected Vulnerability Types</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { name: 'SQL Injection', severity: 'Critical', color: 'red' },
                    { name: 'Buffer Overflow', severity: 'High', color: 'orange' },
                    { name: 'Hardcoded Credentials', severity: 'High', color: 'orange' },
                    { name: 'Insecure File I/O', severity: 'Medium', color: 'yellow' },
                    { name: 'Missing Input Validation', severity: 'Medium', color: 'yellow' },
                    { name: 'Deprecated Functions', severity: 'Low', color: 'blue' },
                  ].map((vuln) => (
                    <div key={vuln.name} className="flex items-center justify-between bg-slate-800 rounded-lg p-3 border border-slate-700">
                      <span className="text-white">{vuln.name}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium bg-${vuln.color}-900/50 text-${vuln.color}-400`}>
                        {vuln.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AI CHAT */}
          {activeSection === 'chat' && (
            <div className="animate-fadeIn">
              <h1 className="text-4xl font-bold mb-4">AI Chat Assistant</h1>
              <p className="text-xl text-slate-400 mb-8">Ask questions about your code in natural language.</p>

              <Screenshot 
                src="/docs/10-chat.png" 
                alt="AI chat interface"
                caption="Natural language queries about your COBOL and Python code"
              />

              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 mt-8">
                <h3 className="text-xl font-semibold text-blue-400 mb-4">Example Questions</h3>
                <div className="space-y-3">
                  {[
                    "What does the CALCULATE-INTEREST procedure do?",
                    "How is the account balance computed?",
                    "Are there any security issues in this code?",
                    "Explain the data flow in the PROCESS-TRANSACTION section",
                    "What test cases should I add for edge cases?",
                  ].map((q, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-900 rounded-lg px-4 py-3">
                      <MessageSquare className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      <span className="text-slate-300">{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* API REFERENCE */}
          {activeSection === 'api' && (
            <div className="animate-fadeIn">
              <h1 className="text-4xl font-bold mb-4">API Reference</h1>
              <p className="text-xl text-slate-400 mb-8">Integrate CodeSwitch into your CI/CD pipeline.</p>

              <div className="space-y-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-xl font-semibold text-green-400 mb-4">POST /api/analyse</h3>
                  <p className="text-slate-300 mb-4">Analyze COBOL code and generate Python translation.</p>
                  <pre className="bg-slate-900 p-4 rounded-lg text-sm overflow-x-auto">
{`curl -X POST https://cobol-ast-service.vercel.app/api/analyse \\
  -H "Content-Type: application/json" \\
  -d '{
    "cobolCode": "IDENTIFICATION DIVISION...",
    "filename": "program.cbl"
  }'`}
                  </pre>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-xl font-semibold text-blue-400 mb-4">Response Schema</h3>
                  <pre className="bg-slate-900 p-4 rounded-lg text-sm overflow-x-auto text-slate-300">
{`{
  "python_code": "string",
  "unit_tests": "string", 
  "security_warnings": [
    { "severity": "HIGH", "message": "...", "line": 42 }
  ],
  "migration_score": {
    "confidence": 95,
    "complexity": "medium"
  },
  "architecture": "string (mermaid)",
  "config": { ... }
}`}
                  </pre>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-xl font-semibold text-purple-400 mb-4">Other Endpoints</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <code className="bg-green-900/50 text-green-400 px-2 py-1 rounded text-sm">POST</code>
                      <code className="text-slate-300">/api/chat</code>
                      <span className="text-slate-500">— Ask questions about analyzed code</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <code className="bg-blue-900/50 text-blue-400 px-2 py-1 rounded text-sm">GET</code>
                      <code className="text-slate-300">/api/health</code>
                      <span className="text-slate-500">— Check service status</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <code className="bg-green-900/50 text-green-400 px-2 py-1 rounded text-sm">POST</code>
                      <code className="text-slate-300">/api/transpile-clean</code>
                      <span className="text-slate-500">— Generate DDD structure</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FAQ */}
          {activeSection === 'faq' && (
            <div className="animate-fadeIn">
              <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
              <p className="text-xl text-slate-400 mb-8">Common questions about CodeSwitch Pro.</p>

              <div className="space-y-4">
                {[
                  { 
                    q: 'Is my code secure?', 
                    a: 'Yes. Your COBOL code is processed in-memory and never stored. All communication uses TLS encryption. We are SOC2 compliant.' 
                  },
                  { 
                    q: 'What COBOL dialects are supported?', 
                    a: 'CodeSwitch supports COBOL-85, COBOL-2002, IBM Enterprise COBOL, and Micro Focus COBOL. EXEC CICS and EXEC SQL blocks are also handled.' 
                  },
                  { 
                    q: 'How accurate is the translation?', 
                    a: 'On average, 85-95% of code translates correctly. The Test Oracle helps verify equivalence. Complex date arithmetic and file I/O may require manual review.' 
                  },
                  { 
                    q: 'Can I use the generated code in production?', 
                    a: 'The generated code is production-ready but we recommend running the full test suite, performing code review, and integration testing in your environment.' 
                  },
                  { 
                    q: 'What is the maximum file size?', 
                    a: 'Free tier: 1,000 lines. Professional: 50,000 lines. Enterprise: Unlimited with smart chunking and parallel processing.' 
                  },
                  { 
                    q: 'Can I integrate with CI/CD?', 
                    a: 'Yes! Use our REST API to integrate CodeSwitch into Jenkins, GitHub Actions, GitLab CI, or any build pipeline.' 
                  },
                  { 
                    q: 'What frameworks can I export to?', 
                    a: 'Currently Django, FastAPI, and Flask. Spring Boot (Java) and .NET support coming soon.' 
                  },
                  { 
                    q: 'How does the AI chat work?', 
                    a: 'The chat uses Gemini 2.0 with full context of your COBOL and Python code. Ask any question in natural language.' 
                  },
                ].map((faq, i) => (
                  <details key={i} className="bg-slate-800/50 rounded-xl border border-slate-700 group">
                    <summary className="px-6 py-4 cursor-pointer font-semibold text-white flex items-center justify-between hover:bg-slate-700/50 rounded-xl transition">
                      {faq.q}
                      <ChevronRight className="w-5 h-5 text-slate-400 group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="px-6 pb-4 text-slate-400">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-700 flex items-center justify-between">
          <p className="text-slate-500 text-sm">
            Powered by Google Gemini 2.0 | <span className="text-blue-400">Gemini API Developer Competition</span>
          </p>
          <Link href="/dashboard" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition">
            Try CodeSwitch Pro <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
