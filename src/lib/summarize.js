import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateSummary(content, deviceType = 'desktop') {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 300,
      temperature: 0,
      system: "You are a summarizer. Summarize content in short, catchy sentences. Your summary should be below 50 words. Do not mention the author. Do not include the title of the article.",
      messages: [{ role: 'user', content }]
    });

    const summary = response.content[0].type === 'text' ? response.content[0].text : '';
    
    if (deviceType === 'mobile') {
      return [summary]; // Return as a single-element array for consistency
    } else {
      return splitIntoTwoParagraphs(summary);
    }
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