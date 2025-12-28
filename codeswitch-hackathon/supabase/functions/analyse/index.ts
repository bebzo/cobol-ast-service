import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.24.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Clean and fix malformed JSON from Gemini
function cleanJsonString(str: string): string {
  // Remove markdown code blocks
  str = str.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
  
  // Fix common escape issues in strings
  str = str.replace(/\\\n/g, '\\n');
  str = str.replace(/\t/g, '    ');
  
  // Remove control characters except newlines
  str = str.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return str.trim();
}

// Safe JSON parse with fallback
function safeJsonParse(text: string): any {
  const cleaned = cleanJsonString(text);
  
  try {
    return JSON.parse(cleaned);
  } catch (e1) {
    // Try to extract JSON object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e2) {
        // Return minimal valid response
        return null;
      }
    }
    return null;
  }
}

// Split COBOL into modules
function splitCobolModules(code: string) {
  const lines = code.split('\n');
  const modules: any[] = [];
  let currentModule = { name: 'MAIN', code: '', lines: 0, type: 'program', description: 'Main program', complexity: 'low', pythonTarget: 'main.py' };
  let currentDiv = '';

  for (const line of lines) {
    const divMatch = line.match(/^\s*(IDENTIFICATION|ENVIRONMENT|DATA|PROCEDURE)\s+DIVISION/i);
    if (divMatch) {
      const div = divMatch[1].toUpperCase();
      if (div !== currentDiv && currentModule.code.trim()) {
        currentModule.lines = currentModule.code.split('\n').filter(l => l.trim()).length;
        modules.push({ ...currentModule });
      }
      currentDiv = div;
      const lineCount = currentModule.code.split('\n').length;
      currentModule = {
        name: `${div} DIVISION`,
        code: line + '\n',
        lines: 0,
        type: 'division',
        description: `${div.charAt(0) + div.slice(1).toLowerCase()} division`,
        complexity: lineCount > 100 ? 'high' : lineCount > 50 ? 'medium' : 'low',
        pythonTarget: `${div.toLowerCase()}_division.py`
      };
    } else {
      currentModule.code += line + '\n';
    }
  }

  if (currentModule.code.trim()) {
    currentModule.lines = currentModule.code.split('\n').filter(l => l.trim()).length;
    modules.push(currentModule);
  }

  return modules.length > 0 ? modules : [{
    name: 'MAIN PROGRAM',
    code: code,
    lines: lines.length,
    type: 'program',
    description: 'Complete COBOL program',
    complexity: lines.length > 200 ? 'high' : 'medium',
    pythonTarget: 'main.py'
  }];
}

const STANDARD_PROMPT = `Analyze COBOL code. Return ONLY valid JSON (no markdown). ALL text in ENGLISH.

Required JSON structure:
{
  "summary": "brief description",
  "business_context": {"domain": "string", "detected_year": "string", "regulatory_context": "string"},
  "python_code": "complete Python translation",
  "unit_tests": "pytest code with 12+ test functions",
  "config_json": "JSON string with database, logging, limits, security settings",
  "issues": ["issue1", "issue2"],
  "improvements": ["improvement1", "improvement2"],
  "security_warnings": [{"title": "string", "severity": "HIGH/MEDIUM/LOW", "cvss_score": 0.0, "location": "string", "description": "string", "fix": "string"}],
  "migration_score": {"complexity": "low/medium/high", "risk_level": "low/medium/high", "estimated_effort": "string", "confidence": 85},
  "architecture_diagram": "mermaid diagram string",
  "next_steps": ["step1", "step2"]
}

IMPORTANT: Escape all special characters in strings. No raw newlines in string values.

COBOL CODE:
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { code, action, query } = await req.json();
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3
      }
    });

    // Voice query handling
    if (action === 'voice' && query) {
      const voicePrompt = `Answer this question about the COBOL code. Be concise and helpful. Return JSON: {"answer": "your answer here"}

Question: ${query}

COBOL:
${code?.substring(0, 5000) || 'No code provided'}`;

      const voiceResult = await model.generateContent(voicePrompt);
      const voiceText = voiceResult.response.text();
      const voiceParsed = safeJsonParse(voiceText);
      
      return new Response(
        JSON.stringify({ answer: voiceParsed?.answer || voiceText }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Main analysis
    const modules = splitCobolModules(code || '');
    const codeToAnalyze = code?.substring(0, 15000) || '';
    
    const result = await model.generateContent(STANDARD_PROMPT + codeToAnalyze);
    const responseText = result.response.text();
    const parsed = safeJsonParse(responseText);

    if (!parsed) {
      // Return fallback response if parsing fails
      return new Response(
        JSON.stringify({
          summary: "Analysis completed with parsing issues",
          python_code: "# Analysis in progress...\n# Please try again",
          unit_tests: "# Tests pending",
          config_json: "{}",
          issues: ["Response parsing failed"],
          improvements: [],
          security_warnings: [],
          migration_score: { complexity: "unknown", risk_level: "unknown", estimated_effort: "unknown", confidence: 0 },
          modules: modules,
          next_steps: ["Retry analysis"]
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add modules to response
    const finalResponse = {
      ...parsed,
      modules: modules
    };

    return new Response(
      JSON.stringify(finalResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        summary: "Error during analysis",
        python_code: "",
        unit_tests: "",
        config_json: "{}",
        modules: []
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
