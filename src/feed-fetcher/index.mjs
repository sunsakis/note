import express from 'express';
import { prisma } from '../lib/prisma.js';
import { generateSummary } from '../lib/summarize.js';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { slugify } from '../lib/slugify.js';
import { feeds } from '../lib/feeds.js';

const app = express();
const port = process.env.PORT || 3000;
const CUTOFF_DATE = new Date('2024-12-02');
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
    for (const [category, categoryFeeds] of Object.entries(feeds)) {
      for (const feedUrl of categoryFeeds) {
        const feed = await parser.parseURL(feedUrl);
        
        for (const item of feed.items) {
          const publishedAt = new Date(item.pubDate);
          
          if (publishedAt >= CUTOFF_DATE) {
            console.log('--- New Item ---');
            console.log('Title:', item.title);
            console.log('Link:', item.link);
            console.log('Creator:', item.creator);
            console.log('Published:', publishedAt);
            console.log('Category:', category);
            const existingArticle = await prisma.article.findUnique({
              where: { url: item.link }
            });

            if (!existingArticle) {
              let fullContent = item['content:encoded'] || item.content;
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
                  tags: [...(item.categories ?? []), category],
                  imageUrl: item.enclosure?.url || null,
                  author: author || 'anon',
                  titleSlug: extractSlugFromUrl(item.link),
                }
              });

              console.log(`Author saved in DB: ${newArticle.author}`);

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
    
    for (const [category, categoryFeeds] of Object.entries(feeds)) {
      for (const feedUrl of categoryFeeds) {
        const feed = await parser.parseURL(feedUrl);
        
        for (const item of feed.items) {
          const existingArticle = await prisma.article.findUnique({
            where: { url: item.link }
          });

          if (existingArticle) {
            let fullContent = item['content:encoded'] || item.content;
            if (fullContent) {
              const $ = cheerio.load(fullContent);
              $('.subscription-widget-wrap-editor').remove();
              $('.subscription-widget').remove();
              fullContent = $.html();
            }
            
            if (fullContent && fullContent !== existingArticle.content || item.enclosure?.url !== existingArticle.imageUrl || item.titleSlug == null) {
              let titleSlug = slugify(item.title);
              let author = item.author || item.creator || item['dc:creator'] || item.copyright || existingArticle.author;
              await prisma.article.update({
                where: { id: existingArticle.id },
                data: {
                  content: fullContent,
                  description: item.contentSnippet || item.description,
                  tags: [category],
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
    }
    return updatedArticlesCount;
  } catch (error) {
    console.error('Error refetching and updating articles:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting feed fetch process...');
    const newArticlesCount = await fetchAndUpdateRSSFeeds();
    console.log(`Successfully processed feeds. Added ${newArticlesCount} new articles.`);
    
    console.log('Starting article refresh process...');
    const updatedArticlesCount = await refetchAndUpdateAllArticles();
    console.log(`Successfully refreshed articles. Updated ${updatedArticlesCount} articles.`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error in main process:', error);
    await prisma.$disconnect();
    throw error;
  }
}

// Add basic endpoint for health check
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
  console.log(`Feed fetcher service listening on port ${port}`);
  // Run feed fetch on startup
  main().catch(console.error);
});