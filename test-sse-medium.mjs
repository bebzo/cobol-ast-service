import { chromium } from 'playwright';

async function testSSE() {
  console.log('🎭 Playwright SSE Test - Medium file (1000 lines)');
  
  // Generate 1000 line valid COBOL
  const lines = [];
  lines.push('       IDENTIFICATION DIVISION.');
  lines.push('       PROGRAM-ID. MEDIUM1K.');
  lines.push('       DATA DIVISION.');
  lines.push('       WORKING-STORAGE SECTION.');
  for (let i = 0; i < 400; i++) {
    lines.push(`       01 WS-VAR-${i} PIC 9(7)V99 VALUE ${i}.00.`);
  }
  lines.push('       PROCEDURE DIVISION.');
  lines.push('       0000-MAIN.');
  for (let i = 0; i < 590; i++) {
    lines.push(`           ADD 1 TO WS-VAR-${i % 400}.`);
  }
  lines.push('           STOP RUN.');
  const cobolCode = lines.join('\n');
  
  console.log(`📝 COBOL: ${cobolCode.length} chars, ${lines.length} lines`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  const apiContext = await context.request;
  const response = await apiContext.post('http://localhost:3000/api/analyse-sse', {
    data: { cobolCode, filename: 'MEDIUM-1K.cbl', copybooks: {} },
    headers: { 'Content-Type': 'application/json' },
    timeout: 180000
  });
  
  console.log(`📡 Status: ${response.status()}`);
  const body = await response.text();
  console.log(`📦 Response: ${body.length} chars`);
  
  // Parse SSE v8.8
  let data = null;
  let completeDataBuffer = '';
  let isAccumulatingComplete = false;
  
  for (const line of body.split('\n')) {
    if (isAccumulatingComplete && !line.startsWith('event: ') && !line.startsWith('data: ') && line.trim() !== '') {
      completeDataBuffer += line;
      try { data = JSON.parse(completeDataBuffer); isAccumulatingComplete = false; } catch (e) {}
      continue;
    }
    if (line.startsWith('event: complete')) {
      isAccumulatingComplete = true;
      completeDataBuffer = '';
    }
    if (line.startsWith('data: ') && isAccumulatingComplete) {
      completeDataBuffer += line.slice(6);
      try { data = JSON.parse(completeDataBuffer); isAccumulatingComplete = false; } catch (e) {}
    }
  }
  
  if (!data && completeDataBuffer) {
    try { data = JSON.parse(completeDataBuffer); } catch (e) {}
  }
  
  await browser.close();
  
  if (data?.python_code) {
    const pyLines = data.python_code.split('\n').length;
    console.log(`\n✅ SUCCESS!`);
    console.log(`   Python: ${data.python_code.length} chars (${pyLines} lines)`);
    console.log(`   Ratio: COBOL ${lines.length} → Python ${pyLines}`);
  } else {
    console.log('\n❌ FAILED');
    process.exit(1);
  }
}

testSSE().catch(e => { console.error(e); process.exit(1); });
