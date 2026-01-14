import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Phase 4: COBOL documentation links
const COBOL_DOCS: Record<string, string> = {
  'COMP-3': 'Packed decimal format - each digit uses 4 bits, sign in last nibble. Python equivalent: Decimal with banker rounding.',
  'REDEFINES': 'Memory overlay - same memory location with different structure. Python: Use dataclass with properties or union types.',
  'OCCURS': 'Array declaration. Python: List with fixed size or typed array.',
  'PIC': 'Picture clause defines data format. 9=numeric, X=alphanumeric, S=signed, V=implied decimal.',
  'PERFORM': 'Procedure call or loop. Python: function call or for/while loop.',
  'COPY': 'Include copybook (external file). Python: import statement.',
  'WORKING-STORAGE': 'Program variables section. Python: class attributes in __init__.',
  'FILE-CONTROL': 'File definitions. Python: FileManager class with context managers.',
  '88-LEVEL': 'Condition names (boolean flags). Python: @property returning bool.',
  'EVALUATE': 'Switch/case statement. Python: match/case or if/elif chain.',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const { 
      query, 
      cobolCode, 
      pythonCode, 
      analysis, 
      testResults,
      // Phase 1: Enhanced context
      selectedLine,
      activeError,
      conversationHistory // Phase 3: Conversation memory
    } = await request.json();

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

    // Phase 1: Build enhanced context
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
      const coverage = analysis.coverage_metrics || {};
      
      // Extract COBOL structure info
      const transpilerStats = analysis.transpiler_stats || {};
      const paragraphs = transpilerStats.cobol_paragraphs || 0;
      const variables = transpilerStats.cobol_variables || 0;
      const programId = transpilerStats.program_id || 'UNKNOWN';
      
      analysisContext = `
## ANALYSIS METRICS:
- Program ID: ${programId}
- COBOL Lines: ${metrics.cobolLines}
- Python Lines: ${metrics.pythonLines}
- COBOL Paragraphs: ${paragraphs}
- COBOL Variables: ${variables}
- Translation Rate: ${coverage.translation_rate || 100}%
- Methods Generated: ${coverage.python_methods_generated || 0}
- Confidence Score: ${metrics.confidence}%
- Complexity: ${metrics.complexity}
- Risk Level: ${metrics.riskLevel}
- Estimated Effort: ${metrics.effort}

## TEST RESULTS:
- Tests Total: ${testResults?.total || 0}
- Tests Passed: ${testResults?.passed || 0}
- Tests Failed: ${testResults?.failed || 0}
- Pass Rate: ${testResults?.total > 0 ? Math.round((testResults.passed / testResults.total) * 100) : 0}%

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

    // Phase 1: Selected line context
    let lineContext = '';
    if (selectedLine) {
      lineContext = `
## CONTEXTE LIGNE SÉLECTIONNÉE:
- Numéro de ligne: ${selectedLine.lineNumber}
- Type: ${selectedLine.type} (COBOL/Python)
- Contenu: \`${selectedLine.content}\`
${selectedLine.mappedLine ? `- Ligne correspondante: ${selectedLine.mappedLine}` : ''}
`;
    }

    // Phase 1: Active error context
    let errorContext = '';
    if (activeError) {
      errorContext = `
## ERREUR ACTIVE:
- Type: ${activeError.type}
- Message: ${activeError.message}
- Ligne: ${activeError.line || 'N/A'}
- Suggestion: ${activeError.suggestion || 'Aucune'}
`;
    }

    // Phase 3: Conversation history
    let historyContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      historyContext = `
## HISTORIQUE DE CONVERSATION (${conversationHistory.length} messages précédents):
${conversationHistory.slice(-5).map((h: any) => `- Q: ${h.query.substring(0, 100)}...\n  R: ${h.response.substring(0, 150)}...`).join('\n')}
`;
    }

    // Phase 4: Detect COBOL keywords for documentation
    const detectedKeywords: string[] = [];
    const queryUpper = query.toUpperCase();
    const codeToSearch = (cobolCode || '') + ' ' + query;
    
    Object.keys(COBOL_DOCS).forEach(keyword => {
      if (codeToSearch.toUpperCase().includes(keyword.replace('-', ' ')) || 
          codeToSearch.toUpperCase().includes(keyword)) {
        detectedKeywords.push(keyword);
      }
    });

    let docsContext = '';
    if (detectedKeywords.length > 0) {
      docsContext = `
## DOCUMENTATION COBOL PERTINENTE:
${detectedKeywords.slice(0, 3).map(kw => `### ${kw}\n${COBOL_DOCS[kw]}`).join('\n\n')}
`;
    }

    // Build the enhanced prompt
    const prompt = `Tu es un expert en migration COBOL vers Python, spécialisé dans les systèmes bancaires et financiers legacy.

${analysisContext}
${lineContext}
${errorContext}
${historyContext}
${docsContext}

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

## INSTRUCTIONS DE RÉPONSE:
1. **Sois SPÉCIFIQUE** - Utilise les noms exacts des variables, paragraphes, et lignes mentionnés
2. **Cite les métriques** - Si pertinent, donne les chiffres précis de l'analyse
3. **Explique le POURQUOI** - Pas juste ce qui se passe, mais pourquoi c'est ainsi
4. **Format Markdown** - Utilise des blocs de code, listes, et mise en forme
5. **Si code suggéré** - Mets-le dans un bloc \`\`\`python copiable
6. **Langue** - Réponds dans la langue de la question

## STRUCTURE DE RÉPONSE:
- Commence par répondre directement à la question
- Ajoute des détails techniques si pertinent
- Termine par 2-3 questions suggérées (Phase 5)

RÉPONSE:`;

    const result = await model.generateContent(prompt);
    let response = result.response.text();

    // Phase 5: Add suggested questions if not already present
    if (!response.includes('Question') && !response.includes('?')) {
      const suggestedQuestions = generateSuggestedQuestions(query, detectedKeywords, analysis);
      if (suggestedQuestions.length > 0) {
        response += `\n\n---\n**💡 Questions connexes:**\n${suggestedQuestions.map(q => `- ${q}`).join('\n')}`;
      }
    }

    return NextResponse.json({ 
      response,
      // Return detected keywords for UI to potentially show doc links
      detectedKeywords,
      suggestedQuestions: generateSuggestedQuestions(query, detectedKeywords, analysis)
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('[Chat Error]', error);
    return NextResponse.json(
      { response: "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer." },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Phase 5: Generate contextual suggested questions
function generateSuggestedQuestions(query: string, keywords: string[], analysis: any): string[] {
  const questions: string[] = [];
  const queryLower = query.toLowerCase();
  
  // Based on detected COBOL keywords
  if (keywords.includes('COMP-3')) {
    questions.push("Comment fonctionne l'arrondi bancaire avec COMP-3 ?");
  }
  if (keywords.includes('REDEFINES')) {
    questions.push("Montre-moi un exemple de REDEFINES converti en Python");
  }
  if (keywords.includes('OCCURS')) {
    questions.push("Comment les tableaux OCCURS sont-ils gérés ?");
  }
  
  // Based on query content
  if (queryLower.includes('erreur') || queryLower.includes('error')) {
    questions.push("Quelles sont les autres erreurs potentielles dans ce code ?");
  }
  if (queryLower.includes('performance') || queryLower.includes('lent')) {
    questions.push("Comment optimiser les performances de ce code Python ?");
  }
  if (queryLower.includes('test')) {
    questions.push("Quels tests supplémentaires recommandes-tu ?");
  }
  
  // Based on analysis state
  if (analysis?.security_warnings?.length > 0) {
    questions.push("Explique le warning de sécurité le plus critique");
  }
  if (analysis?.issues?.length > 0) {
    questions.push("Comment résoudre les issues détectées ?");
  }
  
  // Default questions if none matched
  if (questions.length === 0) {
    questions.push("Quelles sont les différences majeures entre ce COBOL et le Python généré ?");
    questions.push("Ce code est-il prêt pour la production ?");
  }
  
  return questions.slice(0, 3);
}
