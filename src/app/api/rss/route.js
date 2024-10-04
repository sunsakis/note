import { NextResponse } from 'next/server';
import axios from 'axios';
import xml2js from 'xml2js';
import { prisma } from '@/lib/prisma';
import { generateSummary } from '@/lib/summarize';

const ARTICLES_PER_PAGE = 5;

export async function GET(request) {
    try {
      const { searchParams } = new URL(request.url);
      const refresh = searchParams.get('refresh');
      const page = parseInt(searchParams.get('page') || '1', 10);
      const deviceType = searchParams.get('deviceType') || 'desktop';

      const response = await axios.get('https://timdenning.substack.com/feed');
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(response.data);
      const items = result.rss.channel[0].item;
      
      const startIndex = (page - 1) * ARTICLES_PER_PAGE;
      const endIndex = startIndex + ARTICLES_PER_PAGE;
      const pageItems = items.slice(startIndex, endIndex);

      const processedArticles = [];

      for (const item of pageItems) {
        const url = item.link[0];
        
        let article = await prisma.article.findUnique({ where: { url } });
        
        if (!article || refresh === 'true') {
          const summary = await generateSummary(item['content:encoded'][0] || item.description[0], deviceType);

          if (article) {
            article = await prisma.article.update({
              where: { url },
              data: {
                title: item.title[0],
                description: item.description[0],
                content: item['content:encoded'][0] || item.description[0],
                summary,
                publishedAt: new Date(item.pubDate[0]),
              },
            });
          } else {
            article = await prisma.article.create({
              data: {
                url,
                title: item.title[0],
                description: item.description[0],
                content: item['content:encoded'][0] || item.description[0],
                summary,
                publishedAt: new Date(item.pubDate[0]),
              },
            });
          }
        } else {
          // If the article exists and we're not refreshing, adjust the summary based on device type
          if (deviceType === 'mobile') {
            article.summary = article.summary.join(' '); // Combine paragraphs for mobile
          }
        }
        
        processedArticles.push(article);
      }
      
      return NextResponse.json(processedArticles);
    } catch (error) {
      console.error('Error fetching RSS feed:', error);
      return NextResponse.json({ error: error.message || 'Error fetching RSS feed' }, { status: 500 });
    }
  }