"use client"
import { TableBody } from "@/components/ui/primitives/table"
import { BattleStats, EvYields, Pokemon } from '@/types/Pokemon'
import PokedexTable, { PokedexCell, PokedexHead, PokedexHeader, PokedexRow } from '../../../_components/PokedexTable'
import { useTranslations } from "next-intl"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/primitives/hover-card"
import { ChartBarIcon, InformationCircleIcon } from "@heroicons/react/24/outline"
import { useState } from "react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/primitives/select"
import { getStatColor, getTotalStatColor, getContrastingTextColor, TOTAL_STAT_COLOR_RANGES } from "@/lib/pokemonColors"

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

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-3">
        <div className="flex items-center">
          <div 
            className="inline-flex items-center px-3 py-2 rounded-md text-xl font-medium"
            style={{ 
              backgroundColor: getTotalStatColor(statTotal), 
              color: getContrastingTextColor(getTotalStatColor(statTotal))
            }}
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
                {TOTAL_STAT_COLOR_RANGES.map((range, index) => (
                  <p key={index}>
                    <span className="font-medium">{range.min}-{range.max === 999 ? '620+' : range.max}:</span> {range.description}
                  </p>
                ))}
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
              <Select value={nature} onValueChange={setNature}>
                <SelectTrigger className="bg-surface-700 text-surface-100 border border-surface-600 w-[200px]">
                  <SelectValue placeholder={t(`nature_${nature}`)} />
                </SelectTrigger>
                <SelectContent 
                    className="bg-surface-700 text-surface-100 border border-surface-600 max-h-[300px] overflow-y-auto"
                    position="popper"
                    sideOffset={5}
                  >
                  <SelectItem value="neutral">{t('nature_neutral')}</SelectItem>
                  
                  <SelectGroup>
                    <SelectLabel>+ {t('stat_attack')}</SelectLabel>
                    <SelectItem value="adamant">
                      {t('nature_adamant')} (+ {t('stat_attack').split(' ')[0]}, - {t('stat_specialattack').split(' ')[0]})
                    </SelectItem>
                    <SelectItem value="brave">
                      {t('nature_brave')} (+ {t('stat_attack').split(' ')[0]}, - {t('stat_speed')})
                    </SelectItem>
                    <SelectItem value="lonely">
                      {t('nature_lonely')} (+ {t('stat_attack').split(' ')[0]}, - {t('stat_defense')})
                    </SelectItem>
                    <SelectItem value="naughty">
                      {t('nature_naughty')} (+ {t('stat_attack').split(' ')[0]}, - {t('stat_specialdefense').split(' ')[0]})
                    </SelectItem>
                  </SelectGroup>
                  
                  <SelectGroup>
                    <SelectLabel>+ {t('stat_defense')}</SelectLabel>
                    <SelectItem value="bold">
                      {t('nature_bold')} (+ {t('stat_defense')}, - {t('stat_attack').split(' ')[0]})
                    </SelectItem>
                    <SelectItem value="relaxed">
                      {t('nature_relaxed')} (+ {t('stat_defense')}, - {t('stat_speed')})
                    </SelectItem>
                    <SelectItem value="impish">
                      {t('nature_impish')} (+ {t('stat_defense')}, - {t('stat_specialattack').split(' ')[0]})
                    </SelectItem>
                    <SelectItem value="lax">
                      {t('nature_lax')} (+ {t('stat_defense')}, - {t('stat_specialdefense').split(' ')[0]})
                    </SelectItem>
                  </SelectGroup>
                  
                  <SelectGroup>
                    <SelectLabel>+ {t('stat_specialattack')}</SelectLabel>
                    <SelectItem value="modest">
                      {t('nature_modest')} (+ {t('stat_specialattack').split(' ')[0]}, - {t('stat_attack').split(' ')[0]})
                    </SelectItem>
                    <SelectItem value="mild">
                      {t('nature_mild')} (+ {t('stat_specialattack').split(' ')[0]}, - {t('stat_defense')})
                    </SelectItem>
                    <SelectItem value="quiet">
                      {t('nature_quiet')} (+ {t('stat_specialattack').split(' ')[0]}, - {t('stat_speed')})
                    </SelectItem>
                    <SelectItem value="rash">
                      {t('nature_rash')} (+ {t('stat_specialattack').split(' ')[0]}, - {t('stat_specialdefense').split(' ')[0]})
                    </SelectItem>
                  </SelectGroup>
                  
                  <SelectGroup>
                    <SelectLabel>+ {t('stat_specialdefense')}</SelectLabel>
                    <SelectItem value="calm">
                      {t('nature_calm')} (+ {t('stat_specialdefense').split(' ')[0]}, - {t('stat_attack').split(' ')[0]})
                    </SelectItem>
                    <SelectItem value="gentle">
                      {t('nature_gentle')} (+ {t('stat_specialdefense').split(' ')[0]}, - {t('stat_defense')})
                    </SelectItem>
                    <SelectItem value="sassy">
                      {t('nature_sassy')} (+ {t('stat_specialdefense').split(' ')[0]}, - {t('stat_speed')})
                    </SelectItem>
                    <SelectItem value="careful">
                      {t('nature_careful')} (+ {t('stat_specialdefense').split(' ')[0]}, - {t('stat_specialattack').split(' ')[0]})
                    </SelectItem>
                  </SelectGroup>
                  
                  <SelectGroup>
                    <SelectLabel>+ {t('stat_speed')}</SelectLabel>
                    <SelectItem value="hasty">
                      {t('nature_hasty')} (+ {t('stat_speed')}, - {t('stat_defense')})
                    </SelectItem>
                    <SelectItem value="jolly">
                      {t('nature_jolly')} (+ {t('stat_speed')}, - {t('stat_specialattack').split(' ')[0]})
                    </SelectItem>
                    <SelectItem value="naive">
                      {t('nature_naive')} (+ {t('stat_speed')}, - {t('stat_specialdefense').split(' ')[0]})
                    </SelectItem>
                    <SelectItem value="timid">
                      {t('nature_timid')} (+ {t('stat_speed')}, - {t('stat_attack').split(' ')[0]})
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
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
                natureMultiplier === 0.9 ? "text-secondary-300" : 
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
                      <span 
                        className="text-lg font-bold drop-shadow-sm"
                        style={{ color: getContrastingTextColor(getStatColor(statValue)) }}
                      >
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