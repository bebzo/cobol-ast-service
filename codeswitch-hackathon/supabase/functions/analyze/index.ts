import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const GEMINI_PROMPT = `You are CodeSwitch Pro, a senior legacy migration architect with 25 years of experience.

MISSION: Generate PRODUCTION-QUALITY Python code with modern and extensible architecture.

REQUIRED ARCHITECTURE in python_code:
1. @dataclass for data structures
2. Externalizable configuration via JSON
3. Multi-year manager with configuration cache
4. Audit/logging system with CSV recording
5. Use Decimal for ALL financial calculations
6. Complete typing
7. Detailed docstrings
8. Built-in warnings if data is obsolete

Analyze this COBOL program and generate a strict JSON response:
{
  "summary": "One-sentence description",
  "business_context": {
    "domain": "Business domain",
    "detected_year": "Detected year",
    "regulatory_context": "Regulatory context",
    "is_obsolete": true/false,
    "obsolescence_reason": "Explanation if obsolete"
  },
  "python_code": "COMPLETE Python code",
  "unit_tests": "COMPLETE pytest tests",
  "config_json": "Example config file",
  "issues": ["Detected problems"],
  "improvements": ["Architectural improvements"],
  "security_warnings": [
    {
      "title": "Vulnerability name",
      "severity": "CRITICAL/HIGH/MEDIUM/LOW",
      "cvss_score": 0.0,
      "location": "Line or section",
      "description": "What the issue is",
      "vulnerable_code": "Code snippet",
      "fix": "Recommended fix"
    }
  ],
  "migration_score": {
    "complexity": "LOW/MEDIUM/HIGH",
    "risk_level": "LOW/MEDIUM/HIGH/CRITICAL",
    "estimated_effort": "Person-days",
    "confidence": "Percentage"
  },
  "architecture_diagram": "graph LR; A[COBOL] --> B[Python]; ...",
  "next_steps": ["Actions for production"]
}

RULES:
1. python_code must be EXECUTABLE
2. Include 2025 config example
3. Tests must cover edge cases
4. Return ONLY valid JSON

COBOL Code:
`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { cobolCode } = await req.json();
    
    if (!cobolCode) {
      return new Response(
        JSON.stringify({ error: "No COBOL code provided" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    let parsed = null;
    let lastError = "";

    // Retry up to 3 times
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await model.generateContent(GEMINI_PROMPT + cobolCode);
        const responseText = result.response.text();

        let jsonStr = responseText;
        
        if (responseText.includes("```json")) {
          jsonStr = responseText.split("```json")[1].split("```")[0].trim();
        } else if (responseText.includes("```")) {
          jsonStr = responseText.split("```")[1].split("```")[0].trim();
        }
        
        jsonStr = jsonStr
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']');
        
        if (!jsonStr.startsWith('{')) {
          const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
          if (jsonMatch) jsonStr = jsonMatch[0];
        }

        parsed = JSON.parse(jsonStr);
        break;
      } catch (parseErr) {
        lastError = parseErr instanceof Error ? parseErr.message : "Parse error";
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }

    if (!parsed) {
      return new Response(
        JSON.stringify({ error: `Parsing failed: ${lastError}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
