import { NextRequest, NextResponse } from 'next/server';

interface CobolModule {
  name: string;
  startLine: number;
  endLine: number;
  lines: string[];
  paragraphs: string[];
}

function splitBySection(cobolCode: string): CobolModule[] {
  const lines = cobolCode.split('\n');
  const modules: CobolModule[] = [];
  let currentModule: CobolModule | null = null;
  let currentParagraphs: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim().toUpperCase();
    
    if (trimmed.match(/^[A-Z0-9-]+\s+SECTION\s*\.?\s*$/)) {
      if (currentModule) {
        currentModule.endLine = i - 1;
        currentModule.paragraphs = [...currentParagraphs];
        modules.push(currentModule);
      }
      
      const sectionName = trimmed.replace(/\s+SECTION.*/, '');
      currentModule = {
        name: sectionName.toLowerCase().replace(/-/g, '_'),
        startLine: i,
        endLine: i,
        lines: [],
        paragraphs: []
      };
      currentParagraphs = [];
    }
    
    if (trimmed.match(/^[A-Z0-9-]+\s*\.\s*$/) && !trimmed.includes('SECTION')) {
      currentParagraphs.push(trimmed.replace(/\s*\.\s*$/, ''));
    }
    
    if (currentModule) {
      currentModule.lines.push(line);
    }
  }
  
  if (currentModule) {
    currentModule.endLine = lines.length - 1;
    currentModule.paragraphs = [...currentParagraphs];
    modules.push(currentModule);
  }
  
  return modules;
}

export async function POST(req: NextRequest) {
  try {
    const { cobolCode } = await req.json();
    
    if (!cobolCode) {
      return NextResponse.json({ error: 'No COBOL code' }, { status: 400 });
    }
    
    const modules = splitBySection(cobolCode);
    
    return NextResponse.json({
      success: true,
      moduleCount: modules.length,
      modules: modules.map(m => ({
        name: m.name,
        lineCount: m.lines.length,
        paragraphCount: m.paragraphs.length,
        code: m.lines.join('\n')
      }))
    });
    
  } catch (error) {
    return NextResponse.json({ error: 'Split failed' }, { status: 500 });
  }
}
