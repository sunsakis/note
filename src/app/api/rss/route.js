import { NextResponse } from 'next/server';
import axios from 'axios';
import xml2js from 'xml2js';
import { prisma } from '@/lib/prisma';
import { generateSummary } from '@/lib/summarize';

const ARTICLES_PER_PAGE = 5;

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const refresh = searchParams.get('refresh') === 'true';
        const page = parseInt(searchParams.get('page') || '1', 10);
        const timestamp = Date.now();

        console.log('Fetching RSS feed...');
        const response = await axios.get(`https://timdenning.substack.com/feed?t=${timestamp}`);
        console.log('RSS feed fetched successfully');

        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(response.data);
        const items = result.rss.channel[0].item;
        
        console.log(`Processing ${items.length} articles`);

        const processArticle = async (item) => {
            const url = item.link[0];
            
            try {
                let article = await prisma.article.findUnique({ where: { url } });
                
                if (!article || refresh) {
                    console.log(`Generating summary for article: ${url}`);
                    const summary = await generateSummary(item['content:encoded'][0] || item.description[0]);

                    const articleData = {
                        url,
                        title: item.title[0],
                        description: item.description[0],
                        content: item['content:encoded'][0] || item.description[0],
                        summary,
                        publishedAt: new Date(item.pubDate[0]),
                    };

                    if (article) {
                        article = await prisma.article.update({
                            where: { url },
                            data: articleData,
                        });
                    } else {
                        article = await prisma.article.create({
                            data: articleData,
                        });
                    }
                    console.log(`Article processed: ${url}`);
                }
                return article;
            } catch (dbError) {
                console.error(`Error processing article ${url}:`, dbError);
                return null;
            }
        };

        // Process articles in batches
        const batchSize = 5;
        const processedArticles = [];
        for (let i = 0; i < items.length; i += batchSize) {
            console.log(`Processing batch ${i/batchSize + 1}`);
            const batch = items.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch.map(processArticle));
            processedArticles.push(...batchResults);
        }

        const validArticles = processedArticles.filter(article => article !== null);
        
        validArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        
        const startIndex = (page - 1) * ARTICLES_PER_PAGE;
        const endIndex = startIndex + ARTICLES_PER_PAGE;
        const paginatedArticles = validArticles.slice(startIndex, endIndex);
        
        console.log(`Returning ${paginatedArticles.length} articles`);
        return NextResponse.json(paginatedArticles);
    } catch (error) {
        console.error('Error in GET function:', error);
        return NextResponse.json({ error: error.message || 'Error fetching RSS feed' }, { status: 500 });
    }
}