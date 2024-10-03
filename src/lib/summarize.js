import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateSummary(content) {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 300,
      temperature: 0,
      system: "You are a summarizer. Summarize content in the same style as if the author wrote the summary. Your summary should be below 100 words. Do not mention the author.",
      messages: [{ role: 'user', content }]
    });

    const summary = response.content[0].type === 'text' ? response.content[0].text : '';
    return splitIntoTwoParagraphs(summary);
  } catch (error) {
    console.error('Error generating summary:', error);
    return ['Error generating summary', 'Please try again later'];
  }
}

function splitIntoTwoParagraphs(text) {
  const sentences = text.split('. ');
  const midpoint = Math.ceil(sentences.length / 2);
  const firstParagraph = sentences.slice(0, midpoint).join('. ') + '.';
  const secondParagraph = sentences.slice(midpoint).join('. ');
  return [firstParagraph, secondParagraph];
}