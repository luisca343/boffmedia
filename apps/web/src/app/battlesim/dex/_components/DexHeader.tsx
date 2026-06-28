'use client';

import Link from 'next/link';
import { useDexContext } from '../_context/DexContext';
import { GENERATIONS, GenerationId } from '../../calc/_utils/generations';

export default function DexHeader() {
  const { 
    currentGeneration, 
    setGeneration,
    currentSearchCategory, 
    setCurrentSearchCategory 
  } = useDexContext();
  
  return (
    <div className="mb-6">
      {/* Navigation Tabs */}
      <div className="flex justify-center gap-2 mb-4">
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentSearchCategory === 'search' 
              ? 'bg-primary text-white' 
              : 'bg-layer-2 hover:bg-layer-3'
          }`}
          onClick={() => setCurrentSearchCategory('search')}
        >
          Search
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentSearchCategory === 'pokemon' 
              ? 'bg-primary text-white' 
              : 'bg-layer-2 hover:bg-layer-3'
          }`}
          onClick={() => setCurrentSearchCategory('pokemon')}
        >
          Pokémon
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentSearchCategory === 'moves' 
              ? 'bg-primary text-white' 
              : 'bg-layer-2 hover:bg-layer-3'
          }`}
          onClick={() => setCurrentSearchCategory('moves')}
        >
          Moves
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentSearchCategory === 'abilities' 
              ? 'bg-primary text-white' 
              : 'bg-layer-2 hover:bg-layer-3'
          }`}
          onClick={() => setCurrentSearchCategory('abilities')}
        >
          Abilities
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentSearchCategory === 'items' 
              ? 'bg-primary text-white' 
              : 'bg-layer-2 hover:bg-layer-3'
          }`}
          onClick={() => setCurrentSearchCategory('items')}
        >
          Items
        </button>
      </div>
      
      {/* Generation selector */}
      <div className="flex flex-wrap justify-center gap-1 bg-layer-2 rounded-md p-1 max-w-4xl mx-auto">
        {GENERATIONS.map((gen) => (
          <button
            key={gen.id}
            className={`px-3 py-1.5 text-xs rounded transition-colors ${
              currentGeneration === gen.id
                ? 'bg-primary text-white shadow-md'
                : 'bg-layer-3 hover:bg-layer-3 active:bg-primary-soft/50'
            }`}
            onClick={() => setGeneration(gen.id as GenerationId)}
          >
            {gen.shortName}
          </button>
        ))}
      </div>
      
      {/* Calculator Link */}
      <div className="flex justify-center mt-3">
        <Link 
          href="/battlesim/calc"
          className="text-primary-hover hover:text-primary-hover text-sm underline"
        >
          Go to Damage Calculator
        </Link>
      </div>
    </div>
  );
}