import React, { createContext, useContext, useEffect } from 'react';
import { usePokemonStore } from '@/stores/pokemonStore';

const PokemonContext = createContext<ReturnType<typeof usePokemonStore> | null>(null);

export const PokemonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = usePokemonStore();
  
  // Optional: Pre-fetch data when the provider mounts
  useEffect(() => {
    store.fetchAllPokemon();
  }, []);
  
  return (
    <PokemonContext.Provider value={store}>
      {children}
    </PokemonContext.Provider>
  );
};

export const usePokemon = () => {
  const context = useContext(PokemonContext);
  if (!context) {
    throw new Error('usePokemon must be used within a PokemonProvider');
  }
  return context;
};