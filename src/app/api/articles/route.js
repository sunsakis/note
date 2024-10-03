import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { publishedAt: 'desc' },
      select: { id: true, title: true, publishedAt: true },
    });
    return new Response(JSON.stringify(articles), { status: 200 });
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch articles' }), { status: 500 });
  }
}