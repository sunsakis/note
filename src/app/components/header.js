import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (isClient) {
      try {
        const response = await fetch('/api/stripe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const { url } = await response.json();
        
        if (url) {
          router.push(url);
        } else {
          console.error('No URL in the response');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold m-1 mb-2 mt-0">
        <Link href="/">
          Note
        </Link>
      </h1>
      <div className="flex-grow flex justify-center">
        <button onClick={handleCheckout}>
          <Image 
            src="/coffee.png" 
            alt="Front of a $1 dollar coin with Lady Liberty holding the Torch of Freedom up high." 
            width={65} 
            height={65} 
            className="m-3 mt-0 cursor-pointer"
          />
        </button>
      </div>
      <Link href="/lietuviskai">
        <Image src="/lithuania_flag.svg" alt="Lietuvos herbas" width={25} height={25} className="m-1 mt-0"/>
      </Link>
    </div>
  );
}