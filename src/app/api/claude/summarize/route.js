import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const errorResponse = (message, status = 500) => {
  return NextResponse.json({ error: message }, { status });
};

function splitIntoTwoParagraphs(text) {
    const sentences = text.split('. ');
    const midpoint = Math.ceil(sentences.length / 2);
    const firstParagraph = sentences.slice(0, midpoint).join('. ') + '.';
    const secondParagraph = sentences.slice(midpoint).join('. ');
    return [firstParagraph, secondParagraph];
  }

export async function POST(req) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return errorResponse("Anthropic API key not configured");
  }

  try {
    const { content } = await req.json();
    if (!content) {
      return errorResponse("Please enter a valid content", 400);
    }

    const { content: responseContent } = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 300,
      temperature: 0,
      system: "You are a summarizer. Summarize content in the same style as if the author wrote the summary. Your summary should be below 100 words. Do not mention the author.",
      messages: [{ role: 'user', content }]
    });

    const summary = responseContent[0].type === 'text' ? responseContent[0].text : '';

    // Split the summary into two paragraphs
    const formattedSummary = splitIntoTwoParagraphs(summary);


     return NextResponse.json({ summary: formattedSummary });
  } catch (error) {
    console.error(`Error with Anthropic API request: ${error.message}`);
    return errorResponse('An error occurred during your request.');
  }
}