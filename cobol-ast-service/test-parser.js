import { cobolToPython } from './cobol-parser.js';
import fs from 'fs';

// Load COBOL file
const cobolCode = fs.readFileSync('/workspace/codeswitch-hackathon/public/PAYROLL01.CBL', 'utf-8');

console.log('Testing COBOL Parser...\n');

const { pythonCode, stats } = cobolToPython(cobolCode);

console.log('=== STATS ===');
console.log(`COBOL lines: ${stats.cobolLines}`);
console.log(`Python lines: ${stats.pythonLines}`);
console.log(`Ratio: ${((stats.pythonLines / stats.cobolLines) * 100).toFixed(1)}%`);
console.log(`Variables: ${stats.variables}`);
console.log(`Procedures: ${stats.procedures}`);

console.log('\n=== PYTHON CODE (first 100 lines) ===');
console.log(pythonCode.split('\n').slice(0, 100).join('\n'));
