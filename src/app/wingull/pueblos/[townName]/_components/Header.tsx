import Link from 'next/link';
import LogoSection from './LogoSection';

export default function Header() {
  return (
    <header className="py-6 border-b border-blue-700 bg-blue-900">
      <div className="container mx-auto px-4">
        <Link href="/wingull/pueblos" className="text-yellow-300 hover:text-yellow-200 transition-colors duration-300">
          &larr; Volver a la lista de ciudades
        </Link>
      </div>
      <LogoSection />
    </header>
  );
}