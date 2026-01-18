import fs from 'fs';

const demoCode = fs.readFileSync('public/MEGA-ENTERPRISE.CBL', 'utf8');
console.log('Testing SSE with', demoCode.split('\n').length, 'lines of COBOL');

const res = await fetch('http://localhost:3000/api/analyse-sse', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ cobolCode: demoCode, filename: 'demo.cob' })
});

const reader = res.body.getReader();
const decoder = new TextDecoder();
let buffer = '';
let completeBuffer = '';
let isAccumulating = false;

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';
  
  for (const line of lines) {
    // v8.8: When accumulating, add non-prefixed lines (JSON continuation)
    if (isAccumulating && line.trim() !== '' && 
        !line.startsWith('event:') && !line.startsWith('data:')) {
      completeBuffer += line;
      try {
        const data = JSON.parse(completeBuffer);
        console.log('\n\nSUCCESS (continuation)!');
        console.log('Python code length:', (data.python_code || '').length, 'chars');
        console.log('Python lines:', (data.python_code || '').split('\n').length);
        process.exit(0);
      } catch {}
      continue;
    }
    
    if (line.startsWith('event: complete')) {
      isAccumulating = true;
      completeBuffer = '';
      console.log('\n[Event: complete received]');
    }
    
    if (line.startsWith('data: ') && isAccumulating) {
      completeBuffer += line.slice(6);
      try {
        const data = JSON.parse(completeBuffer);
        console.log('\n\nSUCCESS (data line)!');
        console.log('Python code length:', (data.python_code || '').length, 'chars');
        console.log('Python lines:', (data.python_code || '').split('\n').length);
        process.exit(0);
      } catch {}
    }
    
    // Progress display
    if (line.includes('"percent"')) {
      const match = line.match(/"percent"\s*:\s*(\d+)/);
      if (match) process.stdout.write('\rProgress: ' + match[1] + '%');
    }
  }
}

// Final parse with remaining buffer
console.log('\n\n[Stream ended, parsing remaining data]');
if (buffer.trim()) {
  completeBuffer += buffer;
}

if (completeBuffer) {
  try {
    const data = JSON.parse(completeBuffer);
    console.log('FINAL SUCCESS!');
    console.log('Python code length:', (data.python_code || '').length, 'chars');
    console.log('Python lines:', (data.python_code || '').split('\n').length);
  } catch (e) {
    console.log('Failed to parse final buffer');
    console.log('Buffer size:', completeBuffer.length);
    console.log('First 500 chars:', completeBuffer.substring(0, 500));
    console.log('Last 500 chars:', completeBuffer.substring(completeBuffer.length - 500));
  }
} else {
  console.log('No complete buffer to parse');
}
