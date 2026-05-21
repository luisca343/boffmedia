"use client"
import { useTranslations } from "next-intl"
import { useGetAbility } from "@/hooks/pokemon/useGetAbility"
import { SparklesIcon, StarIcon } from "@heroicons/react/24/outline"

export default function AbilityDataElement({ id, isFullPage = false }: { id: string; isFullPage?: boolean }) {
  const t = useTranslations("pokedex")
  const { ability } = useGetAbility(id)

  if (!ability)
    return (
      <div className="flex justify-center items-center p-4">
        <div className="text-surface-100 text-sm animate-pulse">Cargando...</div>
      </div>
    )

  const abilityName = t(`ability_${ability.name.replace(/\s+/g, "")}`)
  const abilityDescription = t(`ability_${ability.name.replace(/\s+/g, "")}_description`)
  const isHidden = ability.isHidden

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      {!isFullPage && (
        <div>
          <span className="font-orbitron font-bold text-lg text-surface-50">{abilityName}</span>
        </div>
      )}

      {/* Standard/Hidden badge */}
      {isFullPage && isHidden !== undefined && (
        <div>
          <span
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold tracking-[0.1em] uppercase"
            style={{
              color: isHidden ? "rgb(var(--accent-300))" : "rgb(var(--surface-200))",
              background: isHidden ? "rgba(168,85,247,0.12)" : "rgba(255,255,255,0.04)",
            }}
          >
            {isHidden ? <SparklesIcon className="w-3 h-3" /> : <StarIcon className="w-3 h-3" />}
            {isHidden ? "Habilidad oculta" : "Habilidad estándar"}
          </span>
        </div>
      )}

      {/* Effect description */}
      <div
        className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4"
        style={isHidden && isFullPage ? { borderLeftColor: "var(--accent-500)", borderLeftWidth: 3 } : undefined}
      >
        <div className="flex items-start gap-3">
          <SparklesIcon
            className="w-4 h-4 mt-0.5 shrink-0"
            style={{ color: isHidden ? "var(--accent-300)" : "var(--primary-300)" }}
          />
          <div>
            <h3 className="font-orbitron font-semibold text-sm text-surface-50 mb-2">Efecto</h3>
            <p className="text-[14px] leading-[1.6] text-surface-100">{abilityDescription}</p>
          </div>
        </div>
      </div>

      {/* Non-fullpage hidden badge */}
      {!isFullPage && isHidden !== undefined && (
        <div className="flex items-center pt-2 border-t border-white/[0.05]">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold tracking-[0.1em] uppercase"
            style={{
              color: isHidden ? "rgb(var(--accent-300))" : "rgb(var(--surface-200))",
              background: isHidden ? "rgba(168,85,247,0.12)" : "rgba(255,255,255,0.04)",
            }}
          >
            {isHidden ? <SparklesIcon className="w-3 h-3" /> : <StarIcon className="w-3 h-3" />}
            {isHidden ? "Habilidad oculta" : "Habilidad estándar"}
          </span>
        </div>
      )}
    </div>
  )
}
