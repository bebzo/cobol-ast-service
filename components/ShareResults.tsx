"use client";

import { useState } from "react";
import { Mail, Link2, FileText, Share2, Check, Linkedin, Twitter, Copy } from "lucide-react";

interface ShareResultsProps {
  cobolLines: number;
  pythonLines: number;
  confidence: number;
  filename: string;
  onGeneratePDF: () => void;
}

export default function ShareResults({
  cobolLines,
  pythonLines,
  confidence,
  filename,
  onGeneratePDF,
}: ShareResultsProps) {
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  
  const shareText = `Just transpiled ${cobolLines} lines of COBOL to ${pythonLines} lines of Python in seconds with @CodeSwitchAI! ${confidence}% confidence score. 🚀 #COBOL #Python #ModernizeLegacy`;
  
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const emailSubject = `COBOL to Python Migration Results - ${filename}`;
  const emailBody = `Hi,\n\nI just used CodeSwitch to transpile ${cobolLines} lines of COBOL to ${pythonLines} lines of production-ready Python.\n\nKey Results:\n- Confidence Score: ${confidence}%\n- Code Ratio: ${(pythonLines/cobolLines).toFixed(1)}x expansion\n- Status: Production-Ready\n\nCheck it out: ${shareUrl}\n\nBest regards`;
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition border border-slate-600"
      >
        <Share2 className="w-4 h-4" />
        Share Results
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)} 
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 rounded-xl border border-slate-700 shadow-xl z-50 overflow-hidden">
            <div className="p-3 border-b border-slate-700">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Share your results</p>
            </div>
            
            <div className="p-2">
              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700/50 rounded-lg transition text-left"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Link2 className="w-4 h-4 text-slate-400" />
                )}
                <span className={copied ? "text-green-400" : "text-white"}>
                  {copied ? "Link Copied!" : "Copy Shareable Link"}
                </span>
              </button>

              {/* Email */}
              <a
                href={mailtoUrl}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700/50 rounded-lg transition"
              >
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-white">Email Results to Team</span>
              </a>

              {/* Generate PDF */}
              <button
                onClick={() => {
                  onGeneratePDF();
                  setShowDropdown(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700/50 rounded-lg transition text-left"
              >
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-white">Generate PDF Report</span>
              </button>
            </div>

            <div className="p-2 border-t border-slate-700">
              <p className="px-3 py-1 text-xs text-slate-500">Share on social</p>
              
              {/* LinkedIn */}
              <a
                href={linkedInShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-600/20 rounded-lg transition"
              >
                <Linkedin className="w-4 h-4 text-blue-400" />
                <span className="text-white">Share on LinkedIn</span>
              </a>

              {/* Twitter */}
              <a
                href={twitterShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-sky-600/20 rounded-lg transition"
              >
                <Twitter className="w-4 h-4 text-sky-400" />
                <span className="text-white">Share on Twitter</span>
              </a>
            </div>

            {/* Pre-written tweet */}
            <div className="p-3 bg-slate-900/50 border-t border-slate-700">
              <p className="text-xs text-slate-400 mb-2">Suggested post:</p>
              <div className="relative">
                <p className="text-xs text-slate-300 bg-slate-800 p-2 rounded border border-slate-700">
                  "Just transpiled {cobolLines} lines COBOL→Python in 30 seconds with @CodeSwitchAI! 🚀 #Modernization"
                </p>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(`Just transpiled ${cobolLines} lines COBOL→Python in 30 seconds with @CodeSwitchAI! 🚀 #Modernization`);
                  }}
                  className="absolute top-1 right-1 p-1 hover:bg-slate-700 rounded"
                  title="Copy text"
                >
                  <Copy className="w-3 h-3 text-slate-500" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
