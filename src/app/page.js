'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchArticle();
  }, []);

  const handleRefresh = () => {
    fetchArticle(true);
  };

  const fetchArticle = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/rss${forceRefresh ? '?refresh=true' : ''}`);
      if (!response.ok) {
        throw new Error('Failed to fetch article');
      }
      const data = await response.json();
      setArticle(data);
    } catch (error) {
      setError('Failed to load article');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!article) return <div>No article available</div>;

  return (
    <div className="container mx-auto p-4">
      <main>
        <h1 className="text-3xl font-bold mb-4">
          <Link href="/">
            Note
          </Link>
        </h1>
        {/* <button 
          onClick={handleRefresh} 
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh
        </button> */}
        <div className="border p-4 rounded-lg">
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
      </main>
      <footer className="mt-8 text-center text-gray-500">
        &copy;Note
      </footer>
    </div>
  );
}