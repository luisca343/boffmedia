import React from 'react';
import Image from "next/image";
import Link from "next/link";
import { Twitch, Gamepad2 } from "lucide-react";
import { BoffFooter } from './BoffFooter';

export default function BoffLayout({ children, footer = true }: { children: React.ReactNode, footer?: boolean }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans relative">
      <div className="absolute inset-0 w-full h-full z-0 opacity-30" style={{ backgroundImage: `url("/img/boff-bg.svg")`, backgroundRepeat: 'repeat' }}>
      </div>
      <div className="relative z-10">
        <main className="container mx-auto px-4 py-12">
          {children}
        </main>
        {footer && <BoffFooter />}
      </div>
    </div>
  );
}

const backgroundSvg = `

`;