'use client';

import { GENERATIONS, GenerationId } from '../_utils/generations';
import { useCalcContext } from '../_context/CalcContext';

export default function GenerationSelector() {
  const { currentGeneration, setGeneration } = useCalcContext();
  
  return (
    <div className="flex flex-wrap justify-center gap-1 mb-6 bg-surface-800 rounded-md p-1 max-w-4xl mx-auto">
      {GENERATIONS.map((gen) => (
        <button
          key={gen.id}
          className={`px-3 py-1.5 text-xs rounded transition-colors ${
            currentGeneration === gen.id
              ? 'bg-primary-500 text-white shadow-md'
              : 'bg-surface-700 hover:bg-surface-600 active:bg-primary-800/50'
          }`}
          onClick={() => setGeneration(gen.id as GenerationId)}
        >
          {gen.shortName}
        </button>
      ))}
    </div>
  );
}