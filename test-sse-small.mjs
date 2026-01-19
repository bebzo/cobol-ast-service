import { chromium } from 'playwright';

async function testSSE() {
  console.log('🎭 Playwright SSE Test - Small file first');
  
  // Small but valid COBOL
  const cobolCode = `       IDENTIFICATION DIVISION.
       PROGRAM-ID. TESTPROG.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-AMOUNT PIC 9(5)V99 VALUE 100.00.
       01 WS-RATE PIC V99 VALUE .15.
       01 WS-RESULT PIC 9(7)V99.
       PROCEDURE DIVISION.
       0000-MAIN.
           COMPUTE WS-RESULT = WS-AMOUNT * WS-RATE.
           DISPLAY "Result: " WS-RESULT.
           STOP RUN.`;
  
  console.log(`📝 COBOL: ${cobolCode.split('\n').length} lines`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  const apiContext = await context.request;
  const response = await apiContext.post('http://localhost:3000/api/analyse-sse', {
    data: { cobolCode, filename: 'TEST.cbl', copybooks: {} },
    headers: { 'Content-Type': 'application/json' },
    timeout: 120000
  });
  
  console.log(`📡 Status: ${response.status()}`);
  const body = await response.text();
  console.log(`📦 Response: ${body.length} chars`);
  
  // Parse SSE v8.8 style
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
    console.log(`\n✅ SUCCESS! Python: ${data.python_code.length} chars`);
    console.log(`   Lines: ${data.python_code.split('\n').length}`);
    console.log(`   First 200 chars:\n${data.python_code.substring(0, 200)}...`);
  } else {
    console.log('\n❌ FAILED: No Python code');
    console.log('Response excerpt:', body.substring(0, 500));
    process.exit(1);
  }
}

testSSE().catch(e => { console.error(e); process.exit(1); });
