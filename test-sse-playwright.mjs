import { chromium } from 'playwright';
import fs from 'fs';

async function testSSE() {
  console.log('🎭 Playwright SSE Test v8.8');
  
  // Load real demo COBOL file
  let cobolCode;
  const demoPath = 'public/demo-10k.cbl';
  if (fs.existsSync(demoPath)) {
    cobolCode = fs.readFileSync(demoPath, 'utf8');
    console.log(`📁 Loaded ${demoPath}`);
  } else {
    // Generate valid COBOL structure
    const lines = [];
    lines.push('       IDENTIFICATION DIVISION.');
    lines.push('       PROGRAM-ID. TEST10K.');
    lines.push('       DATA DIVISION.');
    lines.push('       WORKING-STORAGE SECTION.');
    for (let i = 0; i < 5000; i++) {
      lines.push(`       01 WS-VAR-${i} PIC 9(5) VALUE ${i}.`);
    }
    lines.push('       PROCEDURE DIVISION.');
    lines.push('       0000-MAIN.');
    for (let i = 0; i < 4990; i++) {
      lines.push(`           ADD 1 TO WS-VAR-${i}.`);
    }
    lines.push('           STOP RUN.');
    cobolCode = lines.join('\n');
    console.log('📝 Generated valid COBOL structure');
  }
  
  console.log(`📝 COBOL code: ${cobolCode.length} chars, ${cobolCode.split('\n').length} lines`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('🌐 Loading localhost:3000...');
  try {
    await page.goto('http://localhost:3000/', { timeout: 10000 });
  } catch (e) {}
  
  console.log('📡 Calling SSE endpoint...');
  
  const apiContext = await context.request;
  const response = await apiContext.post('http://localhost:3000/api/analyse-sse', {
    data: { cobolCode, filename: 'DEMO-10K.cbl', copybooks: {} },
    headers: { 'Content-Type': 'application/json' },
    timeout: 300000
  });
  
  console.log(`📡 Response status: ${response.status()}`);
  
  const body = await response.text();
  console.log(`📦 Response size: ${body.length} chars`);
  
  // Parse SSE - v8.8 logic
  let data = null;
  let completeDataBuffer = '';
  let isAccumulatingComplete = false;
  const lines = body.split('\n');
  
  let currentEventType = '';
  for (const line of lines) {
    if (isAccumulatingComplete && !line.startsWith('event: ') && !line.startsWith('data: ') && line.trim() !== '') {
      completeDataBuffer += line;
      try {
        data = JSON.parse(completeDataBuffer);
        isAccumulatingComplete = false;
        console.log(`✓ Parsed complete (continuation): ${(data.python_code||'').length} chars`);
      } catch (e) {}
      continue;
    }
    
    if (line.startsWith('event: ')) {
      currentEventType = line.slice(7).trim();
      if (currentEventType === 'complete') {
        isAccumulatingComplete = true;
        completeDataBuffer = '';
      }
      continue;
    }
    
    if (line.startsWith('data: ')) {
      const dataContent = line.slice(6);
      if (isAccumulatingComplete || currentEventType === 'complete') {
        completeDataBuffer += dataContent;
        try {
          data = JSON.parse(completeDataBuffer);
          isAccumulatingComplete = false;
          console.log(`✓ Parsed complete: ${(data.python_code||'').length} chars`);
        } catch (e) {}
      }
    }
  }
  
  if (!data && completeDataBuffer) {
    try { 
      data = JSON.parse(completeDataBuffer); 
      console.log(`✓ Final parse: ${(data.python_code||'').length} chars`);
    } catch (e) {
      console.log('❌ Final parse failed');
    }
  }
  
  await browser.close();
  
  if (!data) {
    console.log('\n❌ Test FAILED: No data parsed');
    console.log('Last 1000 chars:', body.substring(body.length - 1000));
    process.exit(1);
  }
  
  const pythonCode = data.python_code || '';
  const pythonLines = pythonCode.split('\n').length;
  
  console.log('\n📊 Results:');
  console.log(`   📦 Python code: ${pythonCode.length} chars (${pythonLines} lines)`);
  console.log(`   📝 Summary: ${data.summary ? data.summary.substring(0, 80) + '...' : 'No'}`);
  
  if (pythonCode.length < 50000) {
    console.log('\n⚠️ Warning: Python code smaller than expected for 10K COBOL');
  }
  
  if (pythonCode.length > 0 && pythonLines > 100) {
    console.log('\n✅ Test PASSED! SSE v8.8 works correctly.');
  } else {
    console.log('\n❌ Test FAILED: Insufficient Python output');
    process.exit(1);
  }
}

testSSE().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
