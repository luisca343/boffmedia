'use client';

import CalculatorForm from "./_components/CalculatorForm";
import { CalcProvider } from "./_context/CalcContext";
import GenerationSelector from "./_components/GenerationSelector";

export default function DamageCalculator() {
  return (
    <CalcProvider>
      <div className="p-4 bg-layer-1 min-h-full text-ink overflow-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-secondary-hover to-warning-hover">
          Damage Calculator
        </h1>
        
        <GenerationSelector />
        
        <CalculatorForm />
      </div>
    </CalcProvider>
  );
}