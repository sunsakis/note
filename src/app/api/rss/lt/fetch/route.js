import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSummary } from '@/lib/summarize';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';

const FEED_URLS = [
    'https://vartotojogidas.substack.com/feed',
    'https://emilijaviso.substack.com/feed',
    'https://gustestulpin.substack.com/feed',
    'https://domasraibys.substack.com/feed',
    'https://malonumui.substack.com/feed',
    'https://laurinavicius.substack.com/feed',
  ];

const CUTOFF_DATE = new Date('2024-10-07');
const parser = new Parser();

function extractSlugFromUrl(url) {
  const parts = url.split('/');
  let slug = parts[parts.length - 1];
  // Remove trailing alphanumeric characters after a hyphen
  return slug.replace(/-[a-zA-Z0-9]+$/, '');
}

async function fetchAndUpdateRSSFeeds() {
  try {
    let newArticlesCount = 0;
    let slugMap = new Map();

    for (const feedUrl of FEED_URLS) {
      const feed = await parser.parseURL(feedUrl);
      
      for (const item of feed.items) {
        const publishedAt = new Date(item.pubDate);
        const slug = extractSlugFromUrl(item.link);

        if (publishedAt >= CUTOFF_DATE) {
          if (publishedAt >= CUTOFF_DATE) {
            console.log('--- New Item ---');
            console.log('Title:', item.title);
            console.log('Link:', item.link);
            console.log('Creator:', item.creator);
            console.log('Published:', publishedAt);
          if (slugMap.has(slug)) {
            // If we've seen this slug before, compare dates
            const existingItem = slugMap.get(slug);
            if (publishedAt > new Date(existingItem.pubDate)) {
              // If the current item is newer, replace the existing one
              slugMap.set(slug, item);
            }
          } else {
            // If we haven't seen this slug before, add it to the map
            slugMap.set(slug, item);
          }
        }
      }
    }

    // Now process the unique items
    for (const [slug, item] of slugMap) {
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
            publishedAt: new Date(item.pubDate),
            tags: [...(item.categories ?? []), 'lithuanian'],
            imageUrl: item.enclosure?.url || null,
            author: author,
            titleSlug: extractSlugFromUrl(item.link),
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
    
    return newArticlesCount;
  } catch (error) {
    console.error('Error updating RSS feeds:', error);
    throw error;
  }
}

      async function refetchAndUpdateAllArticles() {
        try {
          let updatedArticlesCount = 0;
          let slugMap = new Map();
          
          for (const feedUrl of FEED_URLS) {
            const feed = await parser.parseURL(feedUrl);
            
            for (const item of feed.items) {
              const slug = extractSlugFromUrl(item.link);
              const publishedAt = new Date(item.pubDate);
      
              if (slugMap.has(slug)) {
                const existingItem = slugMap.get(slug);
                if (publishedAt > new Date(existingItem.pubDate)) {
                  slugMap.set(slug, item);
                }
              } else {
                slugMap.set(slug, item);
              }
            }
          }
      
          for (const [slug, item] of slugMap) {
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
                let author = item.author || item.creator || item['dc:creator'] || item.copyright || existingArticle.author;
              await prisma.article.update({
                where: { id: existingArticle.id },
                data: {
                  content: fullContent,
                  description: item.contentSnippet || item.description,
                  tags: ['lithuanian'],
                  imageUrl: item.enclosure?.url || null,
                  author: author,
                  titleSlug: extractSlugFromUrl(item.link),
                }
              });
              updatedArticlesCount++;
              const updatedArticle = await prisma.article.findUnique({ where: { id: existingArticle.id } });
                console.log('Updated author:', updatedArticle.author);
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