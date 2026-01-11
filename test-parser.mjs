import { parseCobolWithANTLR, generateANTLRSummary } from './lib/cobol-antlr-parser.ts';
import { readFileSync } from 'fs';

// Load MEGA-ENTERPRISE.CBL
const cobolSource = readFileSync('./public/MEGA-ENTERPRISE.CBL', 'utf-8');

console.log('=== TESTING PARSER ===');
console.log(`Source file: MEGA-ENTERPRISE.CBL`);
console.log(`Total lines: ${cobolSource.split('\n').length}`);
console.log('');

// Parse
const ast = parseCobolWithANTLR(cobolSource);

console.log('=== PARSING RESULTS ===');
console.log(`Program ID: ${ast.programId}`);
console.log(`Paragraphs detected: ${ast.paragraphs.length}`);
console.log(`Variables detected: ${ast.workingStorageVariables.length}`);
console.log(`Sections detected: ${ast.sections.length}`);
console.log(`PERFORM statements: ${ast.performStatements.length}`);
console.log(`SQL statements: ${ast.sqlStatements.length}`);
console.log(`CALL statements: ${ast.callStatements.length}`);
console.log('');

if (ast.paragraphs.length > 0) {
  console.log('=== FIRST 10 PARAGRAPHS ===');
  ast.paragraphs.slice(0, 10).forEach((p, i) => {
    console.log(`  ${i+1}. ${p.name} (lines ${p.lineStart}-${p.lineEnd})`);
  });
}

if (ast.workingStorageVariables.length > 0) {
  console.log('\n=== FIRST 10 VARIABLES ===');
  ast.workingStorageVariables.slice(0, 10).forEach((v, i) => {
    console.log(`  ${i+1}. ${v.level} ${v.name} ${v.picture || ''}`);
  });
}

console.log('\n=== SUMMARY ===');
console.log(generateANTLRSummary(ast));
