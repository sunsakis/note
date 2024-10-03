import { NextResponse } from 'next/server';
import axios from 'axios';
import xml2js from 'xml2js';
import { prisma } from '@/lib/prisma';
import { generateSummary } from '@/lib/summarize';

export async function GET(request) {
    try {
      const { searchParams } = new URL(request.url);
      const refresh = searchParams.get('refresh');

      const response = await axios.get('https://timdenning.substack.com/feed');
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(response.data);
      const items = result.rss.channel[0].item;
      
      // Only process the first item
      const item = items[0];
      const url = item.link[0];
      
      let article = await prisma.article.findUnique({ where: { url } });
      
      if (!article || refresh === 'true') {
        const summary = await generateSummary(item['content:encoded'][0] || item.description[0]);

        if (article) {
          // Update existing article
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
          // Create new article
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
      }
      
      return NextResponse.json(article);
    } catch (error) {
      console.error('Error fetching RSS feed:', error);
      return NextResponse.json({ error: 'Error fetching RSS feed' }, { status: 500 });
    }
  }