'use client';

import { useSession, signIn } from 'next-auth/react';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function SubscribeButton({ articleUrl }) {
  const { data: session } = useSession();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubscribe = async () => {
    setError(null);
    setIsLoading(true);

    if (!session) {
      setIsLoading(false);
      return;
    }

    try {
      const stripe = await stripePromise;
      
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          articleUrl: articleUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      const result = await stripe.redirectToCheckout({ sessionId });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setError('Failed to start subscription process. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await signIn('email', {
        email,
        redirect: false,
        callbackUrl: window.location.href,
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setEmailSent(true);
    } catch (error) {
      setError('Failed to send login email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => session ? handleSubscribe() : signIn()}
        className="mt-4 inline-block text-blue-500 hover:underline"
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : session ? 'Pre-Pay Now' : 'Sign In'}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}