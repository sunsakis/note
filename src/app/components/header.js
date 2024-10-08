import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <div className="flex justify-between items-center">
    <h1 className="text-3xl font-bold m-1 mb-2 mt-0">
    <Link href="/">
        Note
    </Link>
    </h1>
    <Link href="/lietuviskai">
    <Image src="/lithuania_flag.svg" alt="Lietuvos herbas" width={25} height={25} className="m-1 mt-0"/>
    </Link>
    </div>
  );
}