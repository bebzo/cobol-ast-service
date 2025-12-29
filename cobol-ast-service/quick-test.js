import { cobolToPython } from './cobol-parser.js';
import fs from 'fs';

const cobolCode = fs.readFileSync('./test.cbl', 'utf-8');
const { pythonCode, stats } = cobolToPython(cobolCode);

console.log('COBOL:', stats.cobolLines, 'Python:', stats.pythonLines);
console.log('Ratio:', ((stats.pythonLines / stats.cobolLines) * 100).toFixed(1) + '%');
console.log('\n--- Python (first 50 lines) ---');
console.log(pythonCode.split('\n').slice(0, 50).join('\n'));
