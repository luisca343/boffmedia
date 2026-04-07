'use client';

import { Suspense } from 'react';
import { DexProvider } from './_context/DexContext';
import DexLayout from './_components/DexLayout';

function DexContent() {
  return (
    <DexProvider>
      <div className="p-4 bg-surface-900 min-h-full text-surface-100 overflow-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 to-highlight-400">
          Pokédex
        </h1>
        <DexLayout />
      </div>
    </DexProvider>
  );
}

export default function DexPage() {
  return (
    <Suspense fallback={
      <div className="p-4 bg-surface-900 min-h-full text-surface-100 overflow-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-400"></div>
        </div>
      </div>
    }>
      <DexContent />
    </Suspense>
  );
}