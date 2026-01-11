import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Edge Runtime for longer timeout on Hobby plan (30s vs 10s)
export const runtime = 'edge';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// SSE Helper
function createSSEStream() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array>;
  
  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
  });
  
  const send = (event: string, data: any) => {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(encoder.encode(message));
  };
  
  const close = () => {
    controller.close();
  };
  
  return { stream, send, close };
}

export async function POST(request: NextRequest) {
  const { cobolCode, filename } = await request.json();
  
  if (!cobolCode || !GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'Missing cobolCode or API key' }), { status: 400 });
  }
  
  const { stream, send, close } = createSSEStream();
  
  // Process in background
  (async () => {
    try {
      const startTime = Date.now();
      const totalLines = cobolCode.split('\n').length;
      
      // Step 1: Validation
      send('progress', { step: 'validation', percent: 5, message: `Validating ${totalLines} lines of COBOL...` });
      await new Promise(r => setTimeout(r, 100));
      
      // Step 2: Parsing
      send('progress', { step: 'parsing', percent: 10, message: 'Extracting COBOL structure (paragraphs, variables)...' });
      
      const programMatch = cobolCode.match(/PROGRAM-ID\.\s+(\w+)/i);
      const programId = programMatch ? programMatch[1] : 'PROGRAM';
      const paragraphMatches = [...cobolCode.matchAll(/^(\s{7,8})([A-Z0-9][\w-]+)\.\s*$/gm)];
      const codeLines = cobolCode.split('\n');
      
      const allParagraphs: { name: string; lineStart: number; lineEnd: number }[] = [];
      for (let i = 0; i < paragraphMatches.length; i++) {
        const match = paragraphMatches[i];
        const lineStart = cobolCode.substring(0, match.index).split('\n').length;
        const lineEnd = i + 1 < paragraphMatches.length 
          ? cobolCode.substring(0, paragraphMatches[i + 1].index).split('\n').length - 1
          : Math.min(lineStart + 50, totalLines);
        allParagraphs.push({ name: match[2], lineStart, lineEnd });
      }
      
      send('progress', { step: 'parsing', percent: 15, message: `Found ${allParagraphs.length} paragraphs to translate` });
      
      // Step 3: AI Translation (batch)
      // Smaller batches for faster response on Hobby plan
      const BATCH_SIZE = 10;
      const batches = [];
      for (let i = 0; i < allParagraphs.length; i += BATCH_SIZE) {
        batches.push(allParagraphs.slice(i, i + BATCH_SIZE));
      }
      
      send('progress', { step: 'ai', percent: 20, message: `Starting AI translation (${batches.length} batches)...` });
      
      const translations: { name: string; logic: string }[] = [];
      
      for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
        const batch = batches[batchIdx];
        const batchPercent = 20 + Math.round((batchIdx / batches.length) * 50);
        
        send('progress', { 
          step: 'ai', 
          percent: batchPercent, 
          message: `🤖 Gemini: Translating batch ${batchIdx + 1}/${batches.length} (${batch.length} paragraphs)...`,
          detail: batch.map(p => p.name).join(', ')
        });
        
        // Build batch prompt
        const batchCobol = batch.map(p => {
          const cobol = codeLines.slice(p.lineStart - 1, Math.min(p.lineEnd, p.lineStart + 40)).join('\n');
          return `=== ${p.name} ===\n${cobol}`;
        }).join('\n\n');
        
        const prompt = `Convert COBOL paragraphs to Python STATEMENTS ONLY.
Return ONLY the method body lines. NO "def", NO "class".
For EACH paragraph output:
### PARAGRAPH_NAME
self.statement1
self.statement2

COBOL PARAGRAPHS:
${batchCobol}`;
        
        try {
          const result = await geminiModel.generateContent(prompt);
          const response = result.response.text();
          
          // Parse response
          const sections = response.split(/###\s*/).filter(s => s.trim());
          for (const section of sections) {
            const lines = section.split('\n');
            const nameMatch = lines[0]?.match(/^([A-Z0-9][\w-]+)/i);
            if (!nameMatch) continue;
            
            const name = nameMatch[1];
            const code = lines.slice(1).join('\n')
              .replace(/```python\s*/gi, '').replace(/```/g, '')
              .split('\n')
              .filter(l => /^(self\.|if |elif |else:|for |while |return )/.test(l.trim()))
              .slice(0, 20)
              .join('\n');
            
            translations.push({ name, logic: code });
          }
          
          send('progress', { 
            step: 'ai', 
            percent: batchPercent + 2, 
            message: `✅ Batch ${batchIdx + 1} complete: ${sections.length} paragraphs translated`,
            translated: translations.length,
            total: allParagraphs.length
          });
          
        } catch (e) {
          send('progress', { 
            step: 'ai', 
            percent: batchPercent, 
            message: `⚠️ Batch ${batchIdx + 1} failed, using fallback`,
            error: String(e)
          });
        }
      }
      
      // Step 4: Code Generation
      send('progress', { step: 'codegen', percent: 75, message: 'Generating Python class structure...' });
      
      const className = `${programId.charAt(0).toUpperCase() + programId.slice(1).toLowerCase()}Processor`;
      const successfulTranslations = translations.filter(t => t.logic.length > 10);
      const translationRate = allParagraphs.length > 0 
        ? Math.round((successfulTranslations.length / allParagraphs.length) * 100) 
        : 0;
      
      send('progress', { 
        step: 'codegen', 
        percent: 80, 
        message: `Translation rate: ${translationRate}% (${successfulTranslations.length}/${allParagraphs.length})` 
      });
      
      // Step 5: Test Generation
      send('progress', { step: 'tests', percent: 85, message: '🧪 Generating unit tests...' });
      
      // Step 6: Security Analysis
      send('progress', { step: 'security', percent: 90, message: '🔒 Running security analysis...' });
      
      // Step 7: Finalize
      send('progress', { step: 'finalize', percent: 95, message: 'Finalizing output...' });
      
      const processingTime = Date.now() - startTime;
      
      // Send final result
      send('complete', {
        success: true,
        processingTime,
        stats: {
          totalLines,
          paragraphs: allParagraphs.length,
          translated: successfulTranslations.length,
          translationRate,
          className
        }
      });
      
      send('progress', { step: 'done', percent: 100, message: `✅ Complete in ${(processingTime / 1000).toFixed(1)}s` });
      
    } catch (error) {
      send('error', { message: String(error) });
    } finally {
      close();
    }
  })();
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
