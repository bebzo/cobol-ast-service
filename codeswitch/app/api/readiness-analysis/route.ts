import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    const scriptPath = `${process.cwd()}/lib/production_readiness_analyzer.py`;
    
    const { stdout, stderr } = await execAsync(`python3 "${scriptPath}" --json`, {
      timeout: 60000, // 60 second timeout
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    if (stderr && !stdout) {
      console.error('Python script error:', stderr);
      return NextResponse.json(
        { error: 'Analysis execution failed', details: stderr },
        { status: 500 }
      );
    }

    const result = JSON.parse(stdout);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API error:', error);
    
    if (error.code === 'ETIMEDOUT') {
      return NextResponse.json(
        { error: 'Analysis timed out after 60 seconds' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to execute readiness analysis', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, targetPath } = body;

    if (!code && !targetPath) {
      return NextResponse.json(
        { error: 'Either code or targetPath is required' },
        { status: 400 }
      );
    }

    const scriptPath = `${process.cwd()}/lib/production_readiness_analyzer.py`;
    
    // Write temporary file if code is provided
    let tempFilePath = '';
    if (code) {
      tempFilePath = `/tmp/readiness_analysis_${Date.now()}.py`;
      const fs = await import('fs');
      fs.writeFileSync(tempFilePath, code);
    }

    const target = targetPath || tempFilePath;
    const { stdout, stderr } = await execAsync(`python3 "${scriptPath}" --target "${target}" --json`, {
      timeout: 120000, // 120 second timeout for file analysis
      maxBuffer: 20 * 1024 * 1024 // 20MB buffer
    });

    // Clean up temp file
    if (tempFilePath) {
      const fs = await import('fs');
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }

    if (stderr && !stdout) {
      console.error('Python script error:', stderr);
      return NextResponse.json(
        { error: 'Analysis execution failed', details: stderr },
        { status: 500 }
      );
    }

    const result = JSON.parse(stdout);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API error:', error);
    
    if (error.code === 'ETIMEDOUT') {
      return NextResponse.json(
        { error: 'Analysis timed out after 120 seconds' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to execute readiness analysis', details: error.message },
      { status: 500 }
    );
  }
}
