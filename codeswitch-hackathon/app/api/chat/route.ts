import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const { query, cobolCode, pythonCode } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a COBOL migration expert assistant. Answer concisely (2-3 sentences max).

Context:
- COBOL snippet: ${cobolCode || 'Not provided'}
- Python snippet: ${pythonCode || 'Not provided'}

User question: ${query}

Answer:`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    return NextResponse.json({ response }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('[Chat Error]', error);
    return NextResponse.json(
      { response: "Sorry, I couldn't process your request." },
      { status: 500, headers: corsHeaders }
    );
  }
}
// trigger rebuild Tue Dec 30 17:27:45 CST 2025
