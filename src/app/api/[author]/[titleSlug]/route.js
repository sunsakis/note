import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  console.log('API Route hit. Params:', params);
  const { titleSlug } = params;

  console.log('API: Received request for titleSlug:', titleSlug);

  if (!titleSlug) {
    console.log('API: Missing titleSlug');
    return NextResponse.json({ error: 'titleSlug is required' }, { status: 400 });
  }

  try {
    console.log('API: Querying database for article');
    const article = await prisma.article.findFirst({
      where: { 
        AND: [
          { titleSlug: titleSlug }
        ]
      },
    });

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