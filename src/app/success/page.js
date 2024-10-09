'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Header from '@/app/components/header';
import dynamic from 'next/dynamic';

const SuccessContent = dynamic(() => import('./SuccessContent'), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

export default function Success() {
  return (
    <div className="container mx-auto p-4">
      <Header />
      <main className="mt-8">
        <Suspense fallback={<p>Loading...</p>}>
          <SuccessContent />
        </Suspense>
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