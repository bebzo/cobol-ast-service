import { cobolToPython } from './cobol-parser.js';
import fs from 'fs';
const cobolCode = fs.readFileSync('/workspace/codeswitch-hackathon/public/PAYROLL01.CBL', 'utf-8');
const { pythonCode, stats } = cobolToPython(cobolCode);
console.log('COBOL:', stats.cobolLines, '| Python:', stats.pythonLines, '| Ratio:', ((stats.pythonLines / stats.cobolLines) * 100).toFixed(1) + '%');
console.log('Variables:', stats.variables, '| Procedures:', stats.procedures);
