"use client"
import { useGetPokemonByAbility } from "@/hooks/pokemon/useGetPokemonByAbility"
import { useTranslations } from "next-intl"
import { PokemonSpriteLink } from "../../_components/PokemonSprite"
import { StarIcon } from "lucide-react"

// Name + effect come from i18n (ability_* keys); carriers from the real API.
export function AbilityDetailPane({ abilityKey }: { abilityKey: string }) {
  const t = useTranslations("pokedex")
  const { pokemon } = useGetPokemonByAbility(abilityKey)
  const k = abilityKey.replace(/\s+/g, "")
  const carriers = (pokemon as any[]) ?? []

  return (
    <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-[18px_20px]">
      <div className="flex items-center gap-3 flex-wrap mb-3.5 pb-3 border-b border-white/[0.05]">
        <span className="font-pk-display font-bold text-lg text-pk-surface-50 tracking-tight">{t(`ability_${k}`)}</span>
        <span className="inline-flex items-center gap-1.5 px-2 py-[3px] text-[10px] font-bold tracking-[0.1em] uppercase text-pk-surface-400 bg-white/[0.04] rounded">
          <StarIcon className="w-2.5 h-2.5" />
          Habilidad
        </span>
      </div>

      <div className="text-[13px] leading-[1.6] text-pk-surface-200 bg-white/[0.02] border-l-[3px] border-pk-primary-500 p-[12px_14px] rounded-r-lg">
        {t(`ability_${k}_description`)}
      </div>

      {carriers.length > 0 && (
        <>
          <div className="flex items-center justify-between mt-3.5 mb-2.5">
            <span className="font-pk-mono text-[10.5px] tracking-[0.1em] uppercase text-pk-surface-500">Portadores</span>
            <span className="font-pk-mono text-xs text-pk-surface-100">{carriers.length}</span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-1.5">
            {carriers.slice(0, 12).map((p: any, i: number) => (
              <div key={`${p.speciesID}-${p.form}-${i}`} className="bg-white/[0.02] border border-white/[0.05] rounded-[9px] p-2 flex flex-col items-center gap-0.5">
                <PokemonSpriteLink id={p.speciesID} form={p.form || "base"} palette="none" width={44} height={44} hide={true} displayName={false} url={p.spriteUrl} />
                <span className="font-pk-mono text-[9px] text-pk-surface-500">#{String(p.speciesID).padStart(3, "0")}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
