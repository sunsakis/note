import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  const { author, titleSlug } = params;

  console.log('API: Received request for author:', author, 'and titleSlug:', titleSlug);

  if (!author || !titleSlug) {
    console.log('API: Missing author or titleSlug');
    return NextResponse.json({ error: 'Author and titleSlug are required' }, { status: 400 });
  }

  try {
    console.log('API: Querying database for article');
    const article = await prisma.article.findFirst({
      where: { 
        author: author,
        titleSlug: titleSlug
      },
      select: {
        title: true,
        content: true,
        url: true,
        publishedAt: true,
        tags: true,
      }
    });

    console.log('API: Database query result:', article);

    if (!article) {
      console.log('API: Article not found');
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Determine the language based on tags
    const language = article.tags.includes('lithuanian') ? 'lithuanian' : 'english';

    // Create a new object with all article properties and the determined language
    const articleWithLanguage = {
      ...article,
      language: language
    };

    console.log('API: Returning article data');
    return NextResponse.json(articleWithLanguage);
  } catch (error) {
    console.error('API: Error fetching article:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}