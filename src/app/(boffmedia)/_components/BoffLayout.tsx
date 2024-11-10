import React from 'react';
import { BoffFooter } from './BoffFooter';
import OptimizedFicusNav from '@/components/nav/FicusNav';

export default function BoffLayout({ children, footer = true }: { children: React.ReactNode, footer?: boolean }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white font-sans">
      <div 
        className="fixed inset-0 w-full h-full z-0 opacity-30 pointer-events-none" 
        style={{ backgroundImage: `url("/img/boff-bg.svg")`, backgroundRepeat: 'repeat' }}
        aria-hidden="true"
      />
      <div className="flex flex-col flex-grow z-10 relative pt-16"> {/* Added pt-16 here */}
        <main className="container mx-auto px-4 py-12 flex-grow">
          {children}
        </main>
        {footer && <BoffFooter />}
      </div>
    </div>
  );
}