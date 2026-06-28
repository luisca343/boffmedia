import React from 'react';
import { BoffFooter } from './BoffFooter';

export default function BoffLayout({ children, footer = true }: { children: React.ReactNode, footer?: boolean }) {
  return (
    <div className="flex flex-col min-h-full bg-layer-1 text-white">
      <div 
        className="fixed inset-0 w-full h-full z-0 opacity-50 pointer-events-none" 
        style={{ backgroundImage: `url("/img/boff.svg")`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        aria-hidden="true"
      />
      <div className="flex flex-col flex-grow z-10 relative">
        <main className="container mx-auto px-4 py-12 flex-grow flex flex-col">
          {children}
        </main>
        {footer && <BoffFooter />}
      </div>
    </div>
  );
}