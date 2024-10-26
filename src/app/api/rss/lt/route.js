import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSummary } from '@/lib/summarize';

const CUTOFF_DATE = new Date('2020-09-01');
const ARTICLES_PER_PAGE = 10;

export async function GET(request) {
  try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = ARTICLES_PER_PAGE;

    // Count total articles with the 'lithuanian' tag
    const totalArticles = await prisma.article.count({
        where: {
        tags: {
            has: 'lithuanian'
        },
        publishedAt: {
            gte: CUTOFF_DATE
        }
        }
    });
    
    // Load articles with the 'lithuanian' tag
    const articles = await prisma.article.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
        publishedAt: 'desc'
        },
        where: {
        tags: {
            has: 'lithuanian'
        },
        publishedAt: {
            gte: CUTOFF_DATE
        }
        }
    });

      const hasMore = totalArticles > page * pageSize;

      console.log(`Page ${page}: Returning ${articles.length} articles. Total articles: ${totalArticles}. Has more: ${hasMore}`);
      return NextResponse.json({
          articles,
          hasMore,
          totalArticles
      });
  } catch (error) {
      console.error('Error in GET function:', error);
      return NextResponse.json({ error: error.message || 'Error fetching articles' }, { status: 500 });
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