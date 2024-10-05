'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';

function decodeHTMLEntities(text) {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
}

function parseSummary(summary) {
  if (!summary) return null;
  try {
    return JSON.parse(summary);
  } catch (error) {
    console.error('Error parsing summary:', error);
    return summary; // Return the original string if parsing fails
  }
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const handleSubscribe = async (articleId) => {
    const stripe = await stripePromise;
    try {
      const response = await fetch('/api/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ articleId }),
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      const result = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });
      
      if (result.error) {
        console.error(result.error.message);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchArticles = useCallback(async (pageNumber, forceRefresh = false) => {
    try {
      setIsLoading(true);
      if (forceRefresh) {
        setArticles([]);
        setPage(1);
      }
      const response = await fetch(`/api/rss?page=${pageNumber}${forceRefresh ? '&refresh=true' : ''}`);
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }
      const data = await response.json();
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setArticles(prevArticles => {
          const newArticles = data.filter(newArticle => 
            !prevArticles.some(existingArticle => existingArticle.id === newArticle.id)
          );
          const updatedArticles = [...prevArticles, ...newArticles];
          // Sort articles by publishedAt date in descending order (newest first)
          updatedArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
          return updatedArticles;
        });
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
  }, [fetchArticles]);

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
          <div key={`${article.id}-${index}`} className="border p-4 rounded-lg mb-4 flex">
            {article.imageUrl && (
              <div className="mr-4">
                <img src={article.imageUrl} alt={article.title} className="w-24 h-24 object-cover rounded" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold mb-2">
                {article.title}
              </h2>
              <div className="mt-4">
                <p className="mt-2">{article.summary}</p>
              </div>
              <Link href={`/articles/${article.id}`} className="text-blue-500 hover:underline">
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