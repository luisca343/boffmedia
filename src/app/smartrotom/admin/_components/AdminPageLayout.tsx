import React, { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeftCircle } from 'lucide-react';
import GlitchStyles from './GlitchStyles';

interface AdminPageLayoutProps {
  children: ReactNode;
  title: string;
  version?: string;
  backLink?: string;
  backText?: string;
  addBackgroundEffects?: boolean;
}

export default function AdminPageLayout({
  children,
  title,
  version,
  backLink = "/smartrotom/admin",
  backText = "Panel Principal",
  addBackgroundEffects = false
}: AdminPageLayoutProps) {
  return (
    <div className="w-full min-h-screen text-green-400 font-mono p-4 flex flex-col relative overflow-auto">
      <GlitchStyles />
      
      {/* Header with Back Button */}
      <div className="flex items-center mb-6">
        <Link href={backLink} className="text-green-500 hover:text-green-400 transition-colors flex items-center">
          <ArrowLeftCircle className="mr-2 w-5 h-5" />
          <span>{backText}</span>
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6 text-center text-green-500 uppercase tracking-widest glitch">
        {title} {version && <span className="text-xs text-green-700">v{version}</span>}
      </h1>
      
      {children}
      
      <div className="text-xs text-green-700 mt-4 text-center">
        Ficus Labs | Sistema de Administración | Acceso Restringido
      </div>
      
      {addBackgroundEffects && (
        <div className="fixed top-0 left-0 w-full h-screen pointer-events-none overflow-hidden z-0">
          {/* These imports should be added through the component using the layout */}
          {/* See usage example below */}
        </div>
      )}
    </div>
  );
}