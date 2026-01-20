#!/usr/bin/env python3
"""
Script to fix the production readiness calculation to ensure it can reach 100%.
This addresses the issue where the score might not properly calculate based on real data.
"""

import re

def fix_readiness_calculation():
    """Fix the production readiness score calculation in page.tsx"""
    
    file_path = "/workspace/app/dashboard/page.tsx"
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find and replace the production readiness calculation block
    # The old code has the correct formula but might have subtle issues
    
    old_block = '''{(() => {
                // Extract values from analysis data
                const coverage = analysis?.coverage_metrics?.translation_rate || 0;
                const confidence = typeof analysis?.migration_score?.confidence === 'number' 
                  ? analysis.migration_score.confidence 
                  : parseInt(String(analysis?.migration_score?.confidence || '0').replace(/[^0-9]/g, '')) || 0;
                const securityIssues = analysis?.security_warnings?.length || 0;
                const issuesCount = analysis?.issues?.length || 0;
                const improvementsCount = analysis?.improvements?.length || 0;

                // Calculate individual scores
                const coverageScore = Math.min(100, coverage); // Already a percentage (0-100)
                const confidenceScore = confidence; // Already 0-100
                
                // Security score: 100 minus 15 points per security issue
                const securityScore = Math.max(0, 100 - (securityIssues * 15));
                
                // Quality score: 100 minus 5 points per issue/improvement
                const qualityScore = Math.max(0, 100 - ((issuesCount + improvementsCount) * 5));

                // Calculate weighted overall score
                const overallScore = Math.round(
                  (coverageScore * 0.25) +
                  (confidenceScore * 0.30) +
                  (securityScore * 0.25) +
                  (qualityScore * 0.20)
                );
                
                // Calculate max possible score based on available data
                const maxPossibleScore = (
                  (coverage > 0 ? 0.25 : 0) +
                  (confidence > 0 ? 0.30 : 0) +
                  (securityIssues >= 0 ? 0.25 : 0) +
                  ((issuesCount + improvementsCount) >= 0 ? 0.20 : 0)
                ) * 100;

                // If maxPossibleScore is 0, show prompt
                if (maxPossibleScore === 0) {
                  return (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                      <FlaskConical className="w-12 h-12 mb-3 opacity-50" />
                      <p className="text-lg font-medium text-slate-300 mb-2">Production Readiness</p>
                      <p className="text-sm text-center">Run a COBOL analysis to calculate your production readiness score</p>
                    </div>
                  );
                }

                // Normalize score to 100% scale
                const normalizedScore = Math.round((overallScore / maxPossibleScore) * 100);

                // Cap at 100
                const finalScore = Math.min(100, normalizedScore);

                // Determine score level and color
                const scoreLevel = finalScore >= 90 ? 'Excellent' : finalScore >= 75 ? 'Good' : finalScore >= 50 ? 'Fair' : 'Needs Work';
                const scoreColor = finalScore >= 90 ? 'text-green-400' : finalScore >= 75 ? 'text-emerald-400' : finalScore >= 50 ? 'text-yellow-400' : 'text-red-400';
                const scoreBg = finalScore >= 90 ? 'from-green-500/20 to-emerald-500/10' : finalScore >= 75 ? 'from-emerald-500/20 to-teal-500/10' : finalScore >= 50 ? 'from-yellow-500/20 to-amber-500/10' : 'from-red-500/20 to-orange-500/10';
                const scoreBorder = finalScore >= 90 ? 'border-green-500/30' : finalScore >= 75 ? 'border-emerald-500/30' : finalScore >= 50 ? 'border-yellow-500/30' : 'border-red-500/30';

                return (
                  <div className="bg-gradient-to-br ${scoreBg} rounded-xl p-6 border ${scoreBorder}">
                    {/* Score Circle */}
                    <div className="flex justify-center mb-6">
                      <div className="relative w-32 h-32">
                        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-700" />
                          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" 
                            strokeDasharray={`${finalScore * 2.83} 283`} 
                            className={finalScore >= 90 ? 'text-green-400' : finalScore >= 75 ? 'text-emerald-400' : finalScore >= 50 ? 'text-yellow-400' : 'text-red-400'}
                            strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl font-bold ${scoreColor}">{finalScore}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Score Level */}
                    <div className="text-center mb-6">
                      <span className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${finalScore >= 90 ? 'bg-green-500/20 text-green-300' : finalScore >= 75 ? 'bg-emerald-500/20 text-emerald-300' : finalScore >= 50 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}`}>
                        {scoreLevel}
                      </span>
                    </div>

                    {/* Metrics Breakdown */}
                    <div className="space-y-3 text-sm">
                      {/* Coverage Score */}
                      <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                        <span className="text-slate-400">Translation Coverage</span>
                        <span className="font-medium ${coverageScore >= 90 ? 'text-green-400' : coverageScore >= 70 ? 'text-yellow-400' : 'text-red-400'}">
                          {coverageScore.toFixed(1)}%
                        </span>
                      </div>

                      {/* Confidence Score */}
                      <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                        <span className="text-slate-400">Migration Confidence</span>
                        <span className="font-medium ${confidenceScore >= 90 ? 'text-green-400' : confidenceScore >= 70 ? 'text-yellow-400' : 'text-red-400'}">
                          {confidenceScore}%
                        </span>
                      </div>

                      {/* Security Score */}
                      <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                        <span className="text-slate-400">Security Score</span>
                        <span className="font-medium ${securityScore >= 90 ? 'text-green-400' : securityScore >= 70 ? 'text-yellow-400' : 'text-red-400'}">
                          {securityScore}%
                        </span>
                      </div>

                      {/* Quality Score */}
                      <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                        <span className="text-slate-400">Code Quality</span>
                        <span className="font-medium ${qualityScore >= 90 ? 'text-green-400' : qualityScore >= 70 ? 'text-yellow-400' : 'text-red-400'}">
                          {qualityScore}%
                        </span>
                      </div>
                    </div>

                    {/* Component Scores */}
                    <div className="mt-6 pt-4 border-t border-slate-700/50">
                      <p className="text-xs text-slate-500 mb-3">Component Contributions</p>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-20 text-slate-400">Coverage</div>
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400 rounded-full" style={{width: '${coverageScore}%'}} />
                          </div>
                          <div className="w-10 text-right text-slate-300">${Math.round(coverageScore * 0.25)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 text-slate-400">Confidence</div>
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-400 rounded-full" style={{width: '${confidenceScore}%'}} />
                          </div>
                          <div className="w-10 text-right text-slate-300">${Math.round(confidenceScore * 0.30)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 text-slate-400">Security</div>
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-green-400 rounded-full" style={{width: '${securityScore}%'}} />
                          </div>
                          <div className="w-10 text-right text-slate-300">${Math.round(securityScore * 0.25)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 text-slate-400">Quality</div>
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-400 rounded-full" style={{width: '${qualityScore}%'}} />
                          </div>
                          <div className="w-10 text-right text-slate-300">${Math.round(qualityScore * 0.20)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Recommendations */}
                    {finalScore < 90 && (
                      <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                        <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-400" />
                          Recommendations to Improve Score
                        </h4>
                        <ul className="text-xs text-slate-400 space-y-1">
                          {coverageScore < 90 && <li className="flex items-center gap-2">• Improve translation coverage for better coverage score</li>}
                          {confidenceScore < 90 && <li className="flex items-center gap-2">• Review migration strategy to increase confidence</li>}
                          {securityScore < 90 && <li className="flex items-center gap-2">• Address ${securityIssues} security issue(s) identified</li>}
                          {qualityScore < 90 && <li className="flex items-center gap-2">• Fix ${issuesCount + improvementsCount} code issue(s) for better quality</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}'''

    new_block = '''{(() => {
                // Extract values from analysis data - REAL VALUES ONLY
                const coverage = analysis?.coverage_metrics?.translation_rate || 0;
                const confidenceRaw = analysis?.migration_score?.confidence;
                
                // Parse confidence - handle both number and string formats from AI
                let confidence = 0;
                if (typeof confidenceRaw === 'number') {
                  confidence = confidenceRaw;
                } else if (typeof confidenceRaw === 'string') {
                  // Extract numeric value from string like "85%" or "85"
                  const extracted = parseInt(confidenceRaw.replace(/[^0-9]/g, ''));
                  confidence = isNaN(extracted) ? 0 : extracted;
                }
                
                const securityIssues = Array.isArray(analysis?.security_warnings) ? analysis.security_warnings.length : 0;
                const issuesCount = Array.isArray(analysis?.issues) ? analysis.issues.length : 0;
                const improvementsCount = Array.isArray(analysis?.improvements) ? analysis.improvements.length : 0;

                // Check if we have real analysis data
                const hasRealData = coverage > 0 || confidence > 0 || securityIssues > 0 || issuesCount > 0 || improvementsCount > 0;
                
                if (!hasRealData) {
                  return (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                      <FlaskConical className="w-12 h-12 mb-3 opacity-50" />
                      <p className="text-lg font-medium text-slate-300 mb-2">Production Readiness</p>
                      <p className="text-sm text-center">Run a COBOL analysis to calculate your production readiness score</p>
                    </div>
                  );
                }

                // Calculate individual scores (all on 0-100 scale)
                const coverageScore = Math.min(100, Math.max(0, coverage));
                const confidenceScore = Math.min(100, Math.max(0, confidence));
                
                // Security score: 100 minus 15 points per security issue (capped at 0)
                const securityScore = Math.max(0, 100 - (securityIssues * 15));
                
                // Quality score: 100 minus 5 points per issue/improvement (capped at 0)
                const qualityScore = Math.max(0, 100 - ((issuesCount + improvementsCount) * 5));

                // Calculate weighted overall score
                // Formula: (coverage × 0.25) + (confidence × 0.30) + (security × 0.25) + (quality × 0.20)
                // This CAN reach 100% when all inputs are 100:
                // (100×0.25) + (100×0.30) + (100×0.25) + (100×0.20) = 25 + 30 + 25 + 20 = 100
                const rawScore = 
                  (coverageScore * 0.25) +
                  (confidenceScore * 0.30) +
                  (securityScore * 0.25) +
                  (qualityScore * 0.20);
                
                // Round to nearest integer
                const overallScore = Math.round(rawScore);
                
                // Ensure score is between 0 and 100
                const finalScore = Math.min(100, Math.max(0, overallScore));

                // Determine score level and color
                const scoreLevel = finalScore >= 90 ? 'Excellent' : finalScore >= 75 ? 'Good' : finalScore >= 50 ? 'Fair' : 'Needs Work';
                const scoreColor = finalScore >= 90 ? 'text-green-400' : finalScore >= 75 ? 'text-emerald-400' : finalScore >= 50 ? 'text-yellow-400' : 'text-red-400';
                const scoreBg = finalScore >= 90 ? 'from-green-500/20 to-emerald-500/10' : finalScore >= 75 ? 'from-emerald-500/20 to-teal-500/10' : finalScore >= 50 ? 'from-yellow-500/20 to-amber-500/10' : 'from-red-500/20 to-orange-500/10';
                const scoreBorder = finalScore >= 90 ? 'border-green-500/30' : finalScore >= 75 ? 'border-emerald-500/30' : finalScore >= 50 ? 'border-yellow-500/30' : 'border-red-500/30';

                return (
                  <div className={`bg-gradient-to-br ${scoreBg} rounded-xl p-6 border ${scoreBorder}`}>
                    {/* Score Circle */}
                    <div className="flex justify-center mb-6">
                      <div className="relative w-32 h-32">
                        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-700" />
                          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" 
                            strokeDasharray={`${finalScore * 2.83} 283`} 
                            className={finalScore >= 90 ? 'text-green-400' : finalScore >= 75 ? 'text-emerald-400' : finalScore >= 50 ? 'text-yellow-400' : 'text-red-400'}
                            strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-3xl font-bold ${scoreColor}`}>{finalScore}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Score Level */}
                    <div className="text-center mb-6">
                      <span className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${finalScore >= 90 ? 'bg-green-500/20 text-green-300' : finalScore >= 75 ? 'bg-emerald-500/20 text-emerald-300' : finalScore >= 50 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}`}>
                        {scoreLevel}
                      </span>
                    </div>

                    {/* Metrics Breakdown */}
                    <div className="space-y-3 text-sm">
                      {/* Coverage Score */}
                      <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                        <span className="text-slate-400">Translation Coverage</span>
                        <span className={`font-medium ${coverageScore >= 90 ? 'text-green-400' : coverageScore >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {coverageScore.toFixed(1)}%
                        </span>
                      </div>

                      {/* Confidence Score */}
                      <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                        <span className="text-slate-400">Migration Confidence</span>
                        <span className={`font-medium ${confidenceScore >= 90 ? 'text-green-400' : confidenceScore >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {confidenceScore}%
                        </span>
                      </div>

                      {/* Security Score */}
                      <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                        <span className="text-slate-400">Security Score</span>
                        <span className={`font-medium ${securityScore >= 90 ? 'text-green-400' : securityScore >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {securityScore}%
                        </span>
                      </div>

                      {/* Quality Score */}
                      <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                        <span className="text-slate-400">Code Quality</span>
                        <span className={`font-medium ${qualityScore >= 90 ? 'text-green-400' : qualityScore >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {qualityScore}%
                        </span>
                      </div>
                    </div>

                    {/* Component Scores */}
                    <div className="mt-6 pt-4 border-t border-slate-700/50">
                      <p className="text-xs text-slate-500 mb-3">Component Contributions (weighted)</p>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-20 text-slate-400">Coverage</div>
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400 rounded-full" style={{width: `${coverageScore}%`}} />
                          </div>
                          <div className="w-10 text-right text-slate-300">{Math.round(coverageScore * 0.25)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 text-slate-400">Confidence</div>
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-400 rounded-full" style={{width: `${confidenceScore}%`}} />
                          </div>
                          <div className="w-10 text-right text-slate-300">{Math.round(confidenceScore * 0.30)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 text-slate-400">Security</div>
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-green-400 rounded-full" style={{width: `${securityScore}%`}} />
                          </div>
                          <div className="w-10 text-right text-slate-300">{Math.round(securityScore * 0.25)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 text-slate-400">Quality</div>
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-400 rounded-full" style={{width: `${qualityScore}%`}} />
                          </div>
                          <div className="w-10 text-right text-slate-300">{Math.round(qualityScore * 0.20)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Recommendations */}
                    {finalScore < 90 && (
                      <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                        <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-400" />
                          Recommendations to Improve Score
                        </h4>
                        <ul className="text-xs text-slate-400 space-y-1">
                          {coverageScore < 90 && <li className="flex items-center gap-2">• Improve translation coverage for better coverage score</li>}
                          {confidenceScore < 90 && <li className="flex items-center gap-2">• Review migration strategy to increase confidence</li>}
                          {securityScore < 90 && <li className="flex items-center gap-2">• Address {securityIssues} security issue(s) identified</li>}
                          {qualityScore < 90 && <li className="flex items-center gap-2">• Fix {issuesCount + improvementsCount} code issue(s) for better quality</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}'''
    
    if old_block in content:
        content = content.replace(old_block, new_block)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ Production readiness score calculation fixed successfully!")
        print("\nKey improvements:")
        print("1. Confidence extraction handles both number and string formats")
        print("2. Proper validation of array lengths for security/issues")
        print("3. Clear check for real data before showing score")
        print("4. Fixed template literal syntax for dynamic values")
        print("\nThe formula can now reach 100%:")
        print("  (100×0.25) + (100×0.30) + (100×0.25) + (100×0.20) = 100")
    else:
        print("❌ Could not find the production readiness block to replace")
        print("Searching for similar patterns...")
        
        # Try to find the block with a more flexible pattern
        pattern = r"activeTestsSubTab === \"readiness\"[\s\S]*?return \("
        match = re.search(pattern, content)
        if match:
            print(f"Found pattern at position {match.start()}")
            print("The file structure might be different than expected")
        else:
            print("No matching pattern found")

if __name__ == "__main__":
    fix_readiness_calculation()
