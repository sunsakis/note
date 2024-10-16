"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function SubscriptionSuccess() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [message, setMessage] = useState('Verifying your subscription...');

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push('/login');
      return;
    }

    const verifySubscription = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      const articleUrl = urlParams.get('article_url');

      if (!sessionId) {
        setMessage('Invalid session. Please try subscribing again.');
        return;
      }

      try {
        const response = await fetch('/api/stripe/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to verify subscription');
        }

        const data = await response.json();
        if (data.success) {
           // Update the session with the new user data
           await update({
            ...session,
            user: {
              ...session.user,
              isPremium: data.user.isPremium
            }
          });
          setMessage('Subscription successful! Redirecting you to the article...');
          setTimeout(() => {
            router.push(articleUrl || '/');
          }, 2000);  // Redirect after 2 seconds
        } else {
          setMessage('Unable to verify subscription. Please contact support.');
        }
      } catch (error) {
        console.error('Error verifying subscription:', error);
        setMessage('An error occurred while verifying your subscription. Please try again or contact support: news@note.live');
      }
    };

    verifySubscription();
  }, [session, status, router]);

  return (
    <div className="container mx-auto p-4">
      <p className="text-2xl font-bold mb-4">Payment Status</p>
      <p className="mb-4">{message}</p>
      <Link href="/" className="text-blue-500 hover:underline">
        Return to Homepage
      </Link>
    </div>
  );
}