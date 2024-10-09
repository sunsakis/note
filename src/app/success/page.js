'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/app/components/header';

export default function Success() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // Here you can verify the session and update your database
      console.log('Successful subscription!', sessionId);
    }
  }, [searchParams]);

  return (
    <div className="container mx-auto p-4">
      <Header />
      <main className="mt-8">
        <div className="border p-4 rounded-lg mb-4">
          <h1 className="text-2xl font-semibold mb-4">Thank you for your subscription!</h1>
          <p className="mb-4">Now you can request an author to add to the feed.</p>
          <p className="mb-4">Please write to us at:</p>
          <a href="mailto:news@note.live" className="text-blue-500 hover:underline">news@note.live</a>
        </div>
        <div className="mt-8">
          <Link href="/" className="text-blue-500 hover:underline">
            ← Back to homepage
          </Link>
        </div>
      </main>
      <footer className="mt-8 text-center text-gray-500">
        Note
      </footer>
    </div>
  );
}