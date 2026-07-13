"use client"
import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import { useGetAllMoves } from "@/hooks/pokemon/useGetAllMoves"
import { ScreenShell } from "../_components/ScreenShell"
import { PageHead, MetaStat } from "../_components/PageHead"
import { MoveDetailPane } from "./_components/MoveDetailPane"
import { getTranslatedMoveName } from "@/utils/pokemonTranslations"
import { ZapIcon, SearchIcon } from "lucide-react"

export default function MovimientosPage() {
  const t = useTranslations("pokedex")
  const { moves, isLoading } = useGetAllMoves()
  const [q, setQ] = useState("")
  const [selected, setSelected] = useState<string | null>(null)

  const list = useMemo(() => {
    const all = moves ?? []
    const filtered = q.trim()
      ? all.filter((m) => getTranslatedMoveName(m.name, t).toLowerCase().includes(q.toLowerCase()) || m.name.toLowerCase().includes(q.toLowerCase()))
      : all
    return [...filtered].sort((a, b) => b.count - a.count)
  }, [moves, q, t])

  const maxCount = useMemo(() => Math.max(1, ...(moves ?? []).map((m) => m.count)), [moves])
  const activeKey = selected ?? list[0]?.name ?? null

  return (
    <ScreenShell>
      <PageHead
        icon={ZapIcon}
        eyebrow="Referencia"
        title="Movimientos"
        desc="Ordenados por popularidad. Busca por nombre y abre cualquier movimiento para ver poder, precisión, efecto y los Pokémon que lo aprenden."
        meta={
          <>
            <MetaStat label="Total" value={moves?.length ?? 0} />
            <MetaStat label="Resultados" value={list.length} />
          </>
        }
      />

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pk-surface-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre…"
          className="w-full bg-white/[0.03] border border-white/[0.07] rounded-[10px] py-2.5 pr-3.5 pl-10 text-[13.5px] text-pk-surface-50 outline-none placeholder:text-pk-surface-500 focus:border-pk-primary-400/50 focus:bg-white/[0.05] focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-[18px] items-start">
        <div className="flex flex-col border border-white/[0.05] rounded-xl overflow-hidden bg-white/[0.012]">
          {isLoading ? (
            <div className="p-8 text-center text-pk-surface-500 text-sm">Cargando movimientos…</div>
          ) : list.length ? (
            list.map((m) => {
              const active = activeKey === m.name
              return (
                <button
                  key={m.name}
                  onClick={() => setSelected(m.name)}
                  className="grid gap-3.5 items-center px-4 py-3 border-b border-white/[0.04] last:border-0 text-left w-full transition-colors hover:bg-white/[0.03]"
                  style={{ gridTemplateColumns: "36px 1fr 120px", ...(active ? { background: "rgba(249,115,22,.08)", boxShadow: "inset 0 0 0 1px rgba(249,115,22,.25)" } : {}) }}
                >
                  <span className="w-8 h-8 grid place-items-center rounded-lg bg-white/[0.04] text-pk-surface-300">
                    <ZapIcon className="w-3.5 h-3.5" />
                  </span>
                  <span className="flex flex-col gap-[3px] min-w-0">
                    <span className="text-sm font-semibold text-pk-surface-50 truncate">{getTranslatedMoveName(m.name, t)}</span>
                    <span className="text-[11px] text-pk-surface-500 font-pk-mono truncate">{m.name}</span>
                  </span>
                  <span className="flex items-center gap-2 justify-end">
                    <span className="w-[60px] h-1 bg-white/[0.04] rounded-full overflow-hidden">
                      <span className="block h-full bg-pk-primary-400 rounded-full" style={{ width: `${(m.count / maxCount) * 100}%` }} />
                    </span>
                    <span className="font-pk-mono text-xs text-pk-surface-100 tabular-nums font-semibold min-w-[36px] text-right">{m.count}</span>
                  </span>
                </button>
              )
            })
          ) : (
            <div className="p-[30px] text-center text-pk-surface-500 text-[13px]">No hay movimientos que coincidan con la búsqueda.</div>
          )}
        </div>

        <aside className="xl:sticky xl:top-4 flex flex-col gap-3.5">{activeKey && <MoveDetailPane moveKey={activeKey} />}</aside>
      </div>
    </ScreenShell>
  )
}
