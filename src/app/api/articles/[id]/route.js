import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const article = await prisma.article.findUnique({
      where: { id: parseInt(params.id) },
    });
    if (!article) {
      return new Response(JSON.stringify({ error: 'Article not found' }), { status: 404 });
    }
    return new Response(JSON.stringify(article), { status: 200 });
  } catch (error) {
    console.error('Failed to fetch article:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch article' }), { status: 500 });
  }
}