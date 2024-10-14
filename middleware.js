import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import prisma from './lib/prisma';

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Check if the path matches an article route
  const articleMatch = pathname.match(/^\/([^/]+)\/([^/]+)$/);
  if (articleMatch) {
    const [, author, titleSlug] = articleMatch;
    
    // Fetch the article from the database
    const article = await prisma.article.findFirst({
      where: {
        author: author,
        titleSlug: titleSlug
      },
      select: {
        tags: true
      }
    });

    // Check if the article has the 'vc' tag
    if (article && article.tags.includes('vc')) {
      // If not authenticated, redirect to login
      if (!token) {
        return NextResponse.redirect(new URL('/api/auth/signin', req.url));
      }
      // If authenticated but not premium, redirect to subscribe page
      if (!token.isPremium) {
        return NextResponse.redirect(new URL('/subscribe', req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:author/:titleSlug'
};