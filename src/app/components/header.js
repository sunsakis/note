import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';

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
        const response = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ articleUrl: window.location.pathname }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Full response data:', data);
        
        if (data.sessionId) {
          // Redirect to Stripe Checkout
          const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
          const result = await stripe.redirectToCheckout({
            sessionId: data.sessionId,
          });
          if (result.error) {
            console.error('Stripe redirect error:', result.error);
          }
        } else {
          console.error('No sessionId in the response');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mt-5">
        <p className="text-3xl font-bold m-1 mb-2 mt-0">
          <Link href="/">
            Note
          </Link>
        </p>
        {/* <Link href="/lietuviskai">
          <Image src="/lithuania_flag.svg" alt="Lietuvos herbas" width={25} height={25} className="m-1 mt-0"/>
        </Link> */}
          {/* <button onClick={handleCheckout}>
            <Image 
              src="/coffee.png" 
              alt="Front of a $1 dollar coin with Lady Liberty holding the Torch of Freedom up high." 
              width={65} 
              height={65} 
              className="m-3 mt-0 cursor-pointer"
            />
          </button> */}
          <Link href="/best-vc-newsletters">
            <button className="text-white rounded hover:text-blue-600 underline">
              <p className=" font-bold">Best VC Newsletters</p>
            </button>
          </Link>
      </div>
      <div className="flex-grow flex justify-center mb-5">
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
      {/* <div className="flex-grow flex justify-center m-3 mb-5">
          <Link href="/best-vc-newsletters">
            <button className="text-white rounded hover:text-blue-600 underline">
              <p className=" font-bold">Best VC Newsletters</p>
            </button>
          </Link>
      </div> */}
    </>
  );
}