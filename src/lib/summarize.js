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
      console.log('Generating initial summary...', content.substring(0, 100));
      
      // Step 1: Generate initial summary with Claude-3-haiku
      const initialResponse = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 300,
        temperature: 0,
        system: "Summarize the content concisely. Use the same language as the original. Do not mention the author. Do not include the title of the article.",
        messages: [{ role: 'user', content }]
      });

      const initialSummary = initialResponse.content[0].type === 'text' ? initialResponse.content[0].text : '';
      console.log('Initial summary generated successfully');

      // Step 2: Refine summary with a more advanced model (e.g., Claude-3-opus)
      console.log('Refining summary...');
      const refinedResponse = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 50,
        temperature: 0,
        system: "Refine and condense the given summary in short, catchy sentences. Ensure the final summary is not longer than 25 words. Use the same language as the original. Do not mention the author or include the title.",
        messages: [{ role: 'user', content: initialSummary }]
      });

      const refinedSummary = refinedResponse.content[0].type === 'text' ? refinedResponse.content[0].text : '';
      console.log('Summary refined successfully');

      return refinedSummary.trim() || null;

    } catch (error) {
      console.error('Error generating summary:', error);
      return null;
    }
  });
}