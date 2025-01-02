import Link from 'next/link';

export default function Footer() {


  return (
    <>
      <footer className="mt-8 text-center text-gray-500">
        <div className="flex flex-col items-center justify-center">
          <Link href="/best-venture-capital-newsletters" className="flex items-center">
            <p>Best Venture Capital Newsletters</p>
          </Link>
        </div>
        <br/>
        <div className="flex flex-col items-center justify-center">
          <Link href="/capital" className="underline">
            Capital
          </Link>
          <Link href="/culture" className="underline">
            Culture
          </Link>
          <Link href="/tech" className="underline">
            Tech
          </Link>
        </div>
      </footer>
    </>
  );
}