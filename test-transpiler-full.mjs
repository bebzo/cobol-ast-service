import { parseCobolWithANTLR } from './lib/cobol-antlr-parser.ts';
import { transpileCobol } from './lib/cobol-transpiler.ts';
import { readFileSync, writeFileSync } from 'fs';

// Load MEGA-ENTERPRISE.CBL
const cobolSource = readFileSync('./public/MEGA-ENTERPRISE.CBL', 'utf-8');

console.log('=== TRANSPILER TEST ===');
console.log(`Source: MEGA-ENTERPRISE.CBL (${cobolSource.split('\n').length} lines)`);

// Parse
const ast = parseCobolWithANTLR(cobolSource);
console.log(`AST: ${ast.paragraphs.length} paragraphs, ${ast.workingStorageVariables.length} vars`);

// Transpile
const result = transpileCobol(ast, cobolSource);

console.log('\n=== STATS ===');
console.log(`Methods transpiled: ${result.stats.methodsTranspiled}`);
console.log(`Statements transpiled: ${result.stats.statementsTranspiled}`);
console.log(`Average confidence: ${result.stats.averageConfidence}%`);
console.log(`Fallback count: ${result.stats.fallbackCount}`);

// Count lines
const pyLines = result.pythonCode.split('\n').length;
console.log(`\n=== OUTPUT ===`);
console.log(`Python lines generated: ${pyLines}`);

// Save output
writeFileSync('./test-output.py', result.pythonCode);
console.log('Saved to test-output.py');

// Show first 50 lines
console.log('\n=== FIRST 50 LINES ===');
console.log(result.pythonCode.split('\n').slice(0, 50).join('\n'));
