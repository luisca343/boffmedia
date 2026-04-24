'use client';

import { forwardRef, useImperativeHandle, useRef, useState, useEffect, KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { spriteUrl, SpeciesEntry } from '@/features/vgc-tracker/types';

export interface PokemonAutocompleteHandle {
  focusInput: () => void;
}

interface Props {
  search: (query: string) => SpeciesEntry[];
  onSelect: (entry: SpeciesEntry) => void;
  autoFocus?: boolean;
  placeholder?: string;
  onTabNext?: () => void;
}

export const PokemonAutocomplete = forwardRef<PokemonAutocompleteHandle, Props>(
  function PokemonAutocomplete({ search, onSelect, autoFocus, placeholder = 'Search...', onTabNext }, ref) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpeciesEntry[]>([]);
  const [highlighted, setHighlighted] = useState(0);
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useImperativeHandle(ref, () => ({
    focusInput: () => inputRef.current?.focus(),
  }));

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Recompute dropdown position on open/scroll/resize
  useEffect(() => {
    if (!open || !inputRef.current) {
      setDropdownPos(null);
      return;
    }
    const calc = () => {
      const rect = inputRef.current!.getBoundingClientRect();
      const minW = 220;
      const w = Math.max(rect.width, minW);
      let left = rect.left;
      if (left + w > window.innerWidth - 8) left = window.innerWidth - w - 8;
      setDropdownPos({ top: rect.bottom + 4, left, width: w });
    };
    calc();
    window.addEventListener('scroll', calc, true);
    window.addEventListener('resize', calc);
    return () => {
      window.removeEventListener('scroll', calc, true);
      window.removeEventListener('resize', calc);
    };
  }, [open]);

  const handleChange = (val: string) => {
    setQuery(val);
    const r = search(val);
    setResults(r);
    setOpen(r.length > 0);
    setHighlighted(0);
  };

  const commit = (entry: SpeciesEntry) => {
    onSelect(entry);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && onTabNext) {
      e.preventDefault();
      setOpen(false);
      onTabNext();
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[highlighted]) commit(results[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => query.length >= 2 && setOpen(results.length > 0)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder={placeholder}
        className="w-full bg-surface-800 border border-surface-600 focus:border-primary-500 rounded-lg px-3 py-2 text-surface-50 placeholder:text-surface-500 text-sm focus:outline-none transition-colors"
        autoComplete="off"
        spellCheck={false}
      />

      {open && dropdownPos && createPortal(
        <ul
          ref={listRef}
          style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 9999 }}
          className="bg-surface-900 border border-surface-700 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto"
        >
          {results.map((entry, i) => (
            <li key={entry.id}>
              <button
                onMouseDown={(e) => { e.preventDefault(); commit(entry); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  i === highlighted
                    ? 'bg-primary-600/30 text-primary-300'
                    : 'text-surface-200 hover:bg-surface-800'
                }`}
              >
                <img
                  src={spriteUrl(entry.name)}
                  alt={entry.name}
                  className="w-8 h-8 object-contain shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span>{entry.name}</span>
                <span className="ml-auto text-surface-600 text-xs font-mono">#{entry.num}</span>
              </button>
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  );
});
