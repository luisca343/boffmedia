"use client"
import { TableBody } from "@/components/ui/table"
import { BattleStats, EvYields, Pokemon } from '@/types/Pokemon'
import PokedexTable, { PokedexCell, PokedexHead, PokedexHeader, PokedexRow } from '../../../_components/PokedexTable'
import { useTranslations } from "next-intl"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { ChartBarIcon, InformationCircleIcon } from "@heroicons/react/24/outline"
import { useState } from "react"

export function StatsTable({pokemon, formIndex}: {pokemon: Pokemon, formIndex: number}) {
  const t = useTranslations("pokedex")
  const [nature, setNature] = useState<string>("neutral")
  const [viewMode, setViewMode] = useState<"nature" | "range">("range")
  
  const stats = pokemon.forms[formIndex].battleStats ? pokemon.forms[formIndex].battleStats : pokemon.forms[0].battleStats as BattleStats
  if(!stats) return <h1>Stats not found</h1>
  
  let evYields = pokemon.forms[formIndex].evYields ? pokemon.forms[formIndex].evYields : pokemon.forms[0].evYields as EvYields 
  if(!evYields) evYields = {hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0} as EvYields
  
  const maxStat = 255
  const statTotal = Object.values(stats).reduce((acc, val) => acc + val, 0)
  
  // Array of nature multipliers for each stat
  const natures = {
    neutral: { hp: 1, attack: 1, defense: 1, specialattack: 1, specialdefense: 1, speed: 1 },
    adamant: { hp: 1, attack: 1.1, defense: 1, specialattack: 0.9, specialdefense: 1, speed: 1 },
    brave: { hp: 1, attack: 1.1, defense: 1, specialattack: 1, specialdefense: 1, speed: 0.9 },
    lonely: { hp: 1, attack: 1.1, defense: 0.9, specialattack: 1, specialdefense: 1, speed: 1 },
    naughty: { hp: 1, attack: 1.1, defense: 1, specialattack: 1, specialdefense: 0.9, speed: 1 },
    bold: { hp: 1, attack: 0.9, defense: 1.1, specialattack: 1, specialdefense: 1, speed: 1 },
    relaxed: { hp: 1, attack: 1, defense: 1.1, specialattack: 1, specialdefense: 1, speed: 0.9 },
    impish: { hp: 1, attack: 1, defense: 1.1, specialattack: 0.9, specialdefense: 1, speed: 1 },
    lax: { hp: 1, attack: 1, defense: 1.1, specialattack: 1, specialdefense: 0.9, speed: 1 },
    modest: { hp: 1, attack: 0.9, defense: 1, specialattack: 1.1, specialdefense: 1, speed: 1 },
    mild: { hp: 1, attack: 1, defense: 0.9, specialattack: 1.1, specialdefense: 1, speed: 1 },
    quiet: { hp: 1, attack: 1, defense: 1, specialattack: 1.1, specialdefense: 1, speed: 0.9 },
    rash: { hp: 1, attack: 1, defense: 1, specialattack: 1.1, specialdefense: 0.9, speed: 1 },
    calm: { hp: 1, attack: 0.9, defense: 1, specialattack: 1, specialdefense: 1.1, speed: 1 },
    gentle: { hp: 1, attack: 1, defense: 0.9, specialattack: 1, specialdefense: 1.1, speed: 1 },
    sassy: { hp: 1, attack: 1, defense: 1, specialattack: 1, specialdefense: 1.1, speed: 0.9 },
    careful: { hp: 1, attack: 1, defense: 1, specialattack: 0.9, specialdefense: 1.1, speed: 1 },
    hasty: { hp: 1, attack: 1, defense: 0.9, specialattack: 1, specialdefense: 1, speed: 1.1 },
    jolly: { hp: 1, attack: 1, defense: 1, specialattack: 0.9, specialdefense: 1, speed: 1.1 },
    naive: { hp: 1, attack: 1, defense: 1, specialattack: 1, specialdefense: 0.9, speed: 1.1 },
    timid: { hp: 1, attack: 0.9, defense: 1, specialattack: 1, specialdefense: 1, speed: 1.1 },
  }

  // Calculate a stat based on base, level, IVs, EVs, and nature
  function calculateStat(statName: string, base: number, level: number, iv: number, ev: number, natureMultiplier = 1): number {
    if (statName.toLowerCase() === 'hp') {
      return Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100 + level + 10)
    } else {
      return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level / 100 + 5) * natureMultiplier)
    }
  }
  
  // Calculate the absolute min and max possible values for a stat
  function calculateStatRange(statName: string, base: number, level: number): {min: number, max: number} {
    const isHP = statName.toLowerCase() === 'hp'
    
    // For HP there's no nature multiplier
    if (isHP) {
      const min = calculateStat(statName, base, level, 0, 0)
      const max = calculateStat(statName, base, level, 31, 252)
      return { min, max }
    }
    
    // For other stats, consider worst and best natures
    const minMultiplier = 0.9 // -10% from hindering nature
    const maxMultiplier = 1.1 // +10% from beneficial nature
    
    const min = calculateStat(statName, base, level, 0, 0, minMultiplier)
    const max = calculateStat(statName, base, level, 31, 252, maxMultiplier)
    
    return { min, max }
  }

  function getStatColor(stat: number): string {
    // Color ranges for different stat values
    if (stat < 50) return '#ff4d4d' // Very low - deep red
    if (stat < 75) return '#ff7c4d' // Low - orange-red
    if (stat < 90) return '#ffb14d' // Below average - orange
    if (stat < 110) return '#ffea4d' // Average - yellow
    if (stat < 130) return '#b1ff4d' // Above average - lime green
    if (stat < 150) return '#4dffa6' // High - teal
    return '#4d8aff' // Very high - blue
  }
  
  function getTotalColor(total: number): string {
    // Color range for total stats
    if (total < 300) return '#ff4d4d' // Very low
    if (total < 400) return '#ff7c4d' // Low
    if (total < 500) return '#ffb14d' // Below average
    if (total < 540) return '#ffea4d' // Average
    if (total < 580) return '#b1ff4d' // Above average
    if (total < 620) return '#4dffa6' // High
    return '#4d8aff' // Very high
  }

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-3">
        <div className="flex items-center">
          <div 
            className="inline-flex items-center px-3 py-2 rounded-md text-xl font-medium"
            style={{ backgroundColor: getTotalColor(statTotal), color: '#000' }}
          >
            <span className="mr-2">Total:</span>
            <span className="font-bold">{statTotal}</span>
          </div>
          
          <HoverCard>
            <HoverCardTrigger className="ml-2 text-surface-300 hover:text-primary-400">
              <InformationCircleIcon className="h-5 w-5" />
            </HoverCardTrigger>
            <HoverCardContent className="bg-surface-800 text-surface-100 p-3 border border-surface-600">
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Menos de 400:</span> Base muy baja</p>
                <p><span className="font-medium">400-499:</span> Base baja</p>
                <p><span className="font-medium">500-539:</span> Base media</p>
                <p><span className="font-medium">540-579:</span> Base alta</p>
                <p><span className="font-medium">580-619:</span> Base muy alta</p>
                <p><span className="font-medium">620+:</span> Base legendaria</p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View toggle buttons */}
          <div className="flex border border-surface-600 rounded overflow-hidden">
            <button
              onClick={() => setViewMode("nature")}
              className={`px-3 py-1 text-sm ${
                viewMode === "nature" 
                  ? "bg-primary-700 text-white" 
                  : "bg-surface-700 text-surface-300 hover:bg-surface-600"
              }`}
            >
              Naturaleza
            </button>
            <button
              onClick={() => setViewMode("range")}
              className={`px-3 py-1 text-sm ${
                viewMode === "range" 
                  ? "bg-primary-700 text-white" 
                  : "bg-surface-700 text-surface-300 hover:bg-surface-600"
              }`}
            >
              Rangos
            </button>
          </div>
          
          {/* Only show nature selector in nature mode */}
          {viewMode === "nature" && (
            <div className="flex items-center">
              <label htmlFor="nature-select" className="mr-2 text-surface-200">Naturaleza:</label>
              <select
                id="nature-select"
                value={nature}
                onChange={(e) => setNature(e.target.value)}
                className="bg-surface-700 text-surface-100 border border-surface-600 rounded px-2 py-1"
              >
                <option value="neutral">Neutral</option>
                <optgroup label="+ Ataque">
                  <option value="adamant">Firme (+ Atq, - AtqEsp)</option>
                  <option value="brave">Audaz (+ Atq, - Vel)</option>
                  <option value="lonely">Solitaria (+ Atq, - Def)</option>
                  <option value="naughty">Pícara (+ Atq, - DefEsp)</option>
                </optgroup>
                <optgroup label="+ Defensa">
                  <option value="bold">Osada (+ Def, - Atq)</option>
                  <option value="relaxed">Relajada (+ Def, - Vel)</option>
                  <option value="impish">Agitada (+ Def, - AtqEsp)</option>
                  <option value="lax">Floja (+ Def, - DefEsp)</option>
                </optgroup>
                <optgroup label="+ Atq. Especial">
                  <option value="modest">Modesta (+ AtqEsp, - Atq)</option>
                  <option value="mild">Afable (+ AtqEsp, - Def)</option>
                  <option value="quiet">Mansa (+ AtqEsp, - Vel)</option>
                  <option value="rash">Alocada (+ AtqEsp, - DefEsp)</option>
                </optgroup>
                <optgroup label="+ Def. Especial">
                  <option value="calm">Serena (+ DefEsp, - Atq)</option>
                  <option value="gentle">Amable (+ DefEsp, - Def)</option>
                  <option value="sassy">Grosera (+ DefEsp, - Vel)</option>
                  <option value="careful">Cauta (+ DefEsp, - AtqEsp)</option>
                </optgroup>
                <optgroup label="+ Velocidad">
                  <option value="hasty">Activa (+ Vel, - Def)</option>
                  <option value="jolly">Alegre (+ Vel, - AtqEsp)</option>
                  <option value="naive">Ingenua (+ Vel, - DefEsp)</option>
                  <option value="timid">Miedosa (+ Vel, - Atq)</option>
                </optgroup>
              </select>
            </div>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <PokedexTable>
          <PokedexHeader>
            <PokedexRow>
              <PokedexHead className="w-28">Estadística</PokedexHead>
              <PokedexHead className="w-40">Base</PokedexHead>
              {viewMode === "nature" ? (
                <>
                  <PokedexHead colSpan={2} className="text-center">Nivel 50</PokedexHead>
                  <PokedexHead colSpan={2} className="text-center">Nivel 100</PokedexHead>
                </>
              ) : (
                <>
                  <PokedexHead colSpan={2} className="text-center">Rango Nivel 50</PokedexHead>
                  <PokedexHead colSpan={2} className="text-center">Rango Nivel 100</PokedexHead>
                </>
              )}
              <PokedexHead className="text-center w-16">PE</PokedexHead>
            </PokedexRow>
          </PokedexHeader>
          <TableBody>
            {Object.entries(stats).map(([stat, statValue]) => {
              // Nature view calculations
              const natureMultiplier = natures[nature as keyof typeof natures][stat.toLowerCase() as keyof typeof natures.neutral]
              const statTextClass = 
                natureMultiplier === 1.1 ? "text-red-300 font-medium" : 
                natureMultiplier === 0.9 ? "text-blue-300" : 
                "text-surface-50"
              
              // Range calculations
              const range50 = calculateStatRange(stat, statValue, 50)
              const range100 = calculateStatRange(stat, statValue, 100)
                
              return (
                <PokedexRow key={stat}>
                  <PokedexCell hard className={`font-medium ${viewMode === "nature" ? statTextClass : ""}`}>
                    {t(`stat_${stat.toLowerCase()}`)}
                  </PokedexCell>
                  <PokedexCell className="relative p-0 h-10">
                    <div
                      className="absolute inset-0 flex items-center px-3"
                      style={{
                        width: `${Math.min(((statValue) / (maxStat)) * 100, 100)}%`,
                        backgroundColor: getStatColor(statValue)
                      }}
                    >
                      <span className="text-surface-950 text-lg font-bold drop-shadow-sm">
                        {statValue}
                      </span>
                    </div>
                  </PokedexCell>
                  
                  {viewMode === "nature" ? (
                    <>
                      <PokedexCell className="text-center">
                        {calculateStat(stat, statValue, 50, 0, 0, natureMultiplier)}
                      </PokedexCell>
                      <PokedexCell className="text-center font-medium">
                        {calculateStat(stat, statValue, 50, 31, 252, natureMultiplier)}
                      </PokedexCell>
                      <PokedexCell className="text-center">
                        {calculateStat(stat, statValue, 100, 0, 0, natureMultiplier)}
                      </PokedexCell>
                      <PokedexCell className="text-center font-medium">
                        {calculateStat(stat, statValue, 100, 31, 252, natureMultiplier)}
                      </PokedexCell>
                    </>
                  ) : (
                    <>
                      <PokedexCell className="text-center text-surface-400">
                        <span className="text-surface-300">{range50.min}</span>
                      </PokedexCell>
                      <PokedexCell className="text-center">
                        <div className="text-center">
                          <span className="font-medium text-primary-300">{range50.max}</span>
                          <div className="text-xs text-surface-400">+{range50.max - range50.min}</div>
                        </div>
                      </PokedexCell>
                      <PokedexCell className="text-center text-surface-400">
                        <span className="text-surface-300">{range100.min}</span>
                      </PokedexCell>
                      <PokedexCell className="text-center">
                        <div className="text-center">
                          <span className="font-medium text-primary-300">{range100.max}</span>
                          <div className="text-xs text-surface-400">+{range100.max - range100.min}</div>
                        </div>
                      </PokedexCell>
                    </>
                  )}
                  
                  <PokedexCell className={`text-center ${(evYields?.[stat as keyof EvYields] ?? 0) > 0 ? "text-primary-300 font-medium" : ""}`}>
                    {evYields?.[stat as keyof EvYields] ?? 0}
                  </PokedexCell>
                </PokedexRow>
              )
            })}
          </TableBody>
        </PokedexTable>
      </div>
      
      <div className="mt-2 flex flex-col md:flex-row gap-2 text-xs text-surface-300">
        {viewMode === "nature" ? (
          <>
            <div className="flex-1">
              <span className="font-medium">Mín:</span> 0 IVs, 0 EVs, naturaleza {nature === "neutral" ? "neutral" : "aplicada"}
            </div>
            <div className="flex-1">
              <span className="font-medium">Máx:</span> 31 IVs, 252 EVs, naturaleza {nature === "neutral" ? "neutral" : "aplicada"}
            </div>
          </>
        ) : (
          <>
            <div className="flex-1">
              <span className="font-medium">Mín:</span> 0 IVs, 0 EVs, -10% naturaleza
            </div>
            <div className="flex-1">
              <span className="font-medium">Máx:</span> 31 IVs, 252 EVs, +10% naturaleza
            </div>
            <div className="flex-1">
              <span className="font-medium">Diferencia:</span> Aumento total posible
            </div>
          </>
        )}
        <div className="flex-1 text-right">
          <span className="font-medium">PE:</span> Puntos de esfuerzo otorgados
        </div>
      </div>
    </div>
  )
}