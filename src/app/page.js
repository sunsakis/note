'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRssFeed();
  }, []);

  const fetchRssFeed = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/rss');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}. ${errorText}`);
      }
      const data = await response.json();
      setArticles(data);
    } catch (error) {
      console.error('Detailed error fetching RSS feed:', error);
      setError(error.message || 'Failed to load articles');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <main>
        <h1 className="text-3xl font-bold mb-4">Substack RSS Reader</h1>
        <div className="space-y-4">
          {articles.map((article, index) => (
            <div key={index} className="border p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">
                <a href={article.link[0]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {article.title[0]}
                </a>
              </h2>
              <p className="text-gray-600">{article.pubDate[0]}</p>
              <p className="mt-2">{article.description[0]}</p>
            </div>
          ))}
        </div>
      </main>
      <footer className="mt-8 text-center text-gray-500">
        &copy; 2023 Substack RSS Reader
      </footer>
    </div>
  );
}