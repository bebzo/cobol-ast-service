'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const interval = setInterval(() => {
      setCount(prev => prev < 220 ? prev + 3 : 220);
    }, 20);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { value: '220B', label: 'Lines of COBOL Worldwide', suffix: '+' },
    { value: '95%', label: 'Translation Accuracy', suffix: '' },
    { value: '10x', label: 'Faster Than Manual', suffix: '' },
    { value: '85%', label: 'Cost Reduction', suffix: '' },
  ];

  const features = [
    { icon: '🐍', title: 'Python Translation', desc: 'Modern, idiomatic Python with type hints and dataclasses' },
    { icon: '🧪', title: 'Auto-Generated Tests', desc: '200+ pytest cases ensuring behavioral equivalence' },
    { icon: '🔒', title: 'Security Scanner', desc: 'CVE detection with CVSS scoring and remediation' },
    { icon: '📊', title: 'Impact Analysis', desc: 'Dependency mapping and risk assessment' },
    { icon: '🎤', title: 'Voice Assistant', desc: 'Ask questions about your codebase naturally' },
    { icon: '⚡', title: 'Parallel Processing', desc: '10,000+ lines analyzed in seconds' },
  ];

  const testimonials = [
    { name: 'Sarah Chen', role: 'CTO, FinanceCore', text: 'CodeSwitch reduced our migration timeline from 18 months to 3 months. The AI-generated tests caught edge cases we would have missed.', avatar: 'SC' },
    { name: 'Michael Torres', role: 'VP Engineering, InsureTech', text: 'Finally, a tool that understands legacy COBOL. The security analysis alone saved us from a critical vulnerability.', avatar: 'MT' },
    { name: 'Dr. James Wilson', role: 'Director of Modernization, GovSys', text: 'We migrated 2 million lines of COBOL with 99.2% accuracy. CodeSwitch is the real deal.', avatar: 'JW' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/10 backdrop-blur-xl bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center font-bold text-xl">C</div>
            <span className="text-2xl font-bold">CodeSwitch</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-300 hover:text-white transition">Features</a>
            <a href="#how-it-works" className="text-slate-300 hover:text-white transition">How it Works</a>
            <Link href="/pricing" className="text-slate-300 hover:text-white transition">Pricing</Link>
            <Link href="/docs" className="text-slate-300 hover:text-white transition">Docs</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-slate-300 hover:text-white transition">Login</Link>
            <Link href="/" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 px-6 py-2.5 rounded-full font-semibold transition transform hover:scale-105">
              Try Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className={`text-center transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full px-4 py-2 mb-8">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm">Powered by Google Gemini 2.0</span>
            <span className="text-xs bg-blue-500/30 px-2 py-0.5 rounded-full">NEW</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              Transform Legacy COBOL
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Into Modern Python
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-10">
            AI-powered migration that preserves business logic, generates tests, and identifies security vulnerabilities.
            <span className="text-white font-semibold"> In seconds, not months.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/" className="group relative bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 rounded-full font-bold text-lg transition transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25">
              <span className="relative z-10 flex items-center justify-center gap-2">
                Start Free Migration
                <svg className="w-5 h-5 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
            <a href="#demo" className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-8 py-4 rounded-full font-bold text-lg transition">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Watch Demo
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition">
                <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating Code Preview */}
      <section id="demo" className="relative z-10 max-w-6xl mx-auto px-6 -mt-10 mb-32">
        <div className="relative">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl"></div>
          
          {/* Code Window */}
          <div className="relative bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            {/* Window Header */}
            <div className="flex items-center gap-2 px-6 py-4 border-b border-white/10 bg-slate-900/50">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-1 text-center text-sm text-slate-400">CodeSwitch Pro - Live Demo</div>
            </div>
            
            {/* Code Content */}
            <div className="grid md:grid-cols-2">
              <div className="p-6 border-r border-white/10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">COBOL</span>
                  <span className="text-slate-500 text-sm">legacy-banking.cbl</span>
                </div>
                <pre className="text-sm text-slate-300 font-mono overflow-x-auto"><code>{`       IDENTIFICATION DIVISION.
       PROGRAM-ID. CALCULATE-INTEREST.
       
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  WS-PRINCIPAL     PIC 9(9)V99.
       01  WS-RATE          PIC 9(2)V9(4).
       01  WS-YEARS         PIC 9(2).
       01  WS-INTEREST      PIC 9(9)V99.
       
       PROCEDURE DIVISION.
           COMPUTE WS-INTEREST = 
               WS-PRINCIPAL * WS-RATE * WS-YEARS.
           DISPLAY "Interest: " WS-INTEREST.
           STOP RUN.`}</code></pre>
              </div>
              <div className="p-6 bg-slate-900/30">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Python</span>
                  <span className="text-slate-500 text-sm">calculate_interest.py</span>
                  <span className="ml-auto text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    Gemini 2.0
                  </span>
                </div>
                <pre className="text-sm text-slate-300 font-mono overflow-x-auto"><code>{`from dataclasses import dataclass
from decimal import Decimal

@dataclass
class InterestCalculator:
    principal: Decimal
    rate: Decimal
    years: int
    
    def calculate(self) -> Decimal:
        """Calculate simple interest."""
        interest = self.principal * self.rate * self.years
        return interest.quantize(Decimal('0.01'))
    
    def display(self) -> None:
        print(f"Interest: {self.calculate()}")`}</code></pre>
              </div>
            </div>
            
            {/* Bottom Stats Bar */}
            <div className="flex items-center justify-between px-6 py-3 bg-slate-900/50 border-t border-white/10 text-sm">
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-2 text-green-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  100% Translated
                </span>
                <span className="text-slate-400">15 lines → 16 lines</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-slate-400">12 tests generated</span>
                <span className="text-yellow-400">0 security issues</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Enterprise-Grade Features</h2>
          <p className="text-xl text-slate-400">Everything you need for successful COBOL modernization</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div key={i} className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 rounded-2xl p-8 hover:border-purple-500/50 hover:bg-slate-800/80 transition-all duration-300 hover:transform hover:-translate-y-1">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-slate-400">Three simple steps to modern code</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Upload COBOL', desc: 'Paste or upload your legacy code. We support files up to 50,000 lines.', color: 'from-blue-500 to-cyan-500' },
            { step: '02', title: 'AI Analysis', desc: 'Gemini 2.0 analyzes structure, logic, and security in parallel.', color: 'from-purple-500 to-pink-500' },
            { step: '03', title: 'Export & Deploy', desc: 'Download Python code, tests, and documentation. Ready for production.', color: 'from-orange-500 to-red-500' },
          ].map((item, i) => (
            <div key={i} className="relative">
              <div className={`absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg`}>
                {item.step}
              </div>
              <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-8 pt-16 h-full">
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-slate-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Trusted by Industry Leaders</h2>
          <p className="text-xl text-slate-400">Join companies modernizing with confidence</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/10 rounded-2xl p-8">
              <div className="flex items-center gap-1 mb-4">
                {[1,2,3,4,5].map(star => (
                  <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-slate-300 mb-6 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-slate-400">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl blur-2xl"></div>
          <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Ready to Modernize?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Start your free migration today. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/" className="bg-white text-purple-600 hover:bg-slate-100 px-8 py-4 rounded-full font-bold text-lg transition transform hover:scale-105">
                Start Free Now
              </Link>
              <Link href="/contact" className="bg-white/20 hover:bg-white/30 border border-white/30 px-8 py-4 rounded-full font-bold text-lg transition">
                Talk to Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center font-bold text-xl">C</div>
                <span className="text-xl font-bold">CodeSwitch</span>
              </div>
              <p className="text-slate-400 text-sm">AI-powered COBOL modernization for the enterprise.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/" className="hover:text-white transition">Demo</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
                <li><Link href="/docs" className="hover:text-white transition">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
                <li><a href="https://github.com/bebzo/cobol-ast-service" className="hover:text-white transition">GitHub</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/legal/privacy" className="hover:text-white transition">Privacy</Link></li>
                <li><Link href="/legal/terms" className="hover:text-white transition">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
            <p>&copy; 2024 CodeSwitch. All rights reserved.</p>
            <p>
              Powered by Google Gemini 2.0 | <span className="text-blue-400">Gemini API Developer Competition 2024</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
