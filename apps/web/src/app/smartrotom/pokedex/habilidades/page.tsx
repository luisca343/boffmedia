"use client"
import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import { useGetAllAbilities } from "@/hooks/pokemon/useGetAllAbilities"
import { ScreenShell } from "../_components/ScreenShell"
import { PageHead, MetaStat } from "../_components/PageHead"
import { AbilityDetailPane } from "./_components/AbilityDetailPane"
import { SparklesIcon, MagnifyingGlassIcon, StarIcon } from "@heroicons/react/24/outline"

export default function HabilidadesPage() {
  const t = useTranslations("pokedex")
  const { abilities, isLoading } = useGetAllAbilities()
  const [q, setQ] = useState("")
  const [selected, setSelected] = useState<string | null>(null)

  const nameOf = (a: { name: string }) => t(`ability_${a.name.replace(/\s+/g, "")}`)
  const descOf = (a: { name: string }) => t(`ability_${a.name.replace(/\s+/g, "")}_description`)

  const list = useMemo(() => {
    const all = abilities ?? []
    const term = q.trim().toLowerCase()
    const filtered = term
      ? all.filter((a) => nameOf(a).toLowerCase().includes(term) || descOf(a).toLowerCase().includes(term) || a.name.toLowerCase().includes(term))
      : all
    return [...filtered].sort((a, b) => b.count - a.count)
  }, [abilities, q, t])

  const maxCount = useMemo(() => Math.max(1, ...(abilities ?? []).map((a) => a.count)), [abilities])
  const activeKey = selected ?? list[0]?.name ?? null

  return (
    <ScreenShell>
      <PageHead
        icon={SparklesIcon}
        eyebrow="Referencia"
        title="Habilidades"
        desc="Ordenadas por popularidad. Busca por nombre o efecto y abre cualquier habilidad para ver su descripción y los Pokémon que la portan."
        meta={
          <>
            <MetaStat label="Total" value={abilities?.length ?? 0} />
            <MetaStat label="Resultados" value={list.length} />
          </>
        }
      />

      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pk-surface-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o efecto…"
          className="w-full bg-white/[0.03] border border-white/[0.07] rounded-[10px] py-2.5 pr-3.5 pl-10 text-[13.5px] text-pk-surface-50 outline-none placeholder:text-pk-surface-500 focus:border-pk-primary-400/50 focus:bg-white/[0.05] focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-[18px] items-start">
        <div className="flex flex-col border border-white/[0.05] rounded-xl overflow-hidden bg-white/[0.012]">
          {isLoading ? (
            <div className="p-8 text-center text-pk-surface-500 text-sm">Cargando habilidades…</div>
          ) : list.length ? (
            list.map((a) => {
              const active = activeKey === a.name
              return (
                <button
                  key={a.name}
                  onClick={() => setSelected(a.name)}
                  className="grid gap-3.5 items-center px-4 py-3 border-b border-white/[0.04] last:border-0 text-left w-full transition-colors hover:bg-white/[0.03]"
                  style={{ gridTemplateColumns: "36px 1fr 120px", ...(active ? { background: "rgba(249,115,22,.08)", boxShadow: "inset 0 0 0 1px rgba(249,115,22,.25)" } : {}) }}
                >
                  <span className="w-8 h-8 grid place-items-center rounded-lg bg-white/[0.04] text-pk-surface-300">
                    <StarIcon className="w-3.5 h-3.5" />
                  </span>
                  <span className="flex flex-col gap-[3px] min-w-0">
                    <span className="text-sm font-semibold text-pk-surface-50 truncate">{nameOf(a)}</span>
                    <span className="text-xs text-pk-surface-400 truncate">{descOf(a)}</span>
                  </span>
                  <span className="flex items-center gap-2 justify-end">
                    <span className="w-[60px] h-1 bg-white/[0.04] rounded-full overflow-hidden">
                      <span className="block h-full bg-pk-primary-400 rounded-full" style={{ width: `${(a.count / maxCount) * 100}%` }} />
                    </span>
                    <span className="font-pk-mono text-xs text-pk-surface-100 tabular-nums font-semibold min-w-[36px] text-right">{a.count}</span>
                  </span>
                </button>
              )
            })
          ) : (
            <div className="p-[30px] text-center text-pk-surface-500 text-[13px]">No hay habilidades que coincidan con la búsqueda.</div>
          )}
        </div>

        <aside className="xl:sticky xl:top-4 flex flex-col gap-3.5">{activeKey && <AbilityDetailPane abilityKey={activeKey} />}</aside>
      </div>
    </ScreenShell>
  )
}
