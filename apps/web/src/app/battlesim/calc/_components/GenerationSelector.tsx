'use client';

import { GENERATIONS, GenerationId } from '../_utils/generations';
import { useCalcContext } from '../_context/CalcContext';

export default function GenerationSelector() {
  const { currentGeneration, setGeneration } = useCalcContext();
  
  return (
    <div className="flex flex-wrap justify-center gap-1 mb-6 bg-layer-2 rounded-md p-1 max-w-4xl mx-auto">
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
  );
}