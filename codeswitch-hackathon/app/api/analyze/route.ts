import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const GEMINI_PROMPT = `You are CodeSwitch Pro, a senior legacy migration architect with 25 years of experience.

MISSION: Generate PRODUCTION-QUALITY Python code with modern and extensible architecture.

REQUIRED ARCHITECTURE in python_code:
1. @dataclass for data structures (e.g., TaxBracket with lower_limit, upper_limit, rate as Decimal)
2. Externalizable configuration via JSON (TaxConfig class with load() method)
3. Multi-year manager (TaxManager class with configuration cache)
4. Audit/logging system (TaxAudit class with CSV recording)
5. Use Decimal for ALL financial calculations
6. Complete typing (typing: List, Optional, Dict)
7. Detailed docstrings for each class/method
8. Built-in warnings if data is obsolete

Analyze this COBOL program and generate a strict JSON response:
{
  "summary": "One-sentence description",
  
  "business_context": {
    "domain": "Business domain (taxation, banking, insurance, HR)",
    "detected_year": "Detected or estimated year",
    "regulatory_context": "Regulatory context",
    "is_obsolete": true/false,
    "obsolescence_reason": "Explanation if obsolete"
  },
  
  "python_code": "COMPLETE Python code with: dataclasses TaxBracket, TaxConfig, TaxManager, TaxAudit, Decimal, typing, docstrings, obsolescence warnings, example JSON config in comments",
  
  "unit_tests": "COMPLETE pytest tests: test_configuration, test_nominal_calculation, test_edge_cases, test_brackets, test_audit",
  
  "config_json": "Example tax_config.json file with current 2025 brackets",
  
  "issues": ["Detected problems"],
  "improvements": ["Architectural improvements"],
  "security_warnings": [
    {
      "title": "Vulnerability name",
      "severity": "CRITICAL/HIGH/MEDIUM/LOW",
      "cvss_score": 0.0,
      "location": "Line or section",
      "description": "What the issue is",
      "vulnerable_code": "The problematic code snippet",
      "fix": "Recommended fix"
    }
  ],
  
  "migration_score": {
    "complexity": "LOW/MEDIUM/HIGH",
    "risk_level": "LOW/MEDIUM/HIGH/CRITICAL",
    "estimated_effort": "Person-days",
    "confidence": "Percentage"
  },
  
  "architecture_diagram": "graph LR; A[COBOL Module] --> B[Python Class]; ... (valid Mermaid flowchart showing COBOL to Python mapping)",
  
  "next_steps": ["Actions for production"]
}

RULES:
1. python_code must be EXECUTABLE and include ALL mentioned classes
2. Include a 2025 JSON config example in code comments
3. Tests must cover edge cases (0, negative, very large)
4. Return ONLY valid JSON

COBOL Code:
`;

export async function POST(request: NextRequest) {
  try {
    const { cobolCode } = await request.json();
    
    if (!cobolCode) {
      return NextResponse.json({ error: "No COBOL code provided" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
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
        
        // Extract JSON from markdown code blocks
        if (responseText.includes("```json")) {
          jsonStr = responseText.split("```json")[1].split("```")[0].trim();
        } else if (responseText.includes("```")) {
          jsonStr = responseText.split("```")[1].split("```")[0].trim();
        }
        
        // Clean common JSON issues
        jsonStr = jsonStr
          .replace(/[\x00-\x1F\x7F]/g, (match) => match === '\n' || match === '\r' || match === '\t' ? match : ' ')
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']');
        
        // Try to find JSON object if still failing
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
      return NextResponse.json({ error: `Parsing failed: ${lastError}` }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
