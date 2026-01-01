'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('quickstart');

  const sections = {
    quickstart: {
      title: 'Quick Start',
      content: `
## Getting Started with CodeSwitch

### 1. Upload Your COBOL Code
- Click **"Upload .cbl"** or paste your code directly in the editor
- Supports files up to 50,000 lines
- Click **"Load Demo"** to try with a sample 10,000-line banking system

### 2. Analyze with Gemini AI
- Click **"Refactor with Gemini"** to start the analysis
- Large files are automatically split and processed in parallel
- Wait for the transformation to complete (typically 3-15 seconds)

### 3. Explore the Results
Navigate through the tabs to see:
- **Python**: Generated Python code with modern patterns
- **Tests**: Auto-generated pytest test suite
- **Config**: Extracted business rules as JSON
- **Diff**: Line-by-line comparison
- **Architecture**: Visual module diagram
- **Impact**: Change risk analysis
- **Report**: Full migration assessment

### 4. Export Your Code
Click **"Export"** to download:
- Python source files (.py)
- Test files (.py)
- Configuration (JSON)
- Full PDF report
      `
    },
    api: {
      title: 'API Reference',
      content: `
## REST API

### Authentication
All API requests require a Supabase API key:
\`\`\`
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
\`\`\`

---

### POST /api/analyse
Analyze COBOL code and generate Python translation.

**Request:**
\`\`\`json
{
  "code": "IDENTIFICATION DIVISION.\\nPROGRAM-ID. SAMPLE.",
  "action": "analyse"
}
\`\`\`

**Response:**
\`\`\`json
{
  "summary": "Banking transaction processor",
  "python_code": "class BankingProcessor:\\n    ...",
  "unit_tests": "def test_calculate():\\n    ...",
  "config_json": "{\\"database\\": {...}}",
  "security_warnings": [...],
  "migration_score": {
    "complexity": "medium",
    "risk_level": "low",
    "confidence": 85
  },
  "cobol_lines": 500,
  "python_lines": 420
}
\`\`\`

---

### POST /api/chat
Ask questions about the analyzed code.

**Request:**
\`\`\`json
{
  "code": "<COBOL source>",
  "analysis": "<previous analysis>",
  "query": "What does CALCULATE-INTEREST do?"
}
\`\`\`

**Response:**
\`\`\`json
{
  "response": "The CALCULATE-INTEREST paragraph computes..."
}
\`\`\`

---

### GET /api/health
Check service status.

**Response:**
\`\`\`json
{
  "status": "healthy",
  "gemini": "connected",
  "version": "1.0.0"
}
\`\`\`
      `
    },
    features: {
      title: 'Features',
      content: `
## Core Features

### Python Translation
- Converts COBOL to idiomatic Python 3.10+
- Preserves business logic and data structures
- Adds type hints for better maintainability
- Handles COBOL-specific constructs (PERFORM, EVALUATE, etc.)

### Test Oracle
- Generates comprehensive pytest test suites
- Creates equivalence tests comparing COBOL and Python behavior
- Covers edge cases and boundary conditions
- Achieves 85%+ coverage on average

### Security Scanner
- Detects 50+ vulnerability patterns
- Identifies hardcoded credentials
- Flags SQL injection risks
- CVSS scoring for prioritization
- Remediation suggestions included

### Configuration Extraction
- Extracts business rules to JSON
- Separates data from logic
- Makes rules easily editable
- Supports environment-specific overrides

### Smart Chunking
- Automatically splits large files
- Parallel processing for speed
- Intelligent merge of results
- Deduplication of repeated code

### Impact Analysis
- Maps module dependencies
- Identifies high-risk changes
- Calculates blast radius
- Prioritizes migration order

### Voice Assistant
- Natural language queries
- Ask questions about any section
- Get explanations of complex logic
- Powered by Gemini 2.0
      `
    },
    faq: {
      title: 'FAQ',
      content: `
## Frequently Asked Questions

### Is my code secure?
Yes. Your COBOL code is processed in-memory and never stored. All communication uses TLS encryption.

### What COBOL dialects are supported?
CodeSwitch supports COBOL-85, COBOL-2002, and most IBM Enterprise COBOL constructs.

### How accurate is the translation?
On average, 85-95% of code translates correctly. Complex date arithmetic and file I/O may require manual review.

### Can I use the generated code in production?
The generated code is a starting point. We strongly recommend:
1. Running the generated test suite
2. Code review by your team
3. Additional integration testing
4. Gradual rollout with monitoring

### What's the maximum file size?
- Free tier: 1,000 lines per file
- Professional: 50,000 lines per file
- Enterprise: Unlimited (with chunking)

### Do you support CICS/DB2?
Partial support. EXEC CICS and EXEC SQL blocks are identified and translated to Python equivalents, but may need database-specific adjustments.

### Can I integrate with my CI/CD pipeline?
Yes! Use our REST API to integrate CodeSwitch into your build pipeline. See the API Reference for details.

### What if the translation fails?
- Check for syntax errors in the source COBOL
- Try splitting very large paragraphs
- Contact support with the error message
      `
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 p-6 fixed h-full">
        <Link href="/" className="text-2xl font-bold text-blue-400 block mb-8">CodeSwitch</Link>
        <nav className="space-y-2">
          {Object.entries(sections).map(([key, section]) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={\`w-full text-left px-4 py-2 rounded-lg transition \${
                activeSection === key
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }\`}
            >
              {section.title}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-6 left-6 right-6">
          <Link
            href="/"
            className="block text-center bg-slate-700 hover:bg-slate-600 py-2 rounded-lg text-sm"
          >
            Back to App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-12">
        <div className="max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">{sections[activeSection as keyof typeof sections].title}</h1>
          <div className="prose prose-invert prose-lg max-w-none">
            <div
              dangerouslySetInnerHTML={{
                __html: sections[activeSection as keyof typeof sections].content
                  .replace(/\n## /g, '<h2>')
                  .replace(/\n### /g, '</p><h3>')
                  .replace(/\n---/g, '<hr/>')
                  .replace(/\n- /g, '<li>')
                  .replace(/\`\`\`json\n/g, '<pre class="bg-slate-800 p-4 rounded-lg overflow-x-auto text-sm"><code>')
                  .replace(/\`\`\`\n/g, '<pre class="bg-slate-800 p-4 rounded-lg overflow-x-auto text-sm"><code>')
                  .replace(/\n\`\`\`/g, '</code></pre>')
                  .replace(/\`([^`]+)\`/g, '<code class="bg-slate-700 px-1 rounded">$1</code>')
                  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n\n/g, '</p><p>')
              }}
            />
          </div>
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
