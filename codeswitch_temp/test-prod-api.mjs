import { chromium } from 'playwright';

async function testProdAPI() {
  console.log('🔍 Test Production API - SSE endpoint');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  // Small test COBOL
  const cobolCode = `       IDENTIFICATION DIVISION.
       PROGRAM-ID. TESTPROD.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-AMOUNT PIC 9(5)V99 VALUE 100.00.
       PROCEDURE DIVISION.
       0000-MAIN.
           DISPLAY "Amount: " WS-AMOUNT.
           STOP RUN.`;
  
  console.log(`📝 COBOL: ${cobolCode.split('\n').length} lines`);
  
  try {
    const response = await context.request.post('https://cobol-ast-service.vercel.app/api/analyse-sse', {
      data: { cobolCode, filename: 'TEST.cbl', copybooks: {} },
      headers: { 'Content-Type': 'application/json' },
      timeout: 120000
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
    if (!data && completeDataBuffer) try { data = JSON.parse(completeDataBuffer); } catch (e) {}
    
    if (data?.python_code) {
      const pyLines = data.python_code.split('\n').length;
      console.log(`\n✅ API OK!`);
      console.log(`   Python: ${data.python_code.length} chars (${pyLines} lines)`);
      console.log(`   python_lines field: ${data.python_lines || 'NOT SET'}`);
      console.log(`   cobol_lines field: ${data.cobol_lines || 'NOT SET'}`);
    } else {
      console.log('\n❌ No Python code in response');
      console.log('Response preview:', body.substring(0, 500));
    }
    
  } catch (e) {
    console.log('❌ API Error:', e.message);
  }
  
  await browser.close();
}

testProdAPI();
