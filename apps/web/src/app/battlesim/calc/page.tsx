'use client';

import CalculatorForm from "./_components/CalculatorForm";
import { CalcProvider } from "./_context/CalcContext";
import GenerationSelector from "./_components/GenerationSelector";

export default function DamageCalculator() {
  return (
    <CalcProvider>
      <div className="p-4 bg-surface-900 min-h-full text-surface-100 overflow-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 to-highlight-400">
          Damage Calculator
        </h1>
        
        <GenerationSelector />
        
        <CalculatorForm />
      </div>
    </CalcProvider>
  );
}