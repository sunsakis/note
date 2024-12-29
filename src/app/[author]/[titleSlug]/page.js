'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/app/components/header';
import { useSession } from 'next-auth/react';
import SubscribeButton from '@/app/components/SubscribeButton';
import { usePathname } from 'next/navigation';

export default function ArticlePage({ params }) {
  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creditDeducted, setCreditDeducted] = useState(false);
  const [isProcessingCredit, setIsProcessingCredit] = useState(false);
  
  const { data: session, status, update } = useSession();
  const pathname = usePathname();
  const { author, titleSlug } = params;
  const userCredits = session?.user?.credits || 0;

  // Fetch article
  useEffect(() => {
    if (status !== "loading") {
      fetchArticle();
    }
  }, [author, titleSlug, status]);

  // Handle credit deduction
  useEffect(() => {
    if (!article || !session || creditDeducted || isLoading || isProcessingCredit) return;

    if (userCredits < 1) {
      setCreditDeducted(false);
      return;
    }

    const deductCredit = async () => {
      setIsProcessingCredit(true);
      try {
        const response = await fetch('/api/credits/deduct', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ articleId: article.id }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 402 || data.error === 'Insufficient credits') {
            setCreditDeducted(false);
            return;
          }
          
          if (data.code === 'P2002') {
            setCreditDeducted(true);
            return;
          }
          throw new Error(data.error || 'Failed to process credits');
        }
    
        if (!data.alreadyRead) {
          await update();
        }
    
        setCreditDeducted(true);
      } catch (error) {
        console.error('Credit deduction error:', error);
        setError(error.message);
      } finally {
        setIsProcessingCredit(false);
      }
    };

    deductCredit();
  }, [article, session, creditDeducted, isLoading, update, userCredits, isProcessingCredit]);

  const getReturnUrl = (articleLanguage) => {
    return articleLanguage === 'lithuanian' ? '/lietuviskai/' : '/';
  };

  const fetchArticle = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/${encodeURIComponent(author)}/${encodeURIComponent(titleSlug)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Article not found. Please check the URL and try again.`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setArticle(data);
    } catch (error) {
      console.error('Error fetching article:', error);
      setError(`Failed to load article: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const processContent = (content) => {
    let processedContent = content.replace(/<\/p>\s*<p>/g, '</p><br><p>');
    processedContent = processedContent.replace(/<h1>(.*?)<\/h1>/g, '<h1 class="text-4xl font-bold my-4">$1</h1>');
    processedContent = processedContent.replace(/<h2>(.*?)<\/h2>/g, '<h2 class="text-3xl font-semibold my-3">$1</h2>');
    processedContent = processedContent.replace(/<h3>(.*?)<\/h3>/g, '<h3 class="text-2xl font-medium my-2">$1</h3>');
    processedContent = processedContent.replace(/<h4>(.*?)<\/h4>/g, '<h4 class="text-xl font-medium my-2">$1</h4>');
    processedContent = processedContent.replace(/<h5>(.*?)<\/h5>/g, '<h5 class="text-lg font-medium my-1">$1</h5>');
    processedContent = processedContent.replace(/<h6>(.*?)<\/h6>/g, '<h6 class="text-base font-medium my-1">$1</h6>');

    processedContent = processedContent.replace(
      /<div id="youtube2-.*?" class="youtube-wrap".*?>(.*?)<\/div>/gs,
      (match, innerContent) => {
        const iframeSrc = innerContent.match(/src="(.*?)"/)?.[1] || '';
        return `
          <div class="relative w-full pt-[56.25%] my-4">
            <iframe 
              src="${iframeSrc}" 
              class="absolute top-0 left-0 w-full h-full" 
              frameborder="0" 
              loading="lazy" 
              gesture="media" 
              allow="autoplay; fullscreen" 
              allowfullscreen="true"
            ></iframe>
          </div>
        `;
      }
    );

    return processedContent;
  };

  if (status === "loading" || (isLoading && !article)) {
    return (
      <div className="container mx-auto p-4">
        <Header />
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  const returnUrl = getReturnUrl(article.tags.includes('lithuanian') ? 'lithuanian' : 'english');

  if (userCredits < 1 && !creditDeducted) {
    return (
      <div className="container mx-auto p-4">
        <Header />
        <main>
          <h2 className="text-3xl font-bold mb-4">{article.title}</h2>
          <div className="border p-4 rounded-lg">
            <p>Note is built on micropayments. Reading an article consumes a credit.</p>
            <br/>
            <p>{session ? "Only pay for as much as you read." : "New readers get free credits."}</p>
            <SubscribeButton articleUrl={pathname} />
          </div>
          <Link href={returnUrl} className="mt-4 inline-block text-blue-500 hover:underline">
            return
          </Link>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Header />
        <div className="border p-4 rounded-lg bg-red-50">
          <p className="text-red-600">Error: {error}</p>
          <Link href="/" className="text-blue-500 hover:underline mt-4 inline-block">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!article) return (
    <div className="container mx-auto p-4">
      <Header />
      <div>Article not found</div>
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <Header />
      <main>
        <h2 className="text-3xl font-bold mb-4">{article.title}</h2>
          <div className="mb-4 text-sm bg-blue-950 px-3 py-2 rounded inline-block">
            Credits: {userCredits}
          </div>
        <div className="border p-4 rounded-lg">
          <div className="mt-4" dangerouslySetInnerHTML={{ __html: processContent(article.content) }}></div>
          <Link href={article.url} target="_blank" rel="noopener noreferrer nofollow" className="text-blue-500 hover:underline">
            <p className="mt-2">original</p>
          </Link>
          <p className="text-gray-600 mt-2">{new Date(article.publishedAt).toLocaleString()}</p>
        </div>
        <Link href={returnUrl} className="mt-4 inline-block text-blue-500 hover:underline">
          return
        </Link>
      </main>
    </div>
  );
}