import { cobolToPython } from './cobol-parser.js';
import fs from 'fs';

const cobolCode = fs.readFileSync('/workspace/codeswitch-hackathon/public/ENTERPRISE-BANKING.CBL', 'utf-8');

console.log('Processing ENTERPRISE-BANKING.CBL...');
console.log('COBOL lines:', cobolCode.split('\n').length);

const start = Date.now();
const { pythonCode, stats } = cobolToPython(cobolCode);
console.log('Time:', Date.now() - start, 'ms');
console.log('Python lines:', stats.pythonLines);
console.log('Ratio:', ((stats.pythonLines / stats.cobolLines) * 100).toFixed(1) + '%');
console.log('Variables:', stats.variables);
console.log('Procedures:', stats.procedures);
