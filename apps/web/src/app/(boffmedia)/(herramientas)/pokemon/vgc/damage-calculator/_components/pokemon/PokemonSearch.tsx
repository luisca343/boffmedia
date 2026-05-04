'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { SPECIES_MAP, SPECIES_NAMES } from '../../_hooks/usePokemonData'
import { PokemonTypeIcon } from '@/components/shared/pokemon/PokemonTypeIcon'
import { getSpriteUrl } from '../../_lib/spriteUtils'

interface Props {
  value: string
  onChange: (name: string) => void
  placeholder?: string
}

export function PokemonSearch({ value, onChange, placeholder = 'Search Pokémon...' }: Props) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery(value)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [value])

  const filtered = useCallback(() => {
    if (!query) return SPECIES_NAMES.slice(0, 30)
    const q = query.toLowerCase()
    return SPECIES_NAMES.filter((n) => n.toLowerCase().includes(q)).slice(0, 30)
  }, [query])

  const results = filtered()

  function select(name: string) {
    onChange(name)
    setQuery(name)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        className="w-full bg-surface-900 border border-surface-700 rounded-md px-3 py-2 text-sm font-semibold text-surface-100 placeholder:text-surface-500 focus:outline-none focus:border-primary-500 transition-colors"
        value={query}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results[0]) select(results[0])
          if (e.key === 'Escape') { setOpen(false); setQuery(value) }
        }}
      />

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-surface-900 border border-surface-700 rounded-lg shadow-2xl max-h-52 overflow-y-auto">
          {results.map((name) => {
            const species = SPECIES_MAP.get(name)
            if (!species) return null
            return (
              <button
                key={name}
                type="button"
                onMouseDown={() => select(name)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-primary-500/10 transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getSpriteUrl(species.id)}
                  alt={name}
                  width={28}
                  height={28}
                  className="pixelated flex-shrink-0"
                />
                <span className="text-sm font-semibold text-surface-200 flex-1 truncate">{name}</span>
                <span className="flex gap-1 flex-shrink-0">
                  {species.types.map((t) => (
                    <PokemonTypeIcon key={t} type={t} size={16} />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
