import Link from 'next/link';

export default function Footer() {


  return (
    <>
      <footer className="mt-8 text-center text-gray-500">
        <Link href="https://note.live/capital" className="underline">
          Capital
        </Link>
        <Link href="https://note.live/culture" className="underline">
          Culture
        </Link>
        <Link href="https://note.live/tech" className="underline">
          Tech
        </Link>
      </footer>
    </>
  );
}