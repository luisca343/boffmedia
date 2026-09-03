"use client"
import { useGetMove } from "@/hooks/pokemon/useGetMove"
import { useGetPokemonByMove } from "@/hooks/pokemon/useGetPokemonByMove"
import { useTranslations } from "next-intl"
import { TypeChip } from "../../_components/ui"
import { PokemonSpriteLink } from "../../_components/PokemonSprite"
import { getTranslatedMoveName } from "@/utils/pokemonTranslations"

const CATEGORY_LABELS: Record<string, string> = { physical: "category_physical", special: "category_special", status: "category_status" }

export function MoveDetailPane({ moveKey }: { moveKey: string }) {
  const t = useTranslations("pokedex")
  const { move } = useGetMove(moveKey)
  const { pokemon } = useGetPokemonByMove(moveKey)

  if (!move) {
    return (
      <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-5 flex items-center justify-center h-40">
        <div className="animate-spin h-5 w-5 border-2 border-pk-primary-300 rounded-full border-t-transparent" />
      </div>
    )
  }

  const key = move.attackName.toLowerCase().replaceAll(" ", "_")
  const name = getTranslatedMoveName(move.attackName, t)
  const catKey = (move.attackCategory || "").toLowerCase()
  const typeKey = (move.attackType || "").toLowerCase()
  const learners = (pokemon as any[]) ?? []

  const stats = [
    { label: t("move_power"), value: move.basePower || "—" },
    { label: t("move_accuracy"), value: move.accuracy > 0 ? move.accuracy : "—" },
    { label: t("move_pp"), value: move.ppBase ?? "—" },
    { label: t("move_pokemon"), value: learners.length },
  ]

  return (
    <>
      <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-[18px_20px]">
        <div className="flex items-center gap-3 flex-wrap mb-3.5 pb-3 border-b border-white/[0.05]">
          <span className="font-pk-display font-bold text-lg text-pk-surface-50 tracking-tight">{name}</span>
          {typeKey && <TypeChip type={typeKey} size="md" />}
          <span className="ml-auto font-pk-mono text-[0.6875rem] text-pk-surface-500 tracking-[0.06em] uppercase">{t(CATEGORY_LABELS[catKey]) || move.attackCategory}</span>
        </div>

        <div className="grid grid-cols-4 gap-2.5 mb-3.5">
          {stats.map((s) => (
            <div key={s.label} className="bg-white/[0.02] border border-white/[0.04] rounded-[9px] p-[10px_12px]">
              <div className="font-pk-mono text-[0.59375rem] tracking-[0.1em] uppercase text-pk-surface-500 mb-1">{s.label}</div>
              <div className="text-base font-semibold text-pk-surface-50 tabular-nums">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="text-[0.8125rem] leading-[1.6] text-pk-surface-200 bg-white/[0.02] border-l-[3px] border-pk-primary-500 p-[12px_14px] rounded-r-lg">
          {t(`attack_${key}_description`)}
        </div>
      </div>

      {learners.length > 0 && (
        <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-[18px_20px]">
          <div className="flex items-center justify-between mb-2.5">
            <span className="font-pk-mono text-[0.65625rem] tracking-[0.1em] uppercase text-pk-surface-500">{t("move_learners")}</span>
            <span className="text-[0.6875rem] text-pk-surface-400 font-pk-mono">· {learners.length}</span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(4rem,1fr))] gap-1.5">
            {learners.slice(0, 12).map((p: any, i: number) => (
              <div key={`${p.speciesID}-${p.form}-${i}`} className="bg-white/[0.02] border border-white/[0.05] rounded-[9px] p-2 flex flex-col items-center gap-0.5">
                <PokemonSpriteLink id={p.speciesID} form={p.form || "base"} palette="none" width={44} height={44} hide={true} displayName={false} url={p.spriteUrl} />
                <span className="font-pk-mono text-[0.5625rem] text-pk-surface-500">#{String(p.speciesID).padStart(3, "0")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
