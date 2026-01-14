import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const { query, cobolCode, pythonCode, analysis } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Build comprehensive context from analysis
    let analysisContext = '';
    if (analysis) {
      const metrics = {
        cobolLines: analysis.cobol_lines || 0,
        pythonLines: analysis.python_lines || 0,
        confidence: analysis.migration_score?.confidence || 0,
        complexity: analysis.migration_score?.complexity || 'Unknown',
        riskLevel: analysis.migration_score?.risk_level || 'Unknown',
        effort: analysis.migration_score?.estimated_effort || 'Unknown',
      };
      
      const issues = analysis.issues || [];
      const improvements = analysis.improvements || [];
      const securityWarnings = analysis.security_warnings || [];
      const nextSteps = analysis.next_steps || [];
      
      // Coverage metrics if available
      const coverage = analysis.coverage_metrics || {};
      
      analysisContext = `
## ANALYSIS METRICS (You have full access to these):
- COBOL Lines: ${metrics.cobolLines}
- Python Lines: ${metrics.pythonLines}
- Translation Rate: ${coverage.translation_rate || 100}%
- Methods Generated: ${coverage.python_methods_generated || 0}
- Variables Detected: ${coverage.variables_detected || 0}
- Confidence Score: ${metrics.confidence}%
- Complexity: ${metrics.complexity}
- Risk Level: ${metrics.riskLevel}
- Estimated Effort: ${metrics.effort}

## ISSUES FOUND (${issues.length}):
${issues.slice(0, 5).map((i: any) => `- ${typeof i === 'string' ? i : i.title || JSON.stringify(i)}`).join('\n')}

## IMPROVEMENTS (${improvements.length}):
${improvements.slice(0, 5).map((i: any) => `- ${typeof i === 'string' ? i : i}`).join('\n')}

## SECURITY WARNINGS (${securityWarnings.length}):
${securityWarnings.slice(0, 5).map((w: any) => `- [${w.severity || 'INFO'}] ${w.title || w}`).join('\n')}

## NEXT STEPS:
${nextSteps.slice(0, 4).map((s: string) => `- ${s}`).join('\n')}

## BUSINESS CONTEXT:
- Domain: ${analysis.business_context?.domain || 'Enterprise'}
- Summary: ${analysis.summary || 'No summary'}
`;
    }

    const prompt = `Tu es un expert en migration COBOL vers Python. Tu as accès à TOUTE l'analyse qui vient d'être faite.

${analysisContext}

## CODE COBOL (extrait):
\`\`\`cobol
${cobolCode || 'Non fourni'}
\`\`\`

## CODE PYTHON GÉNÉRÉ (extrait):
\`\`\`python
${pythonCode || 'Non fourni'}
\`\`\`

## QUESTION DE L'UTILISATEUR:
${query}

## INSTRUCTIONS:
- Réponds de manière détaillée et professionnelle (5-10 phrases)
- Utilise les métriques et données d'analyse ci-dessus pour enrichir ta réponse
- Si on te demande des stats, donne les chiffres précis de l'analyse
- Si on te demande les risques, liste les security warnings trouvés
- Si on te demande les améliorations, donne les recommendations concrètes
- Réponds dans la langue de la question (français si question en français)

RÉPONSE:`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    return NextResponse.json({ response }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('[Chat Error]', error);
    return NextResponse.json(
      { response: "Désolé, je n'ai pas pu traiter votre demande." },
      { status: 500, headers: corsHeaders }
    );
  }
}
