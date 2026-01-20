'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Play, Pause, RotateCcw, SkipForward, Volume2, VolumeX,
  Code2, Zap, TestTube, Shield, FileText, ChevronRight,
  CheckCircle, ArrowRight, Sparkles
} from 'lucide-react';

const COBOL_CODE = `       IDENTIFICATION DIVISION.
       PROGRAM-ID. BANKING-SYSTEM.
       
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-ACCOUNT-REC.
          05 WS-ACCT-NO      PIC 9(10).
          05 WS-ACCT-NAME    PIC X(30).
          05 WS-BALANCE      PIC S9(13)V99.
          05 WS-STATUS       PIC X(1).
       01 WS-TRANSACTION.
          05 WS-TRANS-TYPE   PIC X(1).
          05 WS-TRANS-AMT    PIC S9(11)V99.
       
       PROCEDURE DIVISION.
       MAIN-PROCESS.
           PERFORM INIT-SYSTEM
           PERFORM PROCESS-TRANSACTIONS
           PERFORM GENERATE-REPORT
           STOP RUN.
       
       PROCESS-TRANSACTIONS.
           IF WS-TRANS-TYPE = 'D'
              ADD WS-TRANS-AMT TO WS-BALANCE
           ELSE IF WS-TRANS-TYPE = 'W'
              SUBTRACT WS-TRANS-AMT FROM WS-BALANCE
           END-IF.
           
       CALCULATE-INTEREST.
           COMPUTE WS-BALANCE = WS-BALANCE * 1.05.`;

const PYTHON_CODE = `from dataclasses import dataclass
from decimal import Decimal
from enum import Enum
from typing import Optional

class TransactionType(Enum):
    DEPOSIT = 'D'
    WITHDRAWAL = 'W'

@dataclass
class Account:
    """Banking account with balance tracking."""
    acct_no: str          # PIC 9(10)
    acct_name: str        # PIC X(30)
    balance: Decimal      # PIC S9(13)V99
    status: str           # PIC X(1)

@dataclass
class Transaction:
    """Financial transaction record."""
    trans_type: TransactionType
    amount: Decimal       # PIC S9(11)V99

class BankingSystem:
    """Main banking system controller."""
    
    def __init__(self):
        self.account: Optional[Account] = None
    
    def process_transaction(
        self, 
        account: Account, 
        transaction: Transaction
    ) -> Decimal:
        """Process deposit or withdrawal."""
        if transaction.trans_type == TransactionType.DEPOSIT:
            account.balance += transaction.amount
        elif transaction.trans_type == TransactionType.WITHDRAWAL:
            account.balance -= transaction.amount
        return account.balance
    
    def calculate_interest(
        self, 
        account: Account, 
        rate: Decimal = Decimal('0.05')
    ) -> Decimal:
        """Apply interest to account balance."""
        account.balance *= (1 + rate)
        return account.balance`;

const TEST_CODE = `import pytest
from decimal import Decimal
from banking_system import (
    Account, Transaction, 
    TransactionType, BankingSystem
)

class TestBankingSystem:
    """Comprehensive test suite for banking system."""
    
    @pytest.fixture
    def banking_system(self):
        return BankingSystem()
    
    @pytest.fixture
    def sample_account(self):
        return Account(
            acct_no="1234567890",
            acct_name="John Doe",
            balance=Decimal("10000.00"),
            status="A"
        )
    
    def test_deposit_increases_balance(
        self, banking_system, sample_account
    ):
        """Test that deposits increase balance."""
        transaction = Transaction(
            trans_type=TransactionType.DEPOSIT,
            amount=Decimal("500.00")
        )
        result = banking_system.process_transaction(
            sample_account, transaction
        )
        assert result == Decimal("10500.00")
    
    def test_withdrawal_decreases_balance(
        self, banking_system, sample_account
    ):
        """Test that withdrawals decrease balance."""
        transaction = Transaction(
            trans_type=TransactionType.WITHDRAWAL,
            amount=Decimal("300.00")
        )
        result = banking_system.process_transaction(
            sample_account, transaction
        )
        assert result == Decimal("9700.00")
    
    def test_interest_calculation(
        self, banking_system, sample_account
    ):
        """Test 5% interest application."""
        result = banking_system.calculate_interest(
            sample_account
        )
        assert result == Decimal("10500.00")`;

interface Step {
  id: string;
  title: string;
  subtitle: string;
  duration: number;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  { id: 'upload', title: 'Upload COBOL', subtitle: 'Loading 10,000 lines...', duration: 3000, icon: <Code2 className="w-6 h-6" /> },
  { id: 'analyze', title: 'AI Analysis', subtitle: 'Gemini 3 processing...', duration: 5000, icon: <Zap className="w-6 h-6" /> },
  { id: 'python', title: 'Python Generated', subtitle: 'Modern, type-safe code', duration: 4000, icon: <Sparkles className="w-6 h-6" /> },
  { id: 'tests', title: 'Tests Created', subtitle: '60 test cases, 92% coverage', duration: 3000, icon: <TestTube className="w-6 h-6" /> },
  { id: 'security', title: 'Security Scan', subtitle: '0 vulnerabilities found', duration: 2000, icon: <Shield className="w-6 h-6" /> },
  { id: 'complete', title: 'Migration Complete', subtitle: 'Ready to deploy!', duration: 3000, icon: <CheckCircle className="w-6 h-6" /> },
];

export default function InteractiveDemoPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [typedCobol, setTypedCobol] = useState('');
  const [typedPython, setTypedPython] = useState('');
  const [typedTests, setTypedTests] = useState('');
  const [showMetrics, setShowMetrics] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const stepTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const totalDuration = STEPS.reduce((acc, step) => acc + step.duration, 0);

  const reset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setProgress(0);
    setTypedCobol('');
    setTypedPython('');
    setTypedTests('');
    setShowMetrics(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current);
  };

  const skipToEnd = () => {
    setCurrentStep(STEPS.length - 1);
    setProgress(100);
    setTypedCobol(COBOL_CODE);
    setTypedPython(PYTHON_CODE);
    setTypedTests(TEST_CODE);
    setShowMetrics(true);
    setIsPlaying(false);
  };

  useEffect(() => {
    if (!isPlaying) return;

    // Type effect for COBOL
    if (currentStep === 0) {
      let i = 0;
      intervalRef.current = setInterval(() => {
        if (i < COBOL_CODE.length) {
          setTypedCobol(COBOL_CODE.slice(0, i + 10));
          i += 10;
        }
      }, 20);
    }

    // Type effect for Python
    if (currentStep === 2) {
      let i = 0;
      intervalRef.current = setInterval(() => {
        if (i < PYTHON_CODE.length) {
          setTypedPython(PYTHON_CODE.slice(0, i + 15));
          i += 15;
        }
      }, 15);
    }

    // Type effect for Tests
    if (currentStep === 3) {
      let i = 0;
      intervalRef.current = setInterval(() => {
        if (i < TEST_CODE.length) {
          setTypedTests(TEST_CODE.slice(0, i + 20));
          i += 20;
        }
      }, 15);
    }

    // Show metrics at security step
    if (currentStep === 4) {
      setShowMetrics(true);
    }

    // Progress to next step
    const currentStepDuration = STEPS[currentStep]?.duration || 3000;
    stepTimeoutRef.current = setTimeout(() => {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
        setProgress(((currentStep + 1) / STEPS.length) * 100);
      } else {
        setIsPlaying(false);
        setProgress(100);
      }
    }, currentStepDuration);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current);
    };
  }, [isPlaying, currentStep]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Code2 className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold">CodeSwitch Pro</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">Interactive Demo</span>
            <Link 
              href="/dashboard" 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition"
            >
              Try It Free →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Watch COBOL Transform to Python
            </h1>
            <p className="text-xl text-slate-400">
              See the complete migration workflow in action
            </p>
          </div>

          {/* Video Player Container */}
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
            {/* Player Header */}
            <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-4">
                {/* Control Buttons */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center transition shadow-lg shadow-blue-600/30"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <button
                  onClick={reset}
                  className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={skipToEnd}
                  className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Step Indicator */}
              <div className="flex items-center gap-2">
                {STEPS.map((step, i) => (
                  <div
                    key={step.id}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      i < currentStep ? 'bg-green-500' :
                      i === currentStep ? 'bg-blue-500 scale-125' :
                      'bg-slate-600'
                    }`}
                  />
                ))}
              </div>

              {/* Current Step Info */}
              <div className="text-right">
                <div className="text-sm font-medium text-white">{STEPS[currentStep]?.title}</div>
                <div className="text-xs text-slate-400">{STEPS[currentStep]?.subtitle}</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Main Display */}
            <div className="p-6">
              {/* Split View */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left: COBOL */}
                <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
                  <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
                    <span className="text-sm font-medium text-green-400">COBOL Source</span>
                    <span className="text-xs text-slate-500">banking_system.cbl</span>
                  </div>
                  <pre className="p-4 text-sm font-mono text-green-400 overflow-auto h-80 scrollbar-thin">
                    {typedCobol || (currentStep === 0 && isPlaying ? '█' : COBOL_CODE.slice(0, 200) + '\n...')}
                    {currentStep === 0 && isPlaying && <span className="animate-pulse">█</span>}
                  </pre>
                </div>

                {/* Right: Python */}
                <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
                  <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
                    <span className="text-sm font-medium text-blue-400">Python Output</span>
                    <span className="text-xs text-slate-500">banking_system.py</span>
                  </div>
                  <pre className="p-4 text-sm font-mono text-blue-400 overflow-auto h-80 scrollbar-thin">
                    {currentStep >= 2 ? (
                      <>
                        {typedPython || PYTHON_CODE}
                        {currentStep === 2 && isPlaying && <span className="animate-pulse">█</span>}
                      </>
                    ) : currentStep === 1 ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="relative">
                          <div className="w-16 h-16 border-4 border-blue-500/30 rounded-full"></div>
                          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="mt-4 text-slate-400">Analyzing with Gemini 3...</p>
                        <p className="text-xs text-slate-500 mt-2">Processing 10,006 lines</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-500">
                        Waiting for analysis...
                      </div>
                    )}
                  </pre>
                </div>
              </div>

              {/* Tests Section */}
              {currentStep >= 3 && (
                <div className="mt-6 bg-slate-900 rounded-xl overflow-hidden border border-slate-700 animate-fadeIn">
                  <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
                    <span className="text-sm font-medium text-purple-400">Generated Tests</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-green-900/50 text-green-400 rounded text-xs">60 tests</span>
                      <span className="px-2 py-0.5 bg-blue-900/50 text-blue-400 rounded text-xs">92% coverage</span>
                    </div>
                  </div>
                  <pre className="p-4 text-sm font-mono text-purple-400 overflow-auto h-48">
                    {typedTests || TEST_CODE}
                    {currentStep === 3 && isPlaying && <span className="animate-pulse">█</span>}
                  </pre>
                </div>
              )}

              {/* Metrics Panel */}
              {showMetrics && (
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 animate-fadeIn">
                  {[
                    { label: 'Confidence Score', value: '94%', color: 'green' },
                    { label: 'Lines Converted', value: '10,006', color: 'blue' },
                    { label: 'Test Coverage', value: '92%', color: 'purple' },
                    { label: 'Security Issues', value: '0', color: 'emerald' },
                  ].map((metric) => (
                    <div 
                      key={metric.label}
                      className={`bg-${metric.color}-900/20 border border-${metric.color}-700/50 rounded-xl p-4 text-center`}
                    >
                      <div className={`text-3xl font-bold text-${metric.color}-400`}>{metric.value}</div>
                      <div className="text-sm text-slate-400 mt-1">{metric.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-slate-900 px-6 py-4 border-t border-slate-700">
              <div className="flex items-center justify-between">
                {STEPS.map((step, i) => (
                  <button
                    key={step.id}
                    onClick={() => {
                      setCurrentStep(i);
                      setProgress((i / STEPS.length) * 100);
                      if (i >= 2) setTypedPython(PYTHON_CODE);
                      if (i >= 3) setTypedTests(TEST_CODE);
                      if (i >= 4) setShowMetrics(true);
                      setTypedCobol(COBOL_CODE);
                    }}
                    className={`flex flex-col items-center gap-2 group transition-all ${
                      i <= currentStep ? 'opacity-100' : 'opacity-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      i < currentStep ? 'bg-green-600' :
                      i === currentStep ? 'bg-blue-600 ring-4 ring-blue-600/30' :
                      'bg-slate-700'
                    }`}>
                      {step.icon}
                    </div>
                    <span className="text-xs text-slate-400 group-hover:text-white transition hidden md:block">
                      {step.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Transform Your COBOL?</h2>
            <div className="flex items-center justify-center gap-4">
              <Link 
                href="/dashboard"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl text-lg font-semibold transition shadow-lg shadow-blue-600/30 flex items-center gap-2"
              >
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/docs"
                className="px-8 py-4 bg-slate-700 hover:bg-slate-600 rounded-xl text-lg font-semibold transition flex items-center gap-2"
              >
                <FileText className="w-5 h-5" /> Read Docs
              </Link>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5);
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.5);
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}
