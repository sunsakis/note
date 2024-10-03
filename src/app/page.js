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
      
      // Summarize only the first article
      if (data.length > 0) {
        const firstArticleWithSummary = await fetchSummary(data[0]);
        setArticles([firstArticleWithSummary, ...data.slice(1)]);
      } else {
        setArticles(data);
      }
    } catch (error) {
      console.error('Detailed error fetching RSS feed:', error);
      setError(error.message || 'Failed to load articles');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchSummary = async (article) => {
    try {
      // Use the content from the RSS feed
      const fullContent = article['content:encoded'] ? article['content:encoded'][0] : article.description[0];
  
      // Send the full content for summarization
      const response = await fetch('/api/claude/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: fullContent }),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch summary');
      }
      const data = await response.json();
      return { ...article, summary: data.summary };
    } catch (error) {
      console.error('Error fetching summary:', error);
      return article;
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <main>
        <h1 className="text-3xl font-bold mb-4">Note | Smart News Bot</h1>
        <div className="space-y-4">
          {articles.map((article, index) => (
            <div key={index} className="border p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">
                {article.title[0]}
              </h2>
              <p className="text-gray-600">
                {article.pubDate[0]}
              </p>
              <a href={article.link[0]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                <div className="mt-2" dangerouslySetInnerHTML={{ __html: article.description[0] }} />
              </a>
              {article.summary && (
                <div className="mt-4">
                  {article.summary.map((paragraph, i) => (
                    <p key={i} className="mt-2">{paragraph}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
      <footer className="mt-8 text-center text-gray-500">
        &copy; 2023 Note | Smart News Bot
      </footer>
    </div>
  );
}