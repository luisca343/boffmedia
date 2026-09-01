'use client';

import { forwardRef, useImperativeHandle, useRef, useState, useEffect, KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { spriteUrl, SpeciesEntry } from '../../tracker-core/types';

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
        className="w-full cut-tag cut-tag-edge focus:[--cut-line:var(--accent)] [--cut-line:var(--line-2)] border border-solid border-line-2 bg-base px-3 py-2 font-body text-[13px] text-txt outline-none transition-[border-color] placeholder:text-txt-dim focus:border-accent"
        autoComplete="off"
        spellCheck={false}
      />

      {open && dropdownPos && createPortal(
        <ul
          ref={listRef}
          style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 9999 }}
          className="max-h-60 overflow-y-auto border border-solid border-line-2 bg-panel shadow-[var(--shadow)]"
        >
          {results.map((entry, i) => (
            <li key={entry.id}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); commit(entry); }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left font-body text-[13px] transition-colors ${
                  i === highlighted ? 'bg-accent-soft text-accent-bright' : 'text-txt hover:bg-panel-2'
                }`}
              >
                <img
                  src={spriteUrl(entry.name)}
                  alt={entry.name}
                  className="h-8 w-8 shrink-0 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span>{entry.name}</span>
                <span className="ml-auto font-mono text-[11px] text-txt-dim">#{entry.num}</span>
              </button>
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  );
});
