'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [articles, setArticles] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchArticles();
  }, []);
  
  const handleRefresh = () => {
    fetchArticles(true);
  };

  const fetchArticles = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/rss${forceRefresh ? '?refresh=true' : ''}`);
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }
      const data = await response.json();
      console.log('Fetched data:', data); // Add this line
      if (Array.isArray(data)) {
        setArticles(data);
      } else if (typeof data === 'object' && data !== null) {
        setArticles([data]); // If it's a single object, wrap it in an array
      } else {
        throw new Error('Unexpected data format');
      }
    } catch (error) {
      setError('Failed to load articles');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!articles) return <div>No article available</div>;

  return (
    <div className="container mx-auto p-4">
      <main>
        <h1 className="text-3xl font-bold mb-4">
          <Link href="/">
            Note
          </Link>
        </h1>
        {Array.isArray(articles) ? (
          articles.map((article) => (
            <div key={article.id} className="border p-4 rounded-lg mb-4">
              <h2 className="text-xl font-semibold mb-2">
                {article.title}
              </h2>
              <div className="mt-4">
                {article.summary.map((paragraph, i) => (
                  <p key={i} className="mt-2">{paragraph}</p>
                ))}
              </div>
              <Link href={`/articles/${article.id}`} className="text-blue-500 hover:underline">
                <p className="mt-2">{article.description}</p>
              </Link>
              <p className="text-gray-600 mt-2">{new Date(article.publishedAt).toLocaleString()}</p>
            </div>
          ))
        ) : (
          <div className="border p-4 rounded-lg mb-4">
            <h2 className="text-xl font-semibold mb-2">
              {articles.title}
            </h2>
            <div className="mt-4">
              {articles.summary.map((paragraph, i) => (
                <p key={i} className="mt-2">{paragraph}</p>
              ))}
            </div>
            <Link href={`/articles/${articles.id}`} className="text-blue-500 hover:underline">
              <p className="mt-2">{articles.description}</p>
            </Link>
            <p className="text-gray-600 mt-2">{new Date(articles.publishedAt).toLocaleString()}</p>
          </div>
        )}
      </main>
      <footer className="mt-8 text-center text-gray-500">
        &copy;Note
      </footer>
    </div>
  );
}