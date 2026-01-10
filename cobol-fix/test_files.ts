import { postProcessPythonCode } from './lib/postprocess';
import { execSync } from 'child_process';
import * as fs from 'fs';

const files = ['mega_v74.py', 'v74_final.py'];

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log(`${file}: not found`);
    continue;
  }
  
  const code = fs.readFileSync(file, 'utf-8');
  const fixed = postProcessPythonCode(code, 'TEST');
  
  const fixedFile = `/tmp/fixed_${file}`;
  fs.writeFileSync(fixedFile, fixed);
  
  try {
    execSync(`python3 -m py_compile ${fixedFile}`, { encoding: 'utf-8' });
    console.log(`✓ ${file}: Syntax valid after post-processing`);
  } catch (e: any) {
    console.log(`✗ ${file}: Still has errors`);
    console.log(e.stderr || e.stdout || e.message);
  }
}
