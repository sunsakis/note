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
    });

    console.log('API: Database query result:', article);

    if (!article) {
      console.log('API: Article not found');
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    console.log('API: Returning article data');
    return NextResponse.json(article);
  } catch (error) {
    console.error('API: Error fetching article:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}