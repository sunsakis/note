import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSummary } from '@/lib/summarize';
import Parser from 'rss-parser';
import { slugify } from '@/lib/slugify';
import * as cheerio from 'cheerio';

const FEED_URLS = [
    'https://vartotojogidas.substack.com/feed',
    'https://emilijaviso.substack.com/feed',
    'https://gustestulpin.substack.com/feed',
    'https://domasraibys.substack.com/feed',
    'https://malonumui.substack.com/feed',
  ];

const CUTOFF_DATE = new Date('2024-10-07');
const parser = new Parser();

async function fetchAndUpdateRSSFeeds() {
    try {
      let newArticlesCount = 0;
      for (const feedUrl of FEED_URLS) {
        const feed = await parser.parseURL(feedUrl);
        
        for (const item of feed.items) {
          const publishedAt = new Date(item.pubDate);
          console.log('--- New Item ---');
          console.log('Title:', item.title);
          console.log('Link:', item.link);
          console.log('Author:', item.author);
          console.log('Creator:', item.creator);
          console.log('DC:Creator:', item['dc:creator']);
          console.log('Copyright:', item.copyright);
          console.log('Raw item:', JSON.stringify(item, null, 2));
          
          if (publishedAt >= CUTOFF_DATE) {
            const existingArticle = await prisma.article.findUnique({
              where: { url: item.link }
            });
  
            if (!existingArticle) {
              // Determine the full content
              let fullContent = item['content:encoded'] || item.content;
              // Remove subscription widget
                if (fullContent) {
                    const $ = cheerio.load(fullContent);
                    $('.subscription-widget-wrap-editor').remove();
                    $('.subscription-widget').remove();
                    fullContent = $.html();
                }

              let author = item.author || item.creator || item['dc:creator'] || item.copyright || null;
              console.log('Extracted author:', author);
              
              
              const newArticle = await prisma.article.create({
                data: {
                  url: item.link,
                  title: item.title,
                  description: item.contentSnippet || item.description,
                  content: fullContent,
                  publishedAt: publishedAt,
                  tags: [...(item.categories ?? []), 'lithuanian'],
                  imageUrl: item.enclosure?.url || null,
                  author: author,
                  titleSlug: slugify(item.title),
                }
              });

              console.log(`Author saved in DB: ${newArticle.author}`);
  
              // Generate summary for the new article
              const summary = await generateSummary(fullContent);
              await prisma.article.update({
                where: { id: newArticle.id },
                data: { summary }
              });
  
              newArticlesCount++;
            }
          }
        }
      }
      return newArticlesCount;
    } catch (error) {
      console.error('Error updating RSS feeds:', error);
      throw error;
    }
}

async function refetchAndUpdateAllArticles() {
    try {
      let updatedArticlesCount = 0;
      
      for (const feedUrl of FEED_URLS) {
        const feed = await parser.parseURL(feedUrl);
        
        for (const item of feed.items) {
          const existingArticle = await prisma.article.findUnique({
            where: { url: item.link }
          });
  
          if (existingArticle) {
            // Determine the full content
            let fullContent = item['content:encoded'] || item.content;
            // Remove subscription widget
            if (fullContent) {
                const $ = cheerio.load(fullContent);
                $('.subscription-widget-wrap-editor').remove();
                $('.subscription-widget').remove();
                fullContent = $.html();
            }
            
            if (fullContent && item.tags == 'lithuanian' && fullContent !== existingArticle.content || item.enclosure?.url !== existingArticle.imageUrl || item.titleSlug == null) {
                let titleSlug = slugify(item.title);
                let author = item.author || item.creator || item['dc:creator'] || item.copyright || existingArticle.author;
              await prisma.article.update({
                where: { id: existingArticle.id },
                data: {
                  content: fullContent,
                  description: item.contentSnippet || item.description,
                  tags: ['lithuanian'],
                  imageUrl: item.enclosure?.url || null,
                  author: author,
                  titleSlug: titleSlug,
                }
              });
              updatedArticlesCount++;
              const updatedArticle = await prisma.article.findUnique({ where: { id: existingArticle.id } });
                console.log('Updated author:', updatedArticle.author);
            }
          }
        }
      }
      return updatedArticlesCount;
    } catch (error) {
      console.error('Error refetching and updating articles:', error);
      throw error;
    }
}

export async function GET(request) {
  try {
    const newArticlesCount = await fetchAndUpdateRSSFeeds();
    return NextResponse.json({ 
      message: `RSS feeds update completed. Added ${newArticlesCount} new articles published on or after ${CUTOFF_DATE.toISOString()}.` 
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Error updating RSS feeds' }, { status: 500 });
  }
}

export async function PATCH(request) {
    try {
      const updatedArticlesCount = await refetchAndUpdateAllArticles();
      return NextResponse.json({ 
        message: `Articles update completed. Updated content for ${updatedArticlesCount} articles.` 
      });
    } catch (error) {
      return NextResponse.json({ error: error.message || 'Error updating articles' }, { status: 500 });
    }
  }