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
    //   system: "You are a summarizer. Summarize content in the same style as if the author wrote the summary. Your summary should be below 100 words. Do not mention the author.",
      system: "You are a summarizer. Summarize content in short, catchy sentences. Your summary should be below 75 words. Do not mention the author. Do not include the title of the article.",
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

function splitIntoThreeParagraphs(text) {
    const sentences = text.split('. ');
    const totalSentences = sentences.length;
    
    // Calculate the approximate number of sentences for each paragraph
    const sentencesPerParagraph = Math.ceil(totalSentences / 3);
    
    // Split the sentences into three parts
    const firstParagraph = sentences.slice(0, sentencesPerParagraph).join('. ') + '.';
    const secondParagraph = sentences.slice(sentencesPerParagraph, 2 * sentencesPerParagraph).join('. ') + '.';
    const thirdParagraph = sentences.slice(2 * sentencesPerParagraph).join('. ');
    
    // Ensure the last paragraph ends with a period if it doesn't already
    const lastParagraph = thirdParagraph.endsWith('.') ? thirdParagraph : thirdParagraph + '.';
    
    return [firstParagraph, secondParagraph, lastParagraph];
  }