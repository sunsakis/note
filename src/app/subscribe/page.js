"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function SubscribePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status === "loading") return; // Wait for the session to load

    if (!session) {
      // If no session exists, set a message and we'll show a link to login
      setMessage("Please log in to manage your subscription.");
    } else {
      // Session exists, check if the user came from a cancelled Stripe session
      const urlParams = new URLSearchParams(window.location.search);
      const stripeSessionId = urlParams.get('session_id');
      
      if (stripeSessionId) {
        // User came from a Stripe session, it was likely cancelled
        setMessage("Your subscription process was not completed. You can try again or return to the homepage.");
      } else {
        // User navigated here directly, show subscription options or current status
        setMessage("Manage your subscription here. If you're not subscribed, you can start a new subscription.");
      }
    }
  }, [session, status, router]);

  return (
    <div className="container mx-auto p-4">
      <p className="text-2xl font-bold mb-4">Payment Page</p>
      <p className="mb-4">{message}</p>
      {!session ? (
        <Link href="/api/auth/signin" className="text-blue-500 hover:underline">
          Log in
        </Link>
      ) : (
        <>
          <Link href="/" className="text-blue-500 hover:underline mr-4">
            Return to Homepage
          </Link>
          {/* Add your subscription management UI here */}
          {/* For example, a button to start a new subscription if the user isn't subscribed */}
          {/* Or options to manage an existing subscription */}
        </>
      )}
    </div>
  );
}