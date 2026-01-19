import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Helper function to store readiness analysis in Supabase
async function storeReadinessAnalysis(data: any, analysisId?: string) {
  if (!supabase) {
    console.log('Supabase not configured, skipping storage');
    return null;
  }

  try {
    const id = analysisId || randomUUID();
    const { error } = await supabase
      .from('readiness_analyses')
      .upsert({
        id,
        score: data.score,
        grade: data.grade,
        summary: data.summary,
        recommendations: data.recommendations,
        metrics: data.metrics,
        issues: data.issues,
        production_ready: data.production_ready,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('Supabase storage error:', error);
      return null;
    }

    return id;
  } catch (err) {
    console.error('Supabase error:', err);
    return null;
  }
}

// Helper function to get historical scores from Supabase
async function getHistoricalScores(limit: number = 10) {
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('readiness_analyses')
      .select('created_at, score, grade')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Supabase fetch error:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Supabase fetch error:', err);
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get historical scores from Supabase only
    const historicalScores = await getHistoricalScores(limit);

    // If no historical data and no script available, return error
    const scriptPath = `${process.cwd()}/lib/production_readiness_analyzer.py`;
    
    let stdout = '';
    let stderr = '';
    
    try {
      const result = await execAsync(`python3 "${scriptPath}" --json`, {
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024
      });
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (execError: any) {
      // No script available - return only historical data or error
      if (historicalScores.length === 0) {
        return NextResponse.json({
          error: 'No analysis available',
          message: 'Run a new analysis to generate production readiness data',
          historical_scores: [],
          mode: 'no_data'
        }, { status: 404 });
      }
      
      // Return historical data only
      return NextResponse.json({
        score: historicalScores[0].score,
        grade: historicalScores[0].grade,
        summary: 'Historical analysis data from Supabase',
        recommendations: ['Run a new analysis to get current scores'],
        metrics: {
          functions: 0, classes: 0, dataclasses: 0, async_functions: 0,
          type_annotated: 0, documented: 0, error_handled: 0, try_blocks: 0,
          test_functions: 0, hardcoded_secrets: 0, dangerous_calls: 0,
          input_validations: 0, logging_statements: 0, contextvars: 0,
          locks: 0, sql_queries: 0, orm_usage: 0
        },
        issues: [],
        production_ready: historicalScores[0].score >= 75,
        historical_scores: historicalScores.map(h => ({
          timestamp: h.created_at,
          score: h.score,
          grade: h.grade
        })),
        mode: 'historical_only'
      });
    }

    if (stderr && !stdout) {
      console.error('Python script error:', stderr);
      return NextResponse.json(
        { error: 'Analysis execution failed', details: stderr },
        { status: 500 }
      );
    }

    const result = JSON.parse(stdout);
    
    // Add historical data from Supabase
    result.historical_scores = historicalScores.map(h => ({
      timestamp: h.created_at,
      score: h.score,
      grade: h.grade
    }));
    
    result.mode = 'live_analysis';

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API error:', error);
    
    if (error.code === 'ETIMEDOUT') {
      return NextResponse.json(
        { error: 'Analysis timed out after 60 seconds' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to execute readiness analysis', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, targetPath, analysisId } = body;

    if (!code && !targetPath) {
      return NextResponse.json(
        { error: 'Either code or targetPath is required' },
        { status: 400 }
      );
    }

    const scriptPath = `${process.cwd()}/lib/production_readiness_analyzer.py`;
    
    // Write temporary file if code is provided
    let tempFilePath = '';
    if (code) {
      tempFilePath = `/tmp/readiness_analysis_${Date.now()}.py`;
      const fs = await import('fs');
      fs.writeFileSync(tempFilePath, code);
    }

    const target = targetPath || tempFilePath;
    
    let stdout = '';
    let stderr = '';
    
    try {
      const result = await execAsync(`python3 "${scriptPath}" --target "${target}" --json`, {
        timeout: 120000,
        maxBuffer: 20 * 1024 * 1024
      });
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (execError: any) {
      // Generate real analysis from code if script fails
      if (code) {
        const realAnalysis = generateRealAnalysisFromCode(code);
        
        // Store in Supabase
        const storedId = await storeReadinessAnalysis(realAnalysis, analysisId);
        realAnalysis.id = storedId;
        
        // Get historical data
        const historicalScores = await getHistoricalScores(10);
        realAnalysis.historical_scores = historicalScores.map(h => ({
          timestamp: h.created_at,
          score: h.score,
          grade: h.grade
        }));
        
        return NextResponse.json(realAnalysis);
      }
      
      throw execError;
    }

    // Clean up temp file
    if (tempFilePath) {
      const fs = await import('fs');
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }

    if (stderr && !stdout) {
      console.error('Python script error:', stderr);
      return NextResponse.json(
        { error: 'Analysis execution failed', details: stderr },
        { status: 500 }
      );
    }

    const result = JSON.parse(stdout);
    
    // Store result in Supabase for historical tracking
    const storedId = await storeReadinessAnalysis(result, analysisId);
    
    // Get historical scores from Supabase
    const historicalScores = await getHistoricalScores(10);
    result.historical_scores = historicalScores.map(h => ({
      timestamp: h.created_at,
      score: h.score,
      grade: h.grade
    }));
    
    result.id = storedId;
    result.mode = 'live_analysis';

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API error:', error);
    
    if (error.code === 'ETIMEDOUT') {
      return NextResponse.json(
        { error: 'Analysis timed out after 120 seconds' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to execute readiness analysis', details: error.message },
      { status: 500 }
    );
  }
}

// Fallback function to generate real analysis from code
function generateRealAnalysisFromCode(code: string): any {
  const metrics = {
    functions: (code.match(/def\s+\w+/g) || []).length,
    classes: (code.match(/class\s+\w+/g) || []).length,
    dataclasses: (code.match(/@dataclass/g) || []).length,
    async_functions: (code.match(/async\s+def/g) || []).length,
    type_annotated: (code.match(/:\s*\w+:/g) || []).length,
    documented: (code.match(/"""[\s\S]*?"""/g) || []).length,
    error_handled: (code.match(/except\s+/g) || []).length,
    try_blocks: (code.match(/try:/g) || []).length,
    test_functions: (code.match(/def\s+test_/g) || []).length,
    hardcoded_secrets: (code.match(/(password|secret|api_key|token)\s*=\s*['"][^'"]+['"]/gi) || []).length,
    dangerous_calls: (code.match(/eval\(|exec\(/g) || []).length,
    input_validations: (code.match(/if\s+.*isinstance|if\s+.*>=\s*0|if\s+.*\.strip\(\)/g) || []).length,
    logging_statements: (code.match(/logger\.|logging\./g) || []).length,
    contextvars: (code.match(/contextvars/g) || []).length,
    locks: (code.match(/threading\.(Lock|RLock)/g) || []).length,
    sql_queries: (code.match(/execute\(|cursor\./g) || []).length,
    orm_usage: (code.match(/\.filter\(|\.query\(/g) || []).length,
  };

  // Calculate real score
  let score = 50;
  score += Math.min(20, (metrics.type_annotated / Math.max(1, metrics.functions)) * 20);
  score += Math.min(15, (metrics.documented / Math.max(1, metrics.functions)) * 15);
  score += Math.min(15, (metrics.error_handled / Math.max(1, metrics.functions)) * 15);
  if (metrics.test_functions > 0) score += 10;
  if (metrics.logging_statements > 0) score += 5;
  if (metrics.async_functions > 0) score += 3;
  if (metrics.dataclasses > 0) score += 3;
  score -= metrics.hardcoded_secrets * 5;
  score -= metrics.dangerous_calls * 3;
  score = Math.min(100, Math.max(0, Math.round(score)));

  const issues: any[] = [];
  
  if (metrics.dangerous_calls > 0) {
    issues.push({
      severity: 'HIGH',
      category: 'Security',
      line_number: 0,
      message: 'Dangerous code execution detected (eval/exec)',
      suggestion: 'Avoid using eval() or exec() with user input',
      code_snippet: 'eval(...) or exec(...)'
    });
  }
  
  if (metrics.hardcoded_secrets > 0) {
    issues.push({
      severity: 'CRITICAL',
      category: 'Security',
      line_number: 0,
      message: 'Hardcoded secret detected',
      suggestion: 'Use environment variables or secrets manager',
      code_snippet: 'password = "..."'
    });
  }
  
  if (metrics.functions > metrics.try_blocks) {
    issues.push({
      severity: 'MEDIUM',
      category: 'Error Handling',
      line_number: 0,
      message: `${metrics.functions - metrics.try_blocks} functions lack error handling`,
      suggestion: 'Add try-except blocks to all functions',
      code_snippet: 'def function(...):  # No try-except'
    });
  }

  const recommendations: string[] = [];
  if (metrics.try_blocks === 0) recommendations.push('Add try-except blocks for error handling');
  if (metrics.logging_statements === 0) recommendations.push('Add logging statements for production monitoring');
  if (metrics.test_functions === 0) recommendations.push('Add unit tests using pytest');
  if (metrics.type_annotated < metrics.functions * 0.5) recommendations.push('Add type annotations for better code quality');
  if (metrics.hardcoded_secrets > 0) recommendations.push('Move secrets to environment variables');

  return {
    score,
    grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
    summary: `Analyzed ${metrics.functions} functions and ${metrics.classes} classes. ` +
             `Type coverage: ${metrics.functions > 0 ? Math.round((metrics.type_annotated / metrics.functions) * 100) : 0}%. ` +
             `Error handling: ${metrics.error_handled}/${metrics.functions} functions.`,
    recommendations,
    metrics,
    issues,
    production_ready: score >= 75,
    mode: 'static_analysis'
  };
}
