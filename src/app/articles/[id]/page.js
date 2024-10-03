'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ArticlePage({ params }) {
  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchArticle(params.id);
  }, [params.id]);

  const fetchArticle = async (id) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/articles/${id}`);
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
  if (!article) return <div>Article not found</div>;

  return (
    <div className="container mx-auto p-4">
      <main>
        <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
        <div className="border p-4 rounded-lg">
          <div className="mt-4" dangerouslySetInnerHTML={{ __html: article.content }}></div>
          <Link href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            <p className="mt-2">Original Article</p>
          </Link>
          <p className="text-gray-600 mt-2">{new Date(article.publishedAt).toLocaleString()}</p>
        </div>
        <Link href="/" className="mt-4 inline-block text-blue-500 hover:underline">
          Back to Home
        </Link>
      </main>
    </div>
  );
}