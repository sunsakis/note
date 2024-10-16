'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SuccessContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // Here you can verify the session and update your database
      console.log('Successful subscription!', sessionId);
    }
  }, [searchParams]);

  return (
    <div className="border p-4 rounded-lg mb-4">
      <p className="text-2xl font-semibold mb-4">Thank you for your payment!</p>
      <p className="mb-4">Feel free to request to add an author to the feed.</p>
      <p className="mb-4">He/she will be added when at least 2 users request it.</p>
      <p className="mb-4">Simply write to us:</p>
      <a href="mailto:news@note.live" className="text-blue-500 hover:underline">news@note.live</a>
    </div>
  );
}