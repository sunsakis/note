
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
  const { data: session, status } = useSession();

  const pathname = usePathname();

  const { author, titleSlug } = params;

  useEffect(() => {
    if (status !== "loading") {
      fetchArticle();
    }
  }, [author, titleSlug, status]);

  const getReturnUrl = (articleLanguage) => {
    return articleLanguage === 'lithuanian' ? '/lietuviskai/' : '/';
  };

  const fetchArticle = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/${encodeURIComponent(author)}/${encodeURIComponent(titleSlug)}`);
      console.log('ArticlePage: Response status:', response.status);

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
    // Add extra breaks between paragraphs
    let processedContent = content.replace(/<\/p>\s*<p>/g, '</p><br><p>');
    
    // Adjust header sizes
    processedContent = processedContent.replace(/<h1>(.*?)<\/h1>/g, '<h1 class="text-4xl font-bold my-4">$1</h1>');
    processedContent = processedContent.replace(/<h2>(.*?)<\/h2>/g, '<h2 class="text-3xl font-semibold my-3">$1</h2>');
    processedContent = processedContent.replace(/<h3>(.*?)<\/h3>/g, '<h3 class="text-2xl font-medium my-2">$1</h3>');
    processedContent = processedContent.replace(/<h4>(.*?)<\/h4>/g, '<h4 class="text-xl font-medium my-2">$1</h4>');
    processedContent = processedContent.replace(/<h5>(.*?)<\/h5>/g, '<h5 class="text-lg font-medium my-1">$1</h5>');
    processedContent = processedContent.replace(/<h6>(.*?)<\/h6>/g, '<h6 class="text-base font-medium my-1">$1</h6>');

    // Process YouTube embeds
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

  if (status === "loading" || isLoading) return <div>Loading...</div>;
  if (error) return (
    <div>
      <p>Error: {error}</p>
      <p>Attempted to fetch article for:</p>
      <ul>
        <li>Author: {author}</li>
        <li>Title Slug: {titleSlug}</li>
      </ul>
      <Link href="/" className="text-blue-500 hover:underline">
        Return to Home
      </Link>
    </div>
  );
  if (!article) return <div>Article not found</div>;

  const returnUrl = getReturnUrl(article.tags.includes('lithuanian') ? 'lithuanian' : 'english');

  // Check if the article is premium and user is not subscribed
  const isPremiumContent = article.tags.includes('vc');
  const isUserSubscribed = session?.user?.isPremium;

  if (isPremiumContent && !isUserSubscribed) {
    return (
      <div className="container mx-auto p-4">
        <Header />
        <main>
          <h2 className="text-3xl font-bold mb-4">{article.title}</h2>
          <div className="border p-4 rounded-lg">
            <p>This is a premium article. Please pay a one-time fee to unlock all of Note's content.</p>
             <SubscribeButton articleUrl={pathname} />
          </div>
          <Link href={returnUrl} className="mt-4 inline-block text-blue-500 hover:underline">
            return
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Header />
      <main>
        <h2 className="text-3xl font-bold mb-4">{article.title}</h2>
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