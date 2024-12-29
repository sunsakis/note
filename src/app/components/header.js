import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [email, setEmail] = useState('');

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/maillist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setEmail('');
        alert(data.message);
      } else {
        alert(data.error || data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mt-5">
        <Link href="/" className="flex items-center">
          <Image src="/logo.svg" alt="Note Logo" width={85} height={85} className="m-3 mt-0 cursor-pointer" />
        </Link>
        <div className="relative">
          <button 
            onClick={toggleDropdown}
            className="text-white rounded hover:text-blue-600 underline font-bold"
          >
            topics ▼
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-20 bg-white rounded-md shadow-lg z-10">
              <Link href="/capital" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Capital
              </Link>
              <Link href="/culture" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Culture
              </Link>
              <Link href="/tech" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Tech
              </Link>
            </div>
          )}
        </div>
      </div>
      <div className="flex-grow flex justify-center items-center mb-5 mt-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="px-3 py-1 rounded border text-sm text-gray-600"
            required
          />
          <button type="submit" className="text-blue-500 hover:text-blue-800">
            Subscribe
          </button>
        </form>
      </div>
    </>
  );
}