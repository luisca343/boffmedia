"use client"
import { TypeChip } from "../../_components/TypeChip"
import { MoveEffect } from "./MoveEffect"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/primitives/hover-card"
import { InformationCircleIcon } from "@heroicons/react/24/outline"
import { useTranslations } from "next-intl"
import { useGetMove } from "@/hooks/pokemon/useGetMove"
import { getTranslatedMoveName } from "@/utils/pokemonTranslations"

const CATEGORY_LABELS: Record<string, string> = {
  physical: "Físico",
  special: "Especial",
  status: "Estado",
}

const CATEGORY_COLORS: Record<string, string> = {
  physical: "#fb923c",
  special: "#22d3ee",
  status: "#94a3b8",
}

export default function MoveDataElement({ id, isFullPage = false }: { id: string; isFullPage?: boolean }) {
  const t = useTranslations("pokedex")
  const { move } = useGetMove(id)

  if (!move)
    return (
      <div className="flex justify-center items-center p-4">
        <div className="text-surface-100 text-sm animate-pulse">Cargando...</div>
      </div>
    )

  const moveName = getTranslatedMoveName(move.attackName, t)
  const catKey = move.attackCategory.toLowerCase()

  return (
    <div className={`flex flex-col gap-4 ${isFullPage ? "" : "text-center"}`}>
      {/* Header */}
      {!isFullPage && (
        <div>
          <span className="font-orbitron font-bold text-lg text-surface-50">{moveName}</span>
        </div>
      )}

      {/* Type + Category */}
      <div className={`flex ${isFullPage ? "" : "justify-center"} gap-2`}>
        <TypeChip type={move.attackType.toLowerCase()} size="md" />
        <span
          className="inline-flex items-center px-2.5 h-[22px] rounded text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: CATEGORY_COLORS[catKey] || "var(--surface-300)" }}
        >
          {CATEGORY_LABELS[catKey] || move.attackCategory}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
        {move.basePower > 0 && (
          <>
            <div className="font-jetbrains text-[10px] tracking-[0.08em] uppercase text-surface-500">Poder</div>
            <div className="text-right font-orbitron font-bold text-surface-50 tabular-nums">{move.basePower}</div>
          </>
        )}
        {move.accuracy > 0 && (
          <>
            <div className="font-jetbrains text-[10px] tracking-[0.08em] uppercase text-surface-500">Precisión</div>
            <div className="text-right font-orbitron font-bold text-surface-50 tabular-nums">{move.accuracy}</div>
          </>
        )}
        <div className="font-jetbrains text-[10px] tracking-[0.08em] uppercase text-surface-500">PP</div>
        <div className="text-right font-orbitron font-bold text-surface-50 tabular-nums">
          {move.ppBase} <span className="text-xs text-surface-400 font-normal">({move.ppMax})</span>
        </div>
        <div className="font-jetbrains text-[10px] tracking-[0.08em] uppercase text-surface-500">Contacto</div>
        <div className="text-right text-sm text-surface-100">{move.makesContact ? "Sí" : "No"}</div>

        {isFullPage && (
          <>
            <div className="font-jetbrains text-[10px] tracking-[0.08em] uppercase text-surface-500">Nombre original</div>
            <div className="text-right text-sm text-surface-100">{move.attackName}</div>
          </>
        )}
      </div>

      {/* Effects */}
      {move.effects.length > 0 && (
        <div>
          <h3 className="font-orbitron font-semibold text-sm text-surface-50 mb-2">Efectos</h3>
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
            <div className="flex flex-col gap-1.5 text-sm text-surface-100">
              {move.effects.map((effect) => (
                <MoveEffect key={effect.effectTypeID + effect.type} effect={effect} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Targeting */}
      <div>
        <h3 className="font-orbitron font-semibold text-sm text-surface-50 mb-2">Alcance</h3>
        <MoveTargets targetInfo={move.targetingInfo} />
      </div>

      {/* Z-move info */}
      {isFullPage && move.z && move.z.length > 0 && (
        <div>
          <h3 className="font-orbitron font-semibold text-sm text-surface-50 mb-2">Información Z</h3>
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 grid grid-cols-2 gap-x-4 gap-y-2">
            <div className="font-jetbrains text-[10px] tracking-[0.08em] uppercase text-surface-500">Cristal Z</div>
            <div className="text-right text-sm text-surface-100">{move.z[0].crystal || "—"}</div>
            <div className="font-jetbrains text-[10px] tracking-[0.08em] uppercase text-surface-500">Nombre Z</div>
            <div className="text-right text-sm text-surface-100">{move.z[0].attackName || "—"}</div>
            <div className="font-jetbrains text-[10px] tracking-[0.08em] uppercase text-surface-500">Poder Z</div>
            <div className="text-right font-orbitron font-bold text-surface-50 tabular-nums">{move.z[0].basePower || "—"}</div>
          </div>
        </div>
      )}
    </div>
  )
}

function Cell({
  children,
  isActive,
  hitsAll,
}: {
  children: React.ReactNode
  isActive: boolean
  hitsAll?: boolean
}) {
  const bgColor = isActive && hitsAll ? "bg-red-500" : isActive ? "bg-primary-300" : "bg-white/[0.04]"
  const textColor = isActive ? "text-black" : "text-surface-100"
  const borderColor = isActive && hitsAll ? "border-red-500" : isActive ? "border-primary-300" : "border-white/[0.06]"

  return (
    <div
      className={`border ${borderColor} ${bgColor} ${textColor} flex items-center justify-center text-center p-1 text-[10px] font-medium rounded`}
    >
      {children}
    </div>
  )
}

function MoveTargets({
  targetInfo,
}: {
  targetInfo: {
    hitsAll: boolean
    hitsOppositeFoe: boolean
    hitsAdjacentFoe: boolean
    hitsExtendedFoe: boolean
    hitsSelf: boolean
    hitsAdjacentAlly: boolean
    hitsExtendedAlly: boolean
  }
}) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
      <div className="flex justify-center items-center mb-3">
        <HoverCard>
          <HoverCardTrigger>
            <div className="flex items-center gap-1 text-surface-400 hover:text-surface-100 cursor-pointer transition-colors">
              <InformationCircleIcon className="w-3.5 h-3.5" />
              <span className="text-xs">Información de alcance</span>
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="bg-surface-800 text-surface-50 w-64 border border-white/[0.06] rounded-lg z-50 p-3 text-sm shadow-xl">
            <div className="flex items-center mb-1.5">
              <div className="w-3 h-3 bg-white/[0.04] border border-white/[0.06] rounded mr-2" />
              <span className="text-xs text-surface-200">No alcanza al objetivo</span>
            </div>
            <div className="flex items-center mb-1.5">
              <div className="w-3 h-3 bg-primary-300 border border-primary-300 rounded mr-2" />
              <span className="text-xs text-surface-200">Alcanza al objetivo</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 border border-red-500 rounded mr-2" />
              <span className="text-xs text-surface-200">Alcanza a todos los objetivos</span>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
      <div className="grid grid-cols-3 grid-rows-2 gap-1 h-14 max-w-[300px] m-auto">
        <Cell isActive={targetInfo.hitsOppositeFoe} hitsAll={targetInfo.hitsAll}>
          Oponente
        </Cell>
        <Cell isActive={targetInfo.hitsAdjacentFoe} hitsAll={targetInfo.hitsAll}>
          Oponente
        </Cell>
        <Cell isActive={targetInfo.hitsExtendedFoe} hitsAll={targetInfo.hitsAll}>
          Oponente
        </Cell>
        <Cell isActive={targetInfo.hitsSelf} hitsAll={targetInfo.hitsAll}>
          Usuario
        </Cell>
        <Cell isActive={targetInfo.hitsAdjacentAlly} hitsAll={targetInfo.hitsAll}>
          Aliado
        </Cell>
        <Cell isActive={targetInfo.hitsExtendedAlly} hitsAll={targetInfo.hitsAll}>
          Aliado
        </Cell>
      </div>
    </div>
  )
}
