'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchArticles = useCallback(async (pageNumber, forceRefresh = false) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/rss?page=${pageNumber}${forceRefresh ? '&refresh=true' : ''}`);
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }
      const data = await response.json();
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setArticles(prevArticles => [...prevArticles, ...data]);
        setPage(prevPage => prevPage + 1);
      }
    } catch (error) {
      setError('Failed to load articles');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles(page);
  }, []);

  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop === document.documentElement.offsetHeight &&
      !isLoading &&
      hasMore
    ) {
      fetchArticles(page);
    }
  }, [fetchArticles, page, isLoading, hasMore]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <main>
        <h1 className="text-3xl font-bold mb-4">
          <Link href="/">
            Note
          </Link>
        </h1>
        {articles.map((article, index) => (
          <div key={`${article.id}-${index}`} className="border p-4 rounded-lg mb-4">
            <h2 className="text-xl font-semibold mb-2">
              {article.title}
            </h2>
            <div className="mt-4">
              {article.summary.map((paragraph, i) => (
                <p key={`${article.id}-${index}-${i}`} className="mt-2">{paragraph}</p>
              ))}
            </div>
            <Link href={`/articles/${article.id}`} className="text-blue-500 hover:underline">
              <p className="mt-2">{article.description}</p>
            </Link>
            <p className="text-gray-600 mt-2">{new Date(article.publishedAt).toLocaleString()}</p>
          </div>
        ))}
        {isLoading && <div>Loading more articles...</div>}
        {!hasMore && <div>No more articles to load.</div>}
      </main>
      <footer className="mt-8 text-center text-gray-500">
        &copy;Note
      </footer>
    </div>
  );
}