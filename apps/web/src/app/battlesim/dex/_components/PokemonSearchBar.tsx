'use client';

import { useState, useEffect } from 'react';
import { useDexContext } from '../_context/DexContext';

export default function PokemonSearchBar() {
  const { 
    searchQuery, 
    setSearchQuery, 
    currentSearchCategory 
  } = useDexContext();
  const [inputValue, setInputValue] = useState(searchQuery);
  
  // Sync input with context when search category changes
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery, currentSearchCategory]);
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputValue);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [inputValue, setSearchQuery]);
  
  // Get placeholder text based on current category
  const getPlaceholderText = () => {
    switch (currentSearchCategory) {
      case 'pokemon':
        return 'Search Pokémon, moves, abilities, items, types, or more';
      case 'moves':
        return 'Search moves by name, type, category, or effect';
      case 'abilities':
        return 'Search abilities by name or effect';
      case 'items':
        return 'Search items by name or effect';
      default:
        return 'Search the Pokédex';
    }
  };
  
  return (
    <div className="relative">
      <input
        type="text"
        className="w-full p-3 bg-surface-800 border border-surface-700 rounded-lg text-surface-100 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        placeholder={getPlaceholderText()}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      {inputValue && (
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-200"
          onClick={() => {
            setInputValue('');
            setSearchQuery('');
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}