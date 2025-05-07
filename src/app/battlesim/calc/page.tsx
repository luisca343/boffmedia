'use client';

import { TerasDex } from "../TerasDex";
import { useState, useEffect } from "react";
import { Generations } from '@smogon/calc';
import { ModdedDex } from "@pkmn/dex";
import CalculatorForm from "./_components/CalculatorForm";
import { CalcProvider } from "./_context/CalcContext";
import { PokemonData } from "./types";
import { a } from "@react-spring/web";

export default function DamageCalculator() {
  const [moddedDex, setModdedDex] = useState<ModdedDex | null>(null);
  const [genInstance, setGenInstance] = useState(null);
  const [pokemon, setPokemon] = useState<PokemonData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const dex = await TerasDex;
      setModdedDex(dex);
      
      // Get the Gen 9 instance from Generations (which is already an instance)
      const gen = Generations.get(9) as any;
      setGenInstance(gen);
      console.log(dex.species.all());
      const pokemonList = Object.entries(dex.species.all())
        .map(([id, species]) => ({
          id: species.id,
          name: species.name,
          num: species.num,
          types: species.types || [],
          baseStats: species.baseStats || {},
          abilities: species.abilities || {},
        }))
        .filter(poke => poke.num > 0)
        .sort((a, b) => a.num - b.num);
      
      setPokemon(pokemonList);
      setIsLoading(false);
    }
    
    fetchData();
  }, []);

  return (
    <div className="p-4 bg-surface-900 min-h-full text-surface-100 overflow-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
        Damage Calculator
      </h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="relative">
            <div className="w-12 h-12 rounded-full absolute border-4 border-solid border-surface-200 opacity-20"></div>
            <div className="w-12 h-12 rounded-full animate-spin absolute border-4 border-solid border-primary-500 border-t-transparent"></div>
          </div>
          <p className="ml-4 text-surface-300">Loading calculator data...</p>
        </div>
      ) : (
        <CalcProvider moddedDex={moddedDex} genInstance={genInstance} pokemon={pokemon}>
          <CalculatorForm />
        </CalcProvider>
      )}
    </div>
  );
}