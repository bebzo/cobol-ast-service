"use client";

import { useState, useEffect } from "react";
import { Download, Phone, Sparkles, TrendingUp, Users, Zap } from "lucide-react";

interface ConversionCTAProps {
  confidence: number;
  cobolLines: number;
  pythonLines: number;
  onDownload: () => void;
  onScheduleDemo?: () => void;
}

export default function ConversionCTA({
  confidence,
  cobolLines,
  pythonLines,
  onDownload,
  onScheduleDemo,
}: ConversionCTAProps) {
  const [transpilationCount, setTranspilationCount] = useState(12847);
  const [companyCount, setCompanyCount] = useState(87);
  
  // Simulate live counter (increment occasionally)
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setTranspilationCount(prev => prev + Math.floor(Math.random() * 3) + 1);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calculate estimated savings
  const hourlyRate = 150; // Average developer rate
  const manualHours = Math.ceil(cobolLines / 50); // ~50 lines/hour manual
  const automatedHours = 1; // 1 hour with CodeSwitch
  const savings = (manualHours - automatedHours) * hourlyRate;
  const speedup = Math.round(manualHours / automatedHours);

  const isPerfect = confidence >= 100;

  return (
    <div className="mt-6 space-y-4">
      {/* Success Banner for 100% confidence */}
      {isPerfect && (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-6 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMiIvPjwvZz48L3N2Zz4=')] opacity-20" />
          
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  🎉 Perfect Translation - 100% Confidence!
                </h3>
                <p className="text-green-100 text-sm">
                  Your code is production-ready. Download and deploy with confidence.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={onDownload}
                className="flex items-center gap-2 px-6 py-3 bg-white text-green-700 rounded-lg font-bold hover:bg-green-50 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Download className="w-5 h-5" />
                Download Python Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main CTA Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Download CTA */}
        <button
          onClick={onDownload}
          className="group flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-white transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          <div className="p-3 bg-white/20 rounded-full group-hover:scale-110 transition-transform">
            <Download className="w-6 h-6" />
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">Download Code</p>
            <p className="text-sm text-indigo-200">Python + Tests (FREE)</p>
          </div>
        </button>

        {/* Schedule Demo CTA */}
        <button
          onClick={onScheduleDemo || (() => window.open('/contact', '_blank'))}
          className="group flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 rounded-xl text-white transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 border border-slate-600"
        >
          <div className="p-3 bg-white/10 rounded-full group-hover:scale-110 transition-transform">
            <Phone className="w-6 h-6" />
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">Schedule Demo</p>
            <p className="text-sm text-slate-400">Enterprise volume pricing</p>
          </div>
        </button>

        {/* ROI Summary */}
        <div className="flex flex-col justify-center gap-2 p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/30">
          <div className="flex items-center gap-2 text-amber-400">
            <TrendingUp className="w-5 h-5" />
            <span className="font-bold">Your Savings</span>
          </div>
          <div className="text-3xl font-bold text-white">
            ${savings.toLocaleString()}
          </div>
          <p className="text-sm text-slate-400">
            {speedup}x faster than manual rewrite
          </p>
          <p className="text-xs text-slate-500">
            {manualHours}h manual → {automatedHours}h with CodeSwitch
          </p>
        </div>
      </div>

      {/* Social Proof Bar */}
      <div className="flex items-center justify-center gap-8 py-4 px-6 bg-slate-800/50 rounded-xl border border-slate-700">
        <div className="flex items-center gap-2 text-slate-300">
          <Zap className="w-5 h-5 text-yellow-400" />
          <span className="font-mono font-bold text-yellow-400">
            {transpilationCount.toLocaleString()}
          </span>
          <span className="text-slate-400 text-sm">COBOL programs transpiled</span>
        </div>
        
        <div className="w-px h-6 bg-slate-600" />
        
        <div className="flex items-center gap-2 text-slate-300">
          <Users className="w-5 h-5 text-blue-400" />
          <span className="font-mono font-bold text-blue-400">{companyCount}</span>
          <span className="text-slate-400 text-sm">companies trust us</span>
        </div>
      </div>

      {/* Upgrade Banner for high volume */}
      {cobolLines > 500 && (
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 rounded-xl border border-purple-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="font-semibold text-white">
                Need to transpile 10,000+ lines?
              </p>
              <p className="text-sm text-slate-400">
                Get volume discounts and dedicated support
              </p>
            </div>
          </div>
          <a
            href="/pricing"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition"
          >
            See Enterprise Plans →
          </a>
        </div>
      )}
    </div>
  );
}
