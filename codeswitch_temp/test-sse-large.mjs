import { chromium } from 'playwright';

async function testSSE() {
  console.log('🎭 Playwright SSE Test - Large file (3000 lines)');
  
  // Generate 3000 line COBOL (should produce ~800KB+ response)
  const lines = [];
  lines.push('       IDENTIFICATION DIVISION.');
  lines.push('       PROGRAM-ID. LARGE3K.');
  lines.push('       DATA DIVISION.');
  lines.push('       WORKING-STORAGE SECTION.');
  for (let i = 0; i < 1200; i++) {
    lines.push(`       01 WS-AMOUNT-${i} PIC S9(7)V99 COMP-3 VALUE ${i}.00.`);
  }
  lines.push('       PROCEDURE DIVISION.');
  lines.push('       0000-MAIN.');
  for (let i = 0; i < 1790; i++) {
    lines.push(`           COMPUTE WS-AMOUNT-${i % 1200} = WS-AMOUNT-${i % 1200} * 1.05.`);
  }
  lines.push('           STOP RUN.');
  const cobolCode = lines.join('\n');
  
  console.log(`📝 COBOL: ${cobolCode.length} chars, ${lines.length} lines`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  console.log('📡 Calling SSE endpoint (this may take ~60s)...');
  const startTime = Date.now();
  
  const apiContext = await context.request;
  const response = await apiContext.post('http://localhost:3000/api/analyse-sse', {
    data: { cobolCode, filename: 'LARGE-3K.cbl', copybooks: {} },
    headers: { 'Content-Type': 'application/json' },
    timeout: 300000
  });
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`📡 Status: ${response.status()} (${elapsed}s)`);
  const body = await response.text();
  console.log(`📦 Response: ${body.length} chars (${(body.length/1024).toFixed(0)}KB)`);
  
  // Parse SSE v8.8 - handle continuation lines
  let data = null;
  let completeDataBuffer = '';
  let isAccumulatingComplete = false;
  
  for (const line of body.split('\n')) {
    // v8.8: continuation lines (not starting with event: or data:)
    if (isAccumulatingComplete && !line.startsWith('event: ') && !line.startsWith('data: ') && line.trim() !== '') {
      completeDataBuffer += line;
      try { 
        data = JSON.parse(completeDataBuffer); 
        isAccumulatingComplete = false; 
        console.log('✓ Parsed via continuation');
      } catch (e) {}
      continue;
    }
    if (line.startsWith('event: complete')) {
      isAccumulatingComplete = true;
      completeDataBuffer = '';
    }
    if (line.startsWith('data: ') && isAccumulatingComplete) {
      completeDataBuffer += line.slice(6);
      try { 
        data = JSON.parse(completeDataBuffer); 
        isAccumulatingComplete = false;
        console.log('✓ Parsed via data line');
      } catch (e) {}
    }
  }
  
  if (!data && completeDataBuffer) {
    try { 
      data = JSON.parse(completeDataBuffer); 
      console.log('✓ Parsed via final buffer');
    } catch (e) {
      console.log('❌ Parse failed, buffer length:', completeDataBuffer.length);
    }
  }
  
  await browser.close();
  
  if (data?.python_code) {
    const pyLen = data.python_code.length;
    const pyLines = data.python_code.split('\n').length;
    console.log(`\n✅ TEST PASSED!`);
    console.log(`   Python: ${pyLen} chars (${(pyLen/1024).toFixed(0)}KB) - ${pyLines} lines`);
    console.log(`   Ratio: COBOL ${lines.length} → Python ${pyLines} (${(pyLines/lines.length).toFixed(1)}x)`);
    
    if (pyLen > 100000) {
      console.log(`\n🎉 Large payload (${(pyLen/1024).toFixed(0)}KB) handled correctly!`);
    }
  } else {
    console.log('\n❌ TEST FAILED: No Python code parsed');
    process.exit(1);
  }
}

testSSE().catch(e => { console.error(e); process.exit(1); });
