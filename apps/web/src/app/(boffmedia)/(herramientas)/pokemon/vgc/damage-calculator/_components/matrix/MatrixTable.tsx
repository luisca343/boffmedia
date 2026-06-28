'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { CalcPokemon, DamageResult } from '../../_types/calculator'
import type { VgcPokemon } from '../../_hooks/useLegalPokemon'
import { getSpriteUrl, handleSpriteError } from '../../_lib/spriteUtils'
import { PokemonTypeIcon } from '@/components/shared/pokemon/PokemonTypeIcon'

// ─── Cell styling ─────────────────────────────────────────────────────────────

function getMoveRowStyle(res: DamageResult | null): { bg: string; color: string } {
  if (!res) return { bg: 'transparent', color: 'rgb(51,65,85)' }
  const ohko  = res.minPct >= 100
  const g2hko = !ohko && res.minPct * 2 >= 100
  const p2hko = !ohko && !g2hko && res.maxPct * 2 >= 100
  if (ohko)  return { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444' }
  if (g2hko) return { bg: 'rgba(249,115,22,0.10)', color: '#f97316' }
  if (p2hko) return { bg: 'rgba(234,179,8,0.08)',  color: '#eab308' }
  return { bg: 'transparent', color: 'rgb(148,163,184)' }
}

function getKOLabel(res: DamageResult): string | null {
  if (res.minPct >= 100)     return 'OHKO'
  if (res.minPct * 2 >= 100) return '2HKO'
  if (res.maxPct * 2 >= 100) return '2HKO?'
  return null
}

// ─── Empty state ──────────────────────────────────────────────────────────────

export function EmptyMatrix({ icon }: { icon: string }) {
  const t = useTranslations('vgc.calc.matrixExtras')
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-8">
      <div className="text-4xl opacity-10">{icon}</div>
      <p className="text-ink-dim text-xs">{t('emptyMatrix')}</p>
    </div>
  )
}

// ─── Calc desc tooltip (fixed-position, follows cursor entry point) ───────────

interface TooltipState { x: number; y: number; text: string }

function CalcTooltip({ tooltip }: { tooltip: TooltipState }) {
  const rightEdge = typeof window !== 'undefined' ? window.innerWidth : 1200
  const flipped = tooltip.x + 332 > rightEdge
  return (
    <div
      className="fixed z-[200] pointer-events-none bg-layer-2/95 border border-edge/50 rounded-lg px-3 py-2 text-[10px] text-ink shadow-2xl leading-relaxed backdrop-blur-sm font-mono"
      style={{
        left: flipped ? tooltip.x - 320 : tooltip.x + 14,
        top: tooltip.y,
        transform: 'translateY(-50%)',
        maxWidth: 308,
        wordBreak: 'break-word',
      }}
    >
      {tooltip.text}
    </div>
  )
}

// ─── Table ────────────────────────────────────────────────────────────────────

interface Props {
  attackers: CalcPokemon[]
  defenders: CalcPokemon[]
  matrix: (DamageResult | null)[][][]
  cornerLabel: string
  legalPokemon: VgcPokemon[]
}

export function MatrixTable({ attackers, defenders, matrix, cornerLabel, legalPokemon }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  return (
    <>
      <table
        className="border-collapse text-sm"
        onMouseLeave={() => setTooltip(null)}
      >
        <thead>
          <tr>
            <th className="sticky left-0 top-0 z-30 bg-layer-1 border-b border-r border-edge/40 w-52 min-w-[208px] p-2">
              <span className="text-[10px] text-ink-dim uppercase tracking-wider">{cornerLabel}</span>
            </th>
            {defenders.map((def) => {
              const defEntry = legalPokemon.find((p) => p.name === def.name)
              return (
                <th key={def.name} className="sticky top-0 z-20 min-w-[110px] bg-layer-1 border-b border-r border-edge/40 px-2 py-1.5 text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <img src={getSpriteUrl(def.name)} onError={handleSpriteError}
                      className="w-10 h-10 object-contain" style={{ imageRendering: 'pixelated' }} alt={def.name} />
                    <span className="font-bold text-xs text-ink leading-tight max-w-[96px] truncate">{def.name}</span>
                    {defEntry && (
                      <div className="flex gap-0.5">
                        {defEntry.types.map((type) => <PokemonTypeIcon key={type} type={type} size={16} />)}
                      </div>
                    )}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {attackers.map((atk, atkIdx) => {
            const atkEntry = legalPokemon.find((p) => p.name === atk.name)
            return (
              <tr key={`${atk.name}-${atkIdx}`} className="border-b border-edge-strong/40">
                <td className="sticky left-0 z-10 bg-base border-r border-edge/40 w-52 min-w-[208px] align-top p-0">
                  <div className="flex items-center gap-2 h-[56px] px-2 border-b border-edge-strong/20 overflow-hidden">
                    <img src={getSpriteUrl(atk.name)} onError={handleSpriteError}
                      className="w-8 h-8 object-contain shrink-0" style={{ imageRendering: 'pixelated' }} alt={atk.name} />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-ink truncate leading-tight">{atk.name}</div>
                      {atkEntry && (
                        <div className="flex gap-0.5 mt-0.5">
                          {atkEntry.types.map((type) => <PokemonTypeIcon key={type} type={type} size={16} />)}
                        </div>
                      )}
                    </div>
                  </div>
                  {atk.moves.map((move, mi) => (
                    <div key={mi} className="h-[28px] flex items-center text-[11px] text-ink-muted truncate px-2 leading-tight border-b border-edge-strong/10 last:border-b-0">
                      {move.name || <span className="text-ink-dim">—</span>}
                    </div>
                  ))}
                </td>
                {defenders.map((def, defIdx) => {
                  const results = matrix[atkIdx]?.[defIdx] ?? []
                  return (
                    <td key={`${def.name}-${defIdx}`} className="border-r border-edge-strong/30 align-top p-0">
                      <div className="h-[56px] border-b border-edge-strong/20" />
                      {results.map((res, mi) => {
                        const { bg, color } = getMoveRowStyle(res)
                        const koLabel = res ? getKOLabel(res) : null
                        return (
                          <div
                            key={mi}
                            className="h-[28px] flex flex-col items-center justify-center px-1.5 border-b border-edge-strong/10 last:border-b-0 cursor-default"
                            style={{ background: bg }}
                            onMouseEnter={res ? (e) => setTooltip({ x: e.clientX, y: e.clientY, text: res.desc }) : undefined}
                            onMouseLeave={res ? () => setTooltip(null) : undefined}
                          >
                            {res ? (
                              <>
                                <span className="font-mono font-bold text-xs whitespace-nowrap" style={{ color }}>
                                  {res.minPct.toFixed(0)}–{res.maxPct.toFixed(0)}%
                                </span>
                                {koLabel && <span className="text-[9px] font-black leading-none" style={{ color }}>{koLabel}</span>}
                              </>
                            ) : (
                              <span style={{ color: 'rgb(51,65,85)', fontSize: 10 }}>—</span>
                            )}
                          </div>
                        )
                      })}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>

      {tooltip && <CalcTooltip tooltip={tooltip} />}
    </>
  )
}
