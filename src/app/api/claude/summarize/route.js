import { NextResponse } from 'next/server';
import { generateSummary } from '@/lib/summarize';

const errorResponse = (message, status = 500) => {
  return NextResponse.json({ error: message }, { status });
};

export async function POST(req) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return errorResponse("Anthropic API key not configured");
  }

  try {
    const { content } = await req.json();
    if (!content) {
      return errorResponse("Please enter a valid content", 400);
    }

    const summary = await generateSummary(content);
    return NextResponse.json({ summary });
  } catch (error) {
    console.error(`Error with Anthropic API request: ${error.message}`);
    return errorResponse('An error occurred during your request.');
  }
}