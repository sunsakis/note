import { NextResponse } from 'next/server';
import axios from 'axios';
import xml2js from 'xml2js';
import { prisma } from '@/lib/prisma';
import { generateSummary } from '@/lib/summarize';

const ARTICLES_PER_PAGE = 10;

const FEED_URLS = [
  'https://timdenning.substack.com/feed',
  'https://niallharbison.substack.com/feed',
  'https://ravenewworld.substack.com/feed',
  'https://newsletter.pragmaticengineer.com/feed',
  'https://www.noahpinion.blog/feed',
];

const CUTOFF_DATE = new Date('2024-10-04');

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const timestamp = Date.now();

        console.log('Fetching RSS feeds...');
        const feedResponses = await Promise.all(
            FEED_URLS.map(url => axios.get(`${url}?t=${timestamp}`))
        );
        console.log('RSS feeds fetched successfully');

        const parser = new xml2js.Parser();
        let allItems = [];

        for (let i = 0; i < feedResponses.length; i++) {
            const result = await parser.parseStringPromise(feedResponses[i].data);
            const items = result.rss.channel[0].item;
            allItems = allItems.concat(items.map(item => ({ ...item, sourceUrl: FEED_URLS[i] })));
        }
        
        allItems.sort((a, b) => new Date(b.pubDate[0]) - new Date(a.pubDate[0]));
        
        const startIndex = (page - 1) * ARTICLES_PER_PAGE;
        const endIndex = startIndex + ARTICLES_PER_PAGE;
        const pageItems = allItems.slice(startIndex, endIndex);

        const processArticle = async (item) => {
          const url = item.link[0];
          const publishedAt = new Date(item.pubDate[0]);
          
          try {
            let article = await prisma.article.findUnique({ where: { url } });
            
            if (!article && publishedAt >= CUTOFF_DATE) {
              const content = item['content:encoded'][0] || item.description[0];
              const summary = await generateSummary(content);
              const imageUrl = item['media:content'] ? item['media:content'][0]['$'].url : null;
              
              const articleData = {
                url,
                title: item.title[0],
                description: item.description[0],
                content,
                publishedAt: new Date(item.pubDate[0]),
                summary,
                imageUrl,
              };

              article = await prisma.article.create({
                data: articleData,
              });
              console.log(`Article processed and summary generated: ${url}`);
            } else if (article && !article.summary && publishedAt >= CUTOFF_DATE) {
              // Generate summary for existing articles without one
              const summary = await generateSummary(article.content);
              article = await prisma.article.update({
                where: { url },
                data: { summary },
              });
              console.log(`Summary generated for existing article: ${url}`);
            } else if (publishedAt < CUTOFF_DATE) {
              console.log(`Skipping article published before cutoff date: ${url}`);
            } else {
              console.log(`Article already exists with summary: ${url}`);
            }
            return article;
          } catch (dbError) {
            console.error(`Error processing article ${url}:`, dbError);
            return null;
          }
        };

        const processedArticles = await Promise.all(pageItems.map(processArticle));
        const validArticles = processedArticles.filter(article => article !== null);
        
        console.log(`Returning ${validArticles.length} articles`);
        return NextResponse.json(validArticles);
    } catch (error) {
        console.error('Error in GET function:', error);
        return NextResponse.json({ error: error.message || 'Error fetching RSS feed' }, { status: 500 });
    }
}

export async function POST(request) {
  try {
      const { urls } = await request.json();
      
      const generateMissingSummaries = async (url) => {
          const article = await prisma.article.findUnique({ where: { url } });
          if (article && !article.summary) {
              console.log(`Generating missing summary for article: ${url}`);
              const summary = await generateSummary(article.content);
              return prisma.article.update({
                  where: { url },
                  data: { summary },
              });
          }
          return article;
      };

      const updatedArticles = await Promise.all(urls.map(generateMissingSummaries));
      
      return NextResponse.json(updatedArticles);
  } catch (error) {
      console.error('Error in POST function:', error);
      return NextResponse.json({ error: error.message || 'Error generating summaries' }, { status: 500 });
  }
}