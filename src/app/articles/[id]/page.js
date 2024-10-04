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

  const processContent = (content) => {
    // Add extra breaks between paragraphs
    let processedContent = content.replace(/<\/p>\s*<p>/g, '</p><br><p>');
    
    // Adjust header sizes
    processedContent = processedContent.replace(/<h1>(.*?)<\/h1>/g, '<h1 class="text-4xl font-bold my-4">$1</h1>');
    processedContent = processedContent.replace(/<h2>(.*?)<\/h2>/g, '<h2 class="text-3xl font-semibold my-3">$1</h2>');
    processedContent = processedContent.replace(/<h3>(.*?)<\/h3>/g, '<h3 class="text-2xl font-medium my-2">$1</h3>');
    processedContent = processedContent.replace(/<h4>(.*?)<\/h4>/g, '<h4 class="text-xl font-medium my-2">$1</h4>');
    processedContent = processedContent.replace(/<h5>(.*?)<\/h5>/g, '<h5 class="text-lg font-medium my-1">$1</h5>');
    processedContent = processedContent.replace(/<h6>(.*?)<\/h6>/g, '<h6 class="text-base font-medium my-1">$1</h6>');
    
    return processedContent;
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!article) return <div>Article not found</div>;

  return (
    <div className="container mx-auto p-4">
      <main>
        <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
        <div className="border p-4 rounded-lg">
          <div className="mt-4" dangerouslySetInnerHTML={{ __html: processContent(article.content) }}></div>
          <Link href={article.url} target="_blank" rel="noopener noreferrer nofollow" className="text-blue-500 hover:underline">
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