#!/usr/bin/env node
/**
 * Test Clean Architecture Transpilation
 */

import { parseCobolWithANTLR } from './lib/cobol-antlr-parser.ts';
import { transpileToCleanArchitecture } from './lib/cobol-transpiler.ts';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';

// Mini COBOL sample with multiple domains
const cobolSample = `
       IDENTIFICATION DIVISION.
       PROGRAM-ID. BANKING-SYSTEM.
       
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  WS-ACCOUNT-ID         PIC X(10).
       01  WS-BALANCE            PIC 9(9)V99 VALUE 0.
       01  WS-INTEREST-RATE      PIC 9(2)V9999 VALUE 0.0225.
       01  WS-TRANSACTION-TYPE   PIC X(1).
           88 TXN-DEPOSIT        VALUE 'D'.
           88 TXN-WITHDRAWAL     VALUE 'W'.
       01  WS-FRAUD-SCORE        PIC 9(3) VALUE 0.
       
       PROCEDURE DIVISION.
       
       0000-MAIN-CONTROL.
           PERFORM 1000-INITIALIZATION
           PERFORM 2000-PROCESS-DEPOSIT
           PERFORM 3000-CALCULATE-INTEREST
           PERFORM 7000-FRAUD-CHECK
           PERFORM 9000-GENERATE-REPORT
           STOP RUN.
       
       1000-INITIALIZATION.
           DISPLAY "INITIALIZING SYSTEM".
           MOVE SPACES TO WS-ACCOUNT-ID.
       
       2000-PROCESS-DEPOSIT.
           DISPLAY "PROCESSING DEPOSIT".
           ADD 100 TO WS-BALANCE.
           PERFORM 2100-VALIDATE-DEPOSIT.
       
       2100-VALIDATE-DEPOSIT.
           IF WS-BALANCE > 0
               DISPLAY "VALID DEPOSIT"
           END-IF.
       
       3000-CALCULATE-INTEREST.
           COMPUTE WS-BALANCE = WS-BALANCE * 
               (1 + WS-INTEREST-RATE).
           DISPLAY "INTEREST APPLIED".
       
       7000-FRAUD-CHECK.
           DISPLAY "CHECKING FRAUD INDICATORS".
           IF WS-BALANCE > 10000
               MOVE 50 TO WS-FRAUD-SCORE
               DISPLAY "HIGH VALUE TRANSACTION"
           END-IF.
       
       9000-GENERATE-REPORT.
           DISPLAY "GENERATING DAILY REPORT".
           DISPLAY "BALANCE: " WS-BALANCE.
`;

async function main() {
  console.log('=== CLEAN ARCHITECTURE TRANSPILER TEST ===\n');
  
  try {
    // Parse COBOL
    console.log('1. Parsing COBOL source...');
    const ast = parseCobolWithANTLR(cobolSample);
    console.log(`   ✓ Parsed ${ast.paragraphs.length} paragraphs`);
    console.log(`   ✓ Found ${ast.workingStorageVariables.length} variables\n`);
    
    // Transpile to Clean Architecture
    console.log('2. Transpiling to Clean Architecture...');
    const result = transpileToCleanArchitecture(ast, cobolSample);
    
    console.log(`   ✓ Domains detected: ${result.stats.domainsDetected}`);
    console.log(`   ✓ Methods transpiled: ${result.stats.methodsTranspiled}`);
    console.log(`   ✓ Services generated: ${result.stats.servicesGenerated}`);
    console.log(`   ✓ Repositories generated: ${result.stats.repositoriesGenerated}\n`);
    
    // Write files
    const outputDir = './clean-output';
    console.log(`3. Writing ${result.files.size} files to ${outputDir}/...`);
    
    for (const [filePath, content] of result.files) {
      const fullPath = join(outputDir, filePath);
      const dir = dirname(fullPath);
      
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      
      writeFileSync(fullPath, content);
      console.log(`   ✓ ${filePath}`);
    }
    
    console.log('\n4. Validating Python syntax...');
    
    // Validate each Python file
    let allValid = true;
    for (const [filePath, content] of result.files) {
      if (filePath.endsWith('.py')) {
        const fullPath = join(outputDir, filePath);
        const { execSync } = await import('child_process');
        try {
          execSync(`python3 -m py_compile "${fullPath}"`, { encoding: 'utf-8' });
          console.log(`   ✓ ${filePath} - valid`);
        } catch (e) {
          console.log(`   ✗ ${filePath} - SYNTAX ERROR`);
          console.log(e.stderr || e.message);
          allValid = false;
        }
      }
    }
    
    console.log('\n=== RESULT ===');
    if (allValid) {
      console.log('✅ All files generated with valid Python syntax!');
      console.log('\nGenerated structure:');
      console.log('clean-output/');
      console.log('├── app/');
      console.log('│   ├── __init__.py');
      console.log('│   └── main.py');
      console.log('├── domain/');
      console.log('│   ├── __init__.py');
      console.log('│   ├── entities.py');
      console.log('│   └── *_service.py');
      console.log('├── infra/');
      console.log('│   ├── __init__.py');
      console.log('│   └── repositories/');
      console.log('│       └── *_repository.py');
      console.log('└── tests/');
      console.log('    └── test_services.py');
    } else {
      console.log('❌ Some files have syntax errors');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
