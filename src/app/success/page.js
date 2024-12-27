"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function PaymentSuccess() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [message, setMessage] = useState('Verifying your credits...');
  const [hasAttemptedVerification, setHasAttemptedVerification] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true); // Add this state

  useEffect(() => {
    if (status === "loading" || hasAttemptedVerification) return;

    if (!session) {
      router.push('/login');
      return;
    }

    const verifyPayment = async () => {
      setIsVerifying(true); // Show spinner when verification starts
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      const articleUrl = urlParams.get('article_url');

      if (!sessionId) {
        setMessage('Invalid session. Please try purchasing credits again.');
        setIsVerifying(false); // Hide spinner
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

        const data = await response.json();

        if (response.status === 400 && data.error === 'Payment already processed') {
          setMessage('Payment was already processed. Redirecting...');
          setTimeout(() => {
            router.push(articleUrl || '/');
          }, 2000);
          return;
        }

        if (!response.ok) {
          throw new Error(data.error || 'Failed to verify payment');
        }

        if (data.success) {
          await update();
          setMessage(`Payment successful! Credits updated. Redirecting...`);
          
          setTimeout(() => {
            router.push(articleUrl || '/');
          }, 2000);
        } else {
          setMessage('Unable to verify payment. Please contact support.');
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        if (error.message === 'Payment already processed') {
          setMessage('Payment was already processed. Redirecting...');
          setTimeout(() => {
            router.push(articleUrl || '/');
          }, 2000);
        } else {
          setMessage('An error occurred while verifying your payment. Please contact support: news@note.live');
        }
      } finally {
        setIsVerifying(false); // Hide spinner when verification ends
      }
    };

    setHasAttemptedVerification(true);
    verifyPayment();
  }, [session, status, router, update, hasAttemptedVerification]);

  const LoadingSpinner = () => (
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-4"></div>
  );

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Payment Status</h1>
        {(status === "loading" || isVerifying) && <LoadingSpinner />}
        <p className="mb-4 text-gray-700">{message}</p>
        <div className="mt-6">
          <Link 
            href="/" 
            className="text-blue-500 hover:text-blue-600 hover:underline"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}