'use client';

import { DexProvider } from './_context/DexContext';
import DexLayout from './_components/DexLayout';

export default function DexPage() {
  return (
    <DexProvider>
      <div className="p-4 bg-surface-900 min-h-full text-surface-100 overflow-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
          Pokédex
        </h1>
        <DexLayout />
      </div>
    </DexProvider>
  );
}