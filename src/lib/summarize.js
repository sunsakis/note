import Anthropic from '@anthropic-ai/sdk';
import pQueue from 'p-queue';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Create a queue with concurrency of 1 and a delay between tasks
const queue = new pQueue({ concurrency: 1, interval: 1000 });

export async function generateSummary(content) {
  return queue.add(async () => {
    try {
      console.log('Generating summary...', content.substring(0, 100));
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 300,
        temperature: 0,
        system: "Summarize content in short, catchy sentences. Get right into it. Do not translate - use the same language. Your summary should be below 30 words. Do not mention the author. Do not include the title of the article.",
        messages: [{ role: 'user', content }]
      });

      const summary = response.content[0].type === 'text' ? response.content[0].text : '';
      console.log('Summary generated successfully');
      return summary.trim() || null;

    } catch (error) {
      console.error('Error generating summary:', error);
      return null;;
    }
  });
}