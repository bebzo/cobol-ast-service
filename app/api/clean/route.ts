/**
 * Python Code Cleaner - Code-Doctor v2 (Sans Gemini)
 *
 * Stratégie:
 * 1. Appliquer des corrections regex rapides (rapide, pas d'API)
 * 2. Valider la syntaxe avec Pyodide et obtenir les erreurs exactes
 * 3. Corriger les erreurs spécifiques basées sur des patterns reconnus
 * 4. Répéter jusqu'à ce que le code soit valide (max 20 itérations)
 * 5. Appliquer un formatage de base pour la cohérence
 */

import { NextRequest, NextResponse } from 'next/server';

// Pyodide pour validation et correction syntaxique
let pyodideReady: Promise<any> | null = null;
let pyodideInstance: any = null;

async function getPyodide() {
  if (typeof window !== 'undefined') return null;
  try {
    // @ts-ignore
    const loadPyodide = globalThis.loadPyodide;
    if (!loadPyodide) return null;
    
    if (!pyodideReady) {
      pyodideReady = loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/'
      }).then(async (py: any) => {
        // Configurer Pyodide avec les fonctions de vérification
        py.runPython(`
          import sys
          from io import StringIO
          
          def check_syntax(code):
              """Vérifie la syntaxe Python et retourne les erreurs"""
              try:
                  compile(code, '<main>', 'exec')
                  return None  # Pas d'erreurs
              except SyntaxError as e:
                  return {
                      'msg': str(e.msg),
                      'filename': e.filename,
                      'lineno': e.lineno,
                      'offset': e.offset,
                      'text': e.text,
                      'type': 'SyntaxError'
                  }
              except Exception as e:
                  return {
                      'msg': str(e),
                      'type': str(type(e).__name__)
                  }
          
          def parse_syntax_tree(code):
              """Parse le code et retourne les tokens pour analyse"""
              try:
                  import ast
                  tree = ast.parse(code)
                  return {
                      'success': True,
                      'node_count': len(ast.walk(tree))
                  }
              except SyntaxError as e:
                  return {
                      'success': False,
                      'error': str(e.msg),
                      'lineno': e.lineno
                  }
        `);
        return py;
      });
    }
    
    if (!pyodideInstance) {
      pyodideInstance = await pyodideReady;
    }
    return pyodideInstance;
  } catch (e) {
    console.error('Pyodide init error:', e);
    return null;
  }
}

export const runtime = 'edge';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// ============================================
// CORRECTIONS RAPIDES (Regex - Pas d'API)
// ============================================

function applyQuickFixes(code: string): string {
  let cleaned = code;
  
  // Normaliser les fins de ligne
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Corriger les guillemets courbes
  cleaned = cleaned.replace(/\u2018/g, "'").replace(/\u2019/g, "'");
  cleaned = cleaned.replace(/\u201C/g, '"').replace(/\u201D/g, '"');
  
  // Corriger les chaînes coupées
  cleaned = cleaned.replace(/\+"\n\s+'/gm, "+ '");
  cleaned = cleaned.replace(/\+'\n\s+"/gm, '+ "');
  cleaned = cleaned.replace(/'\n\s*'/gm, "'\\n'");
  
  // Corriger les Decimal tronqués
  cleaned = cleaned.replace(/Decimal\("[^"]*$/gm, 'Decimal("0")');
  
  // Corriger les zéros non significatifs (Python 3 n'autorise pas 0123)
  cleaned = cleaned.replace(/(?<![\w"']|[\d])(\b0+\d+\b)(?!["'\d])/g, (match) => {
    const withoutZeros = match.replace(/^0+/, '') || '0';
    if (withoutZeros.startsWith('o') || withoutZeros.startsWith('O')) {
      return '0' + withoutZeros;
    }
    return withoutZeros;
  });

  // Corriger les lignes fusionnées (def/class au milieu d'une ligne)
  cleaned = cleaned.replace(/([^\n])(def \w+\()/g, '$1\n$2');
  cleaned = cleaned.replace(/([^\n])(class \w+)/g, '$1\n$2');
  cleaned = cleaned.replace(/([^\n])(if |elif |while |for |with |try:)/g, '$1\n$2');
  
  // Corriger les instructions tronquées
  cleaned = cleaned.replace(/^(\s*)global\s*$/gm, '$1pass  # global tronqué');
  cleaned = cleaned.replace(/^(\s*)return\s*$/gm, '$1return None');
  cleaned = cleaned.replace(/^(\s*)yield\s*$/gm, '$1yield None');
  
  // Corriger les lignes 'def' seules
  cleaned = cleaned.replace(/^\s*def\s*$/gm, '');
  
  // Corriger les if/while/for/for/elif/with/try/except manquants de :
  cleaned = cleaned.replace(/^(\s*(?:if|elif|while|for|with|try|except|else|match)\b[^:\n]*)$/gm, '$1:');
  
  // Corriger les docstrings non fermées
  cleaned = cleaned.replace(/^(\s*"""[^"]{0,200})$/gm, '$1"""');
  cleaned = cleaned.replace(/^(\s*'''[^'']{0,200})$/gm, "$1'''");
  
  // Corriger les lignes de logger avec deux-points finaux (simplifié)
  cleaned = cleaned.replace(/^(logger\s*=\s*logging\.getLogger\([^)]*\)):\s*$/gm, '$1');
  
  return cleaned;
}

// ============================================
// CORRECTIONS DE LIGNES INDIVIDUELLES
// ============================================

function fixLineByLine(code: string): string {
  const lines = code.split('\n');
  const fixedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const nextLine = lines[i + 1] || '';
    const lineNum = i + 1;
    
    // Corriger le docstring orphelin après def
    if (line.trim() === '"""' && 
        i > 0 && 
        lines[i - 1].trim().startsWith('def ') && 
        lines[i - 1].trim().endsWith(':')) {
      line = '    """TODO"""';
    }
    
    // Corriger la définition de fonction tronquée
    if (line.match(/^def\s+\w+\s*\([^)]*$/) && !line.includes(':')) {
      const nextTrimmed = nextLine.trim();
      if (!nextTrimmed || nextTrimmed.startsWith('def ') || 
          nextTrimmed.startsWith('class ') || nextTrimmed.startsWith('import ')) {
        line = line.replace(/,\s*$/, '') + ') -> None:';
      }
    }
    
    // Corriger le corps de fonction vide
    if (line.match(/^def\s+\w+.*:\s*$/) && nextLine.trim()) {
      const nextTrimmed = nextLine.trim();
      if (nextTrimmed.startsWith('def ') || 
          nextTrimmed.startsWith('@') || 
          nextTrimmed.startsWith('class ')) {
        fixedLines.push(line);
        fixedLines.push('    pass');
        continue;
      }
    }
    
    // Corriger les blocs de contrôle vides (if/while/for/try/with)
    const controlMatch = line.match(/^(\s*)(?:if|elif|while|for|with|try|except|else|match)\b.*:\s*$/);
    if (controlMatch) {
      const indent = controlMatch[1].length;
      let hasBody = false;
      
      for (let j = i + 1; j < lines.length && j < i + 15; j++) {
        const check = lines[j];
        if (!check.trim() || check.trim().startsWith('#')) continue;
        const checkIndent = (check.match(/^(\s*)/)?.[1] || '').length;
        if (checkIndent > indent) { hasBody = true; break; }
        else break;
      }
      
      if (!hasBody) {
        fixedLines.push(line);
        fixedLines.push(' '.repeat(indent + 4) + 'pass');
        continue;
      }
    }
    
    // Corriger les erreurs de parenthèses non fermées
    if (line.includes('(') && !line.includes(')') && !line.trim().endsWith('\\')) {
      const openParens = (line.match(/\(/g) || []).length;
      const closeParens = (line.match(/\)/g) || []).length;
      if (openParens > closeParens) {
        const missing = openParens - closeParens;
        line = line + ')'.repeat(missing);
      }
    }
    
    // Corriger les erreurs de crochets non fermés
    if (line.includes('[') && !line.includes(']') && !line.trim().endsWith('\\')) {
      const openBrackets = (line.match(/\[/g) || []).length;
      const closeBrackets = (line.match(/\]/g) || []).length;
      if (openBrackets > closeBrackets) {
        const missing = openBrackets - closeBrackets;
        line = line + ']'.repeat(missing);
      }
    }
    
    // Corriger les accolades non fermées
    if (line.includes('{') && !line.includes('}') && !line.trim().endsWith('\\')) {
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      if (openBraces > closeBraces) {
        const missing = openBraces - closeBraces;
        line = line + '}'.repeat(missing);
      }
    }
    
    fixedLines.push(line);
  }
  
  return fixedLines.join('\n');
}

// ============================================
// CORRECTIONS BASÉES SUR LES ERREURS
// ============================================

function fixSpecificError(code: string, error: { msg: string; lineno: number; offset?: number; text?: string }): string {
  const lines = code.split('\n');
  const errorLine = error.lineno - 1; // 0-indexed
  
  if (errorLine < 0 || errorLine >= lines.length) {
    return code; // Ligne d'erreur hors plage
  }
  
  const problemLine = lines[errorLine];
  const errorMsg = error.msg.toLowerCase();
  let fixed = false;
  let newLines = [...lines];
  
  // Erreur: "unterminated string" ou "EOL while scanning string literal"
  if (errorMsg.includes('unterminated') || errorMsg.includes('eol while scanning')) {
    // Trouver la chaîne non fermée et la fermer
    const stringMatch = problemLine.match(/(['"])(?:(?!\1)[^\\]|\\.)*\1(?:(?!\1)[^\\]|\\.)*$/);
    if (stringMatch) {
      const quote = stringMatch[1];
      // Compter les quotes non fermées
      const beforeError = problemLine.substring(0, error.offset || problemLine.length);
      const quoteCount = (beforeError.match(new RegExp(quote, 'g')) || []).length;
      if (quoteCount % 2 === 1) {
        // Quote non fermée, ajouter une autre quote
        newLines[errorLine] = problemLine + quote;
        fixed = true;
      }
    } else {
      // Pas de string match, essayer de fermer à la fin de la ligne
      const lastQuote = Math.max(problemLine.lastIndexOf("'"), problemLine.lastIndexOf('"'));
      if (lastQuote !== -1) {
        const afterLastQuote = problemLine.substring(lastQuote + 1);
        if (afterLastQuote.trim() !== '' && !afterLastQuote.includes("'") && !afterLastQuote.includes('"')) {
          const quote = problemLine[lastQuote];
          newLines[errorLine] = problemLine + quote;
          fixed = true;
        }
      }
    }
  }
  
  // Erreur: "invalid syntax"
  if (errorMsg.includes('invalid syntax')) {
    // Vérifier les problèmes courants
    
    // 1. Opérateur ternaire mal formé
    const ternaryMatch = problemLine.match(/(\w+)\s+(if|else)\s+(\w+)\s*:/);
    if (ternaryMatch) {
      // Corriger: value_if_true if condition else value_if_false
      const parts = problemLine.split(/\s+(?:if|else)\s+/);
      if (parts.length === 3) {
        const corrected = `${parts[1]} if ${parts[0]} else ${parts[2]}`;
        newLines[errorLine] = corrected;
        fixed = true;
      }
    }
    
    // 2. assignation sans valeur
    if (problemLine.includes('=') && !problemLine.includes('==') && 
        problemLine.trim().endsWith('=') && !problemLine.includes('def ')) {
      newLines[errorLine] = problemLine + ' None';
      fixed = true;
    }
    
    // 3. virgule après le dernier élément
    const trailingCommaMatch = problemLine.match(/^[,\s]+/);
    if (trailingCommaMatch && problemLine.includes(',')) {
      newLines[errorLine] = problemLine.replace(/,\s*$/, '');
      fixed = true;
    }
  }
  
  // Erreur: "expected ':'"
  if (errorMsg.includes("expected ':'")) {
    // Ajouter le deux-points manquant
    const trimmed = problemLine.trim();
    if (!trimmed.endsWith(':') && 
        (trimmed.startsWith('if') || trimmed.startsWith('elif') || 
         trimmed.startsWith('while') || trimmed.startsWith('for') || 
         trimmed.startsWith('with') || trimmed.startsWith('try') ||
         trimmed.startsWith('except') || trimmed.startsWith('def') ||
         trimmed.startsWith('class') || trimmed.startsWith('match'))) {
      newLines[errorLine] = problemLine.trim() + ':';
      fixed = true;
    }
  }
  
  // Erreur: "unexpected indent" ou "indentation error"
  if (errorMsg.includes('unexpected indent') || errorMsg.includes('unindent')) {
    // Réduire l'indentation de la ligne
    const indentMatch = problemLine.match(/^(\s*)/);
    if (indentMatch && indentMatch[1].length >= 4) {
      newLines[errorLine] = problemLine.substring(4);
      fixed = true;
    }
  }
  
  // Erreur: "dedent" ou indentation incohérente
  if (errorMsg.includes('dedent') || errorMsg.includes('inconsistent indentation')) {
    // Essayer différentes indentations
    if (errorLine > 0) {
      const prevLine = lines[errorLine - 1];
      const prevIndent = (prevLine.match(/^(\s*)/)?.[1] || '').length;
      const currentIndent = (problemLine.match(/^(\s*)/)?.[1] || '').length;
      
      if (currentIndent > prevIndent) {
        // Réduire à l'indentation précédente
        newLines[errorLine] = ' '.repeat(prevIndent) + problemLine.trim();
        fixed = true;
      }
    }
  }
  
  // Erreur: "non-default argument follows default argument"
  if (errorMsg.includes('non-default argument follows default argument')) {
    // Réorganiser les arguments: les paramètres avec défaut après ceux sans défaut
    const funcMatch = problemLine.match(/(def\s+\w+\([^)]*\)):/);
    if (funcMatch) {
      const fullLine = problemLine;
      const params = fullLine.substring(fullLine.indexOf('(') + 1, fullLine.lastIndexOf(')'));
      const paramList = params.split(',').map(p => p.trim()).filter(p => p);
      
      let foundDefault = false;
      let reordered: string[] = [];
      const withDefaults: string[] = [];
      const withoutDefaults: string[] = [];
      
      for (const param of paramList) {
        if (param.includes('=')) {
          withDefaults.push(param);
          foundDefault = true;
        } else if (!foundDefault) {
          withoutDefaults.push(param);
        } else {
          // Param sans défaut après param avec défaut
          withDefaults.push(param);
        }
      }
      
      reordered = [...withoutDefaults, ...withDefaults];
      const newParams = reordered.join(', ');
      const newLine = fullLine.replace(/\([^)]*\):/, `(${newParams}):`);
      newLines[errorLine] = newLine;
      fixed = true;
    }
  }
  
  // Erreur: "cannot assign to expression"
  if (errorMsg.includes('cannot assign to expression')) {
    // Sûrement une assignation comme x = y = 5 mal formée
    if (problemLine.includes('==') && problemLine.includes('=') && !problemLine.includes('==')) {
      newLines[errorLine] = problemLine.replace(/\s*=\s*/g, ' == ');
      fixed = true;
    }
  }
  
  // Si la correction spécifique n'a pas fonctionné, retourner le code original
  if (!fixed) {
    return code;
  }
  
  return newLines.join('\n');
}

// ============================================
// CORRECTION MULTI-PASS AVEC PYODIDE
// ============================================

async function validateAndFixCode(code: string, maxIterations: number = 20): Promise<{ code: string; success: boolean; iterations: number }> {
  let currentCode = code;
  let iterations = 0;
  
  const pyodide = await getPyodide();
  if (!pyodide) {
    console.log('Pyodide non disponible, utilisation des corrections regex uniquement');
    return { code: applyQuickFixes(code), success: true, iterations: 0 };
  }
  
  while (iterations < maxIterations) {
    iterations++;
    
    // Vérifier la syntaxe
    const checkResult = pyodide.runPython(`check_syntax(${JSON.stringify(currentCode)})`);
    
    if (checkResult === null || checkResult === 'None') {
      // Code valide!
      console.log(`✓ Code valide après ${iterations} itération(s)`);
      return { code: currentCode, success: true, iterations };
    }
    
    // Erreur trouvée, extraire les détails
    const errorInfo = {
      msg: checkResult.get('msg'),
      lineno: checkResult.get('lineno'),
      offset: checkResult.get('offset'),
      text: checkResult.get('text'),
      type: checkResult.get('type')
    };
    
    console.log(`Itération ${iterations}: Erreur ligne ${errorInfo.lineno} - ${errorInfo.msg}`);
    
    // Appliquer la correction spécifique
    const afterSpecificFix = fixSpecificError(currentCode, errorInfo);
    
    if (afterSpecificFix !== currentCode) {
      // Correction spécifique appliquée, continuer
      currentCode = afterSpecificFix;
      continue;
    }
  
    // Si pas de correction spécifique, appliquer les corrections ligne par ligne
    const afterLineFix = fixLineByLine(currentCode);
    
    if (afterLineFix !== currentCode) {
      currentCode = afterLineFix;
      continue;
    }
    
    // Dernière tentative: corrections regex globales
    const afterQuickFix = applyQuickFixes(currentCode);
    
    if (afterQuickFix !== currentCode) {
      currentCode = afterQuickFix;
      continue;
    }
    
    // Aucune correction possible, arrêter
    console.log(`Impossible de corriger l'erreur après ${iterations} tentatives`);
    break;
  }
  
  // Vérification finale
  const finalCheck = pyodide.runPython(`check_syntax(${JSON.stringify(currentCode)})`);
  const isValid = finalCheck === null || finalCheck === 'None';
  
  return { 
    code: currentCode, 
    success: isValid, 
    iterations 
  };
}

// ============================================
// FORMATAGE FINAL
// ============================================

function formatCode(code: string): string {
  // Normalisation basique sans dépendre de Black
  const lines = code.split('\n');
  const formatted: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Ignorer les lignes vides consécutives
    if (trimmed === '' && formatted.length > 0 && formatted[formatted.length - 1].trim() === '') {
      continue;
    }
    
    // Normaliser les espaces autour des opérateurs
    let formattedLine = line;
    formattedLine = formattedLine.replace(/\s*([=+\-*/%<>!&|^])\s*/g, ' $1 ');
    formattedLine = formattedLine.replace(/\s*,\s*/g, ', ');
    
    formatted.push(formattedLine);
  }
  
  // Enlever les espaces de fin
  return formatted.map(l => l.replace(/\s+$/, '')).join('\n');
}

// ============================================
// ROUTE API PRINCIPALE
// ============================================

export async function POST(request: NextRequest) {
  try {
    const { pythonCode, syntaxError, errorLine } = await request.json();

    if (!pythonCode) {
      return NextResponse.json(
        { error: 'pythonCode est requis' },
        { status: 400, headers: corsHeaders }
      );
    }

    const originalLineCount = pythonCode.split('\n').length;
    
    console.log('=== Début correction Code-Doctor v2 ===');
    console.log(`Lignes originales: ${originalLineCount}`);
    if (syntaxError) {
      console.log(`Erreur signalée: "${syntaxError}" à la ligne ${errorLine}`);
    }

    // Étape 1: Corrections regex initiales
    let cleanedCode = applyQuickFixes(pythonCode);
    
    // Étape 2: Corrections ligne par ligne
    cleanedCode = fixLineByLine(cleanedCode);
    
    // Étape 3: Validation et correction itérative avec Pyodide
    const result = await validateAndFixCode(cleanedCode, 20);
    cleanedCode = result.code;
    
    console.log(`✓ Correction terminée: ${result.iterations} itérations, succès: ${result.success}`);
    
    // Étape 4: Formatage final
    cleanedCode = formatCode(cleanedCode);
    
    const cleanedLineCount = cleanedCode.split('\n').length;
    
    // SÉCURITÉ: Si le code corrigé a perdu >15% des lignes, rejeter la correction
    const preservedRatio = cleanedLineCount / originalLineCount;
    if (preservedRatio < 0.85) {
      console.log(`[REJETÉ] Correction réduite de ${originalLineCount} à ${cleanedLineCount} lignes (${Math.round(preservedRatio * 100)}%). Original conservé.`);
      return NextResponse.json({
        cleanedCode: pythonCode,
        stats: {
          originalLines: originalLineCount,
          cleanedLines: originalLineCount,
          preserved: 100,
          hadError: true,
          rejected: true,
          reason: 'Perte de code excessive lors de la correction'
        }
      }, { headers: corsHeaders });
    }

    // Vérification finale avec Pyodide
    const pyodide = await getPyodide();
    let finalValidation = 'unknown';
    if (pyodide) {
      const checkResult = pyodide.runPython(`check_syntax(${JSON.stringify(cleanedCode)})`);
      finalValidation = (checkResult === null || checkResult === 'None') ? 'valid' : 'invalid';
    }

    return NextResponse.json({
      cleanedCode,
      stats: {
        originalLines: originalLineCount,
        cleanedLines: cleanedLineCount,
        preserved: Math.round((cleanedLineCount / originalLineCount) * 100),
        hadError: !!(syntaxError && errorLine),
        iterations: result.iterations,
        success: result.success,
        finalValidation
      }
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Erreur Clean API:', error);
    return NextResponse.json(
      { error: error.message || 'Échec du nettoyage' },
      { status: 500, headers: corsHeaders }
    );
  }
}
