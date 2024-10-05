'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

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
    <div>
      <h1>Thank you for your subscription!</h1>
      <p>You can now access the full content.</p>
    </div>
  );
}