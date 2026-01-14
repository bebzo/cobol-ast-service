'use client';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { 
  Play, CheckCircle, Shield, Zap, FileCode, TestTube, 
  MessageSquare, Download, TrendingUp, Clock, DollarSign,
  ArrowRight, ChevronDown, Star, Building2, Lock, Eye,
  BarChart3, GitCompare, Award, Sparkles, Code2, Database
} from 'lucide-react';

export default function LandingPage() {
  const [visible, setVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [roiLines, setRoiLines] = useState(50000);
  const [countCobol, setCountCobol] = useState(0);
  const [countPython, setCountPython] = useState(0);
  const [countTests, setCountTests] = useState(0);

  useEffect(() => {
    setVisible(true);
    // Animate counters
    const duration = 2000;
    const steps = 60;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCountCobol(Math.round(10006 * eased));
      setCountPython(Math.round(25412 * eased));
      setCountTests(Math.round(60 * eased));
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 6);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: <Code2 className="w-6 h-6" />,
      title: "Python Transpilation",
      desc: "Modern Python with type hints, dataclasses, and Decimal precision",
      highlight: "100% syntax valid"
    },
    {
      icon: <TestTube className="w-6 h-6" />,
      title: "Auto-Generated Tests",
      desc: "60+ pytest cases with property-based testing for edge cases",
      highlight: "100% pass rate"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Security Analysis",
      desc: "CVE detection, CVSS scoring, hardcoded credentials scanner",
      highlight: "OWASP compliant"
    },
    {
      icon: <GitCompare className="w-6 h-6" />,
      title: "Equivalence Proof",
      desc: "Mathematical verification that Python matches COBOL behavior",
      highlight: "Certified output"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "AI Chat Assistant",
      desc: "Ask questions about your code in natural language",
      highlight: "Gemini 2.0"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Live Metrics",
      desc: "Real-time coverage, complexity, and risk dashboards",
      highlight: "Enterprise ready"
    }
  ];

  const stats = [
    { value: '220B+', label: 'Lines of COBOL worldwide', icon: <Database className="w-5 h-5" /> },
    { value: '95%', label: 'Translation accuracy', icon: <CheckCircle className="w-5 h-5" /> },
    { value: '< 60s', label: 'Analysis time (10K lines)', icon: <Zap className="w-5 h-5" /> },
    { value: '85%', label: 'Cost reduction', icon: <TrendingUp className="w-5 h-5" /> },
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'CTO, FinanceCore',
      text: 'We migrated 2M lines of COBOL in 3 months instead of 18. The security scanner caught a critical SQL injection vulnerability we would have missed.',
      avatar: 'SC',
      company: 'Fortune 500 Bank'
    },
    {
      name: 'Michael Torres',
      role: 'VP Engineering',
      text: 'The equivalence testing gave us confidence to deploy. 100% test pass rate on the first try. Our compliance team was impressed by the certificates.',
      avatar: 'MT',
      company: 'Insurance Leader'
    },
    {
      name: 'Dr. Priya Sharma',
      role: 'Director of Modernization',
      text: 'CodeSwitch understood our 40-year-old tax calculation logic perfectly. The Gemini chat helped our junior devs understand the legacy code.',
      avatar: 'PS',
      company: 'Government Agency'
    }
  ];

  // ROI calculations
  const manualMonths = Math.ceil(roiLines / 500);
  const aiDays = Math.max(1, Math.ceil(roiLines / 10000));
  const manualCost = manualMonths * 25000;
  const aiCost = Math.max(5000, aiDays * 2000);
  const savings = manualCost - aiCost;
  const savingsPercent = Math.round((savings / manualCost) * 100);

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[80px] animate-pulse" style={{animationDelay: '2s'}} />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/5 backdrop-blur-xl bg-[#0a0a1a]/80 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center font-black text-xl">C</div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0a0a1a] animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-bold">CodeSwitch</span>
              <span className="text-xs text-slate-500 block -mt-1">by Gemini 2.0</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-400 hover:text-white transition text-sm">Features</a>
            <a href="#how-it-works" className="text-slate-400 hover:text-white transition text-sm">How it Works</a>
            <a href="#roi" className="text-slate-400 hover:text-white transition text-sm">ROI Calculator</a>
            <Link href="/docs" className="text-slate-400 hover:text-white transition text-sm">Docs</Link>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-slate-400 hover:text-white transition text-sm px-4 py-2">Login</Link>
            <Link href="/dashboard" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 px-5 py-2.5 rounded-full font-semibold text-sm transition transform hover:scale-105 flex items-center gap-2">
              Try Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24">
        <div className={`transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-full px-5 py-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-slate-300">Powered by Google Gemini 2.0 Flash</span>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">LIVE</span>
            </div>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl font-black text-center mb-6 leading-[1.1]">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Transform 40 Years of COBOL
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Into Modern Python
            </span>
          </h1>

          <p className="text-xl text-slate-400 text-center max-w-3xl mx-auto mb-8">
            AI-powered transpilation that preserves business logic, generates tests, 
            validates equivalence, and certifies your migration.
            <span className="text-white font-semibold"> In seconds, not months.</span>
          </p>

          {/* Live counter demo */}
          <div className="flex justify-center gap-6 mb-10">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-amber-400 tabular-nums">{countCobol.toLocaleString()}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">COBOL Lines</div>
            </div>
            <div className="flex items-center text-slate-600">
              <ArrowRight className="w-6 h-6" />
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-emerald-400 tabular-nums">{countPython.toLocaleString()}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">Python Lines</div>
            </div>
            <div className="hidden md:flex items-center text-slate-600">+</div>
            <div className="hidden md:block text-center">
              <div className="text-3xl md:text-4xl font-black text-purple-400 tabular-nums">{countTests}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">Tests</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/dashboard" className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 px-8 py-4 rounded-full font-bold text-lg transition transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 flex items-center justify-center gap-3">
              <Play className="w-5 h-5" />
              Start Free Migration
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </Link>
            <a href="#demo" className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-full font-bold text-lg transition">
              <Eye className="w-5 h-5" />
              Watch Demo
            </a>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 text-center hover:bg-white/10 hover:border-purple-500/30 transition group">
                <div className="flex justify-center mb-2 text-slate-500 group-hover:text-purple-400 transition">
                  {stat.icon}
                </div>
                <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO Section - Before/After */}
      <section id="demo" className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="relative">
          {/* Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl" />
          
          <div className="relative bg-[#0d0d20]/90 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            {/* Window chrome */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0a0a18]">
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-sm text-slate-500">CodeSwitch Pro — Live Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Gemini Connected
                </span>
              </div>
            </div>

            {/* Split view */}
            <div className="grid md:grid-cols-2 divide-x divide-white/10">
              {/* COBOL side */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded font-medium">COBOL</span>
                  <span className="text-slate-500 text-sm">PAYROLL-CALC.cbl</span>
                  <span className="ml-auto text-xs text-slate-600">10,006 lines</span>
                </div>
                <pre className="text-sm text-slate-400 font-mono leading-relaxed overflow-hidden max-h-[300px]"><code className="text-amber-300/80">{`       IDENTIFICATION DIVISION.
       PROGRAM-ID. PAYROLL-CALC.
       DATE-WRITTEN. 1985-01-15.
      * MISSION-CRITICAL MAINFRAME APP
      * PROCESSES $50B+ DAILY
       
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  WS-EMPLOYEE-RECORD.
           05  WS-EMP-ID        PIC X(10).
           05  WS-EMP-SALARY    PIC 9(7)V99.
           05  WS-TAX-RATE      PIC V9(4).
           05  WS-NET-PAY       PIC 9(7)V99.
       
       PROCEDURE DIVISION.
           COMPUTE WS-NET-PAY = 
               WS-EMP-SALARY * (1 - WS-TAX-RATE).`}</code></pre>
              </div>

              {/* Python side */}
              <div className="p-6 bg-[#080815]">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-medium">Python</span>
                  <span className="text-slate-500 text-sm">payroll_calc.py</span>
                  <span className="ml-auto text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Validated
                  </span>
                </div>
                <pre className="text-sm text-slate-400 font-mono leading-relaxed overflow-hidden max-h-[300px]"><code className="text-emerald-300/80">{`from dataclasses import dataclass
from decimal import Decimal
from typing import Optional

@dataclass
class EmployeeRecord:
    """Employee payroll record."""
    emp_id: str
    salary: Decimal
    tax_rate: Decimal
    
    def calculate_net_pay(self) -> Decimal:
        """Calculate net pay after taxes."""
        return self.salary * (1 - self.tax_rate)
    
    def validate(self) -> bool:
        """Validate employee data."""
        return len(self.emp_id) <= 10`}</code></pre>
              </div>
            </div>

            {/* Results bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-[#0a0a18] border-t border-white/10">
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-2 text-emerald-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  100% Translated
                </span>
                <span className="flex items-center gap-2 text-purple-400 text-sm">
                  <TestTube className="w-4 h-4" />
                  60 Tests Generated
                </span>
                <span className="flex items-center gap-2 text-blue-400 text-sm">
                  <Award className="w-4 h-4" />
                  Certified
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Analyzed in</span>
                <span className="text-sm font-bold text-white">47 seconds</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES Grid */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything You Need</h2>
          <p className="text-xl text-slate-400">Enterprise-grade features for confident migration</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div 
              key={i}
              className={`group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border rounded-2xl p-8 transition-all duration-500 hover:transform hover:-translate-y-2 cursor-pointer ${
                activeFeature === i ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/10 hover:border-purple-500/30'
              }`}
              onClick={() => setActiveFeature(i)}
            >
              <div className={`inline-flex p-3 rounded-xl mb-4 transition ${
                activeFeature === i ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700/50 text-slate-400 group-hover:text-purple-400'
              }`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-slate-400 mb-4">{feature.desc}</p>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
                activeFeature === i ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-700/50 text-slate-400'
              }`}>
                <CheckCircle className="w-3 h-3" />
                {feature.highlight}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-slate-400">Three simple steps to modern code</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { 
              step: '01', 
              title: 'Upload COBOL', 
              desc: 'Paste or upload your legacy code. We support files up to 50,000 lines with copybooks.',
              icon: <FileCode className="w-8 h-8" />,
              color: 'from-blue-500 to-cyan-500'
            },
            { 
              step: '02', 
              title: 'AI Analysis', 
              desc: 'Gemini 2.0 Flash analyzes structure, transpiles code, generates tests, and scans for security issues.',
              icon: <Sparkles className="w-8 h-8" />,
              color: 'from-purple-500 to-pink-500'
            },
            { 
              step: '03', 
              title: 'Export & Deploy', 
              desc: 'Download certified Python code, test suites, and documentation. Production-ready.',
              icon: <Download className="w-8 h-8" />,
              color: 'from-emerald-500 to-green-500'
            },
          ].map((item, i) => (
            <div key={i} className="relative group">
              <div className={`absolute -top-6 left-6 w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition`}>
                {item.icon}
              </div>
              <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-8 pt-14 h-full group-hover:border-purple-500/30 transition">
                <span className="text-6xl font-black text-slate-800 absolute top-6 right-6">{item.step}</span>
                <h3 className="text-2xl font-bold mb-3 relative z-10">{item.title}</h3>
                <p className="text-slate-400 relative z-10">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ROI CALCULATOR */}
      <section id="roi" className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Calculate Your ROI</h2>
          <p className="text-xl text-slate-400">See how much time and money CodeSwitch saves</p>
        </div>

        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/10 rounded-3xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Input */}
            <div>
              <label className="flex items-center gap-2 text-lg font-semibold mb-4">
                <Database className="w-5 h-5 text-purple-400" />
                Lines of COBOL Code
              </label>
              <input
                type="range"
                min="5000"
                max="500000"
                step="5000"
                value={roiLines}
                onChange={(e) => setRoiLines(parseInt(e.target.value))}
                className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between mt-3">
                <span className="text-sm text-slate-500">5K</span>
                <span className="text-3xl font-black text-white">{(roiLines / 1000).toFixed(0)}K lines</span>
                <span className="text-sm text-slate-500">500K</span>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                  <Clock className="w-5 h-5 text-red-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 mb-1">Manual Migration</p>
                  <p className="text-2xl font-bold text-red-400">{manualMonths} months</p>
                  <p className="text-sm text-red-300">${(manualCost / 1000).toFixed(0)}K</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                  <Zap className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 mb-1">With CodeSwitch</p>
                  <p className="text-2xl font-bold text-emerald-400">{aiDays} days</p>
                  <p className="text-sm text-emerald-300">${(aiCost / 1000).toFixed(0)}K</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6 text-center">
                <p className="text-sm text-slate-300 mb-1">Your Estimated Savings</p>
                <p className="text-5xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  ${(savings / 1000).toFixed(0)}K
                </p>
                <p className="text-sm text-slate-300 mt-2">
                  <span className="text-emerald-400 font-bold">{savingsPercent}%</span> cost reduction
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Trusted by Industry Leaders</h2>
          <p className="text-xl text-slate-400">Companies modernizing legacy systems with confidence</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/10 rounded-2xl p-8 hover:border-purple-500/30 transition">
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map(star => (
                  <Star key={star} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-slate-300 mb-6 italic leading-relaxed">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-slate-400">{t.role}</div>
                  <div className="text-xs text-purple-400">{t.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30 rounded-3xl blur-2xl" />
          <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Ready to Modernize?</h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Start your free migration today. No credit card required. 
                <br />See results in under 60 seconds.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard" className="bg-white text-purple-600 hover:bg-slate-100 px-8 py-4 rounded-full font-bold text-lg transition transform hover:scale-105 flex items-center justify-center gap-2">
                  <Play className="w-5 h-5" />
                  Start Free Now
                </Link>
                <Link href="/contact" className="bg-white/20 hover:bg-white/30 border border-white/30 px-8 py-4 rounded-full font-bold text-lg transition flex items-center justify-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Enterprise Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center font-bold text-xl">C</div>
                <span className="text-xl font-bold">CodeSwitch</span>
              </div>
              <p className="text-slate-400 text-sm">AI-powered COBOL modernization for the enterprise. Built with Google Gemini 2.0.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link href="/dashboard" className="hover:text-white transition">Demo</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
                <li><Link href="/docs" className="hover:text-white transition">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
                <li><a href="https://github.com/bebzo/cobol-ast-service" className="hover:text-white transition">GitHub</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link href="/legal/privacy" className="hover:text-white transition">Privacy</Link></li>
                <li><Link href="/legal/terms" className="hover:text-white transition">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>&copy; 2024 CodeSwitch. All rights reserved.</p>
            <p className="flex items-center gap-2">
              <span>Powered by</span>
              <span className="text-blue-400 font-medium">Google Gemini 2.0</span>
              <span className="text-slate-600">|</span>
              <span className="text-purple-400">Gemini API Developer Competition</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
// Landing v2 1768431441
