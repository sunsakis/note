'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { slugify } from '@/lib/slugify';
import Image from 'next/image';

function decodeHTMLEntities(text) {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
}

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();

  const lastArticleElementRef = useCallback(node => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore]);

  const fetchArticles = useCallback(async (pageNumber) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/rss/lt?page=${pageNumber}&tag=lithuanian`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { articles: newArticles, hasMore: moreArticles, totalArticles } = await response.json();
      console.log(`Received ${newArticles.length} articles. Total: ${totalArticles}. Has more: ${moreArticles}`);
      
      setArticles(prevArticles => {
        const combinedArticles = [...prevArticles, ...newArticles];
        const uniqueArticles = Array.from(new Set(combinedArticles.map(a => a.id)))
          .map(id => combinedArticles.find(a => a.id === id))
          .filter(article => article.tags && article.tags.includes('lithuanian'));
        uniqueArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        return uniqueArticles;
      });
      setHasMore(moreArticles);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setError('Failed to load articles. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles(page);
  }, [page, fetchArticles]);

  if (error) return <div>Error: {error}</div>;

  return (
        <div className="container mx-auto p-4">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold m-1 mb-2 mt-0">
            <Link href="/">
                Note
            </Link>
            </h1>
            <Link href="/lietuviskai">
            <Image src="lithuania_flag.svg" alt="Lietuvos herbas" width={25} height={25} className="m-1 mt-0"/>
            </Link>
        </div>
        <main>
        {articles.map((article, index) => (
          <div 
            key={`${article.id}-${index}`} 
            className="border p-4 rounded-lg mb-4 flex"
            ref={index === articles.length - 1 ? lastArticleElementRef : null}
          >
              {article.imageUrl && (
                <div className="float-left sm:float-none mb-2 sm:mb-0 mr-4 w-24 h-28 flex-shrink-0 relative">
                  <Image
                    src={article.imageUrl}
                    alt={article.description}
                    fill
                    sizes="(max-width: 640px) 100vw, 128px"
                    className="object-cover rounded"
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAJzAN1hP4xpwAAAABJRU5ErkJggg=="
                  />
                </div>
              )}
            <div className="overflow-hidden">
              <h2 className="text-xl font-semibold mb-2">
                {article.title}
              </h2>
              <div className="mt-4">
                <p className="mt-2">{article.summary}</p>
              </div>
              <Link href={`/${slugify(article.author)}/${article.titleSlug}`} className="text-blue-500 hover:underline">
                <p className="mt-2">{decodeHTMLEntities(article.description)}</p>
              </Link>
              <p className="text-gray-600 mt-2">{new Date(article.publishedAt).toLocaleString()}</p>
            </div>
          </div>
        ))}
        {isLoading && <div>Loading more articles...</div>}
        {!hasMore && <div>No more articles to load.</div>}
      </main>
      <footer className="mt-8 text-center text-gray-500">
        Note
      </footer>
    </div>
  );
}