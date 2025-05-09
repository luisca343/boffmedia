import { Generations } from '@smogon/calc';
import { TerasDex } from '../../TerasDex';
import { Dex } from '@pkmn/dex';

export type GenerationId = 'rb' | 'gs' | 'adv' | 'dpp' | 'bw' | 'xy' | 'sm' | 'ss' | 'sv' | 'teras';

export interface Generation {
  id: GenerationId;
  name: string;
  number: number;
  shortName: string;
  isModded?: boolean;
}

export const GENERATIONS: Generation[] = [
  { id: 'rb', name: 'Red/Blue', number: 1, shortName: 'RBY' },
  { id: 'gs', name: 'Gold/Silver', number: 2, shortName: 'GSC' },
  { id: 'adv', name: 'Ruby/Sapphire', number: 3, shortName: 'ADV' },
  { id: 'dpp', name: 'Diamond/Pearl', number: 4, shortName: 'DPP' },
  { id: 'bw', name: 'Black/White', number: 5, shortName: 'B/W' },
  { id: 'xy', name: 'X/Y', number: 6, shortName: 'X/Y' },
  { id: 'sm', name: 'Sun/Moon', number: 7, shortName: 'S/M' },
  { id: 'ss', name: 'Sword/Shield', number: 8, shortName: 'S/S' },
  { id: 'sv', name: 'Scarlet/Violet', number: 9, shortName: 'S/V' },
  { id: 'teras', name: 'Teras', number: 9, shortName: 'Teras', isModded: true }
];

export async function getDexAndGen(generationId: GenerationId) {
  // For standard generations, use the built-in Generations from @smogon/calc
  if (generationId !== 'teras') {
    // Find the generation number based on the ID
    const generation = GENERATIONS.find(gen => gen.id === generationId);
    const genNumber = generation ? generation.number : 9; // Default to Gen 9 if not found
    
    // Get the standard generation instance from Generations
    const genInstance = Generations.get(genNumber);
    const dex = Dex.forGen(genNumber);
    
    // Return the dex and gen instance
    return {
      dex,
      genInstance,
    };
  }
  
  // For Teras (modded Gen 9), use the TerasDex
  const terasDex = await TerasDex;
  const genInstance = Generations.get(9); // It's based on Gen 9
  
  return {
    dex: terasDex,
    genInstance,
  };
}