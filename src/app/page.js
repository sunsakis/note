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

  const fetchArticle = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/rss');
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
        <h1 className="text-3xl font-bold mb-4">Note | Smart News Bot</h1>
        <div className="border p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">
              {article.title}
          </h2>
          <div className="mt-4">
            {article.summary.map((paragraph, i) => (
              <p key={i} className="mt-2">{paragraph}</p>
            ))}
          </div>
          <Link href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            <p className="mt-2">{article.description}</p>
          </Link>
          <p className="text-gray-600 mt-2">{new Date(article.publishedAt).toLocaleString()}</p>
        </div>
      </main>
      <footer className="mt-8 text-center text-gray-500">
        &copy; 2023 Note | Smart News Bot
      </footer>
    </div>
  );
}