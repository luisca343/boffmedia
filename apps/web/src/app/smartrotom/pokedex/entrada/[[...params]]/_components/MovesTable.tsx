"use client"
import { LevelUpMove, Moves, Pokemon } from "@/types/Pokemon"
import Link from "next/link"
import { TypeChip } from "../../../_components/ui"
import { useTranslations } from "next-intl"
import { getTranslatedMoveName } from "@/utils/pokemonTranslations"
import { useMemo, useState } from "react"
import { MagnifyingGlassIcon, InformationCircleIcon } from "@heroicons/react/24/outline"

interface MoveEntry {
  key: string
  name: string
  type: string
  category: string
  power: number
  accuracy: number
  pp: number
  level?: number
  source: string
}

const CATEGORY_LABELS: Record<string, string> = { physical: "Físico", special: "Especial", status: "Estado" }
const CATEGORY_COLORS: Record<string, string> = { physical: "#fb923c", special: "#22d3ee", status: "#cdd7e3" }

// entry-move-row / entry-moves-header column template (handoff).
const GRID = "60px 1.5fr 100px 80px 60px 60px 60px 80px"

export function UnifiedMovesTable({ pokemon, formIndex, moveData }: { pokemon: Pokemon; formIndex: number; moveData: any }) {
  const t = useTranslations("pokedex")
  const [tab, setTab] = useState<"level" | "mt" | "egg" | "tutor">("level")
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const moves = (pokemon.forms[formIndex].moves || pokemon.forms[0].moves) as Moves | undefined

  const moveEntries = useMemo(() => {
    const entries: MoveEntry[] = []
    if (!moves) return entries
    const push = (moveName: string, source: string, level?: number) => {
      const data = moveData?.[moveName]
      if (!data) return
      entries.push({
        key: moveName,
        name: getTranslatedMoveName(moveName, t),
        type: data.type?.toLowerCase() || "normal",
        category: data.category?.toLowerCase() || "status",
        power: data.power || 0,
        accuracy: data.accuracy || 0,
        pp: data.pp || 0,
        level,
        source,
      })
    }

    moves.levelUpMoves?.forEach((lm: LevelUpMove) => lm.attacks.forEach((m: string) => push(m, "level", lm.level)))

    const tmKeys = ["tmMoves", "tmMoves8", "tmMoves7", "tmMoves6", "tmMoves5", "tmMoves4", "tmMoves3", "tmMoves2", "tmMoves1", "trMoves", "hmMoves"]
    tmKeys.forEach((key) => {
      const list = (moves as any)[key]
      if (Array.isArray(list)) {
        list.forEach((m: string) => {
          if (moveData?.[m] && !entries.find((e) => e.key === m && e.source === "mt")) push(m, "mt")
        })
      }
    })

    moves.eggMoves?.forEach((m: string) => push(m, "egg"))
    moves.tutorMoves?.forEach((m: string) => push(m, "tutor"))
    return entries
  }, [moves, moveData, t])

  const counts = useMemo(
    () => ({
      level: moveEntries.filter((m) => m.source === "level").length,
      mt: moveEntries.filter((m) => m.source === "mt").length,
      egg: moveEntries.filter((m) => m.source === "egg").length,
      tutor: moveEntries.filter((m) => m.source === "tutor").length,
    }),
    [moveEntries]
  )

  const availableTypes = useMemo(() => Array.from(new Set(moveEntries.map((m) => m.type))).sort(), [moveEntries])

  const filteredMoves = useMemo(() => {
    let list = moveEntries.filter((m) => m.source === tab)
    if (query.trim()) list = list.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
    if (typeFilter !== "all") list = list.filter((m) => m.type === typeFilter)
    if (tab === "level") list.sort((a, b) => (a.level || 0) - (b.level || 0))
    else list.sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [moveEntries, tab, query, typeFilter])

  if (!moves) return <div className="text-pk-surface-300 text-center py-4">Movimientos no disponibles</div>

  const TABS = [
    { id: "level" as const, label: "Por nivel", count: counts.level },
    { id: "mt" as const, label: "MT/MO", count: counts.mt },
    { id: "egg" as const, label: "Huevo", count: counts.egg },
    { id: "tutor" as const, label: "Tutor", count: counts.tutor },
  ]

  return (
    <div>
      <div className="flex gap-1 mb-3.5 border-b border-white/[0.05]">
        {TABS.map((tb) => {
          const isActive = tab === tb.id
          return (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              aria-current={isActive ? "page" : undefined}
              className={`px-3.5 py-2.5 text-[13px] font-medium cursor-pointer relative transition-colors whitespace-nowrap inline-flex items-center gap-1.5 ${
                isActive ? "text-pk-primary-300" : "text-pk-surface-400 hover:text-pk-surface-100"
              }`}
            >
              {tb.label}
              <span className="font-pk-mono text-[10px] text-pk-surface-500 bg-white/[0.05] px-1.5 py-px rounded-[3px]">{tb.count}</span>
              {isActive && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-pk-primary-400" />}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2.5 mb-3">
        <div className="relative flex-1 max-w-[300px]">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-pk-surface-500" />
          <input
            type="search"
            placeholder="Filtrar movimientos…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/[0.07] rounded-[7px] text-pk-surface-100 text-[12.5px] px-2.5 py-1.5 pl-8 outline-none focus:border-pk-primary-400/50"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-white/[0.03] border border-white/[0.07] rounded-[7px] text-pk-surface-100 text-[12.5px] px-2.5 py-1.5 outline-none focus:border-pk-primary-400/50"
        >
          <option value="all">Cualquier tipo</option>
          {availableTypes.map((type) => (
            <option key={type} value={type}>
              {t(`type_${type}` as any) || type}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[680px]">
          <div className="grid gap-2.5 px-3 py-2 font-pk-mono text-[10px] tracking-[0.08em] uppercase text-pk-surface-500 border-b border-white/[0.05]" style={{ gridTemplateColumns: GRID }}>
            <span>{tab === "level" ? "Nivel" : "Origen"}</span>
            <span>Movimiento</span>
            <span>Tipo</span>
            <span>Categoría</span>
            <span className="text-center">Pot.</span>
            <span className="text-center">Pre.</span>
            <span className="text-center">PP</span>
            <span className="text-center">Detalles</span>
          </div>

          {filteredMoves.length > 0 ? (
            filteredMoves.map((move, index) => (
              <Link
                key={`${move.key}-${index}`}
                href={`/smartrotom/pokedex/movimientos/${move.key}`}
                className="grid gap-2.5 px-3 py-2.5 rounded-lg items-center text-[13px] transition-colors odd:bg-white/[0.012] hover:bg-white/[0.03] odd:hover:bg-white/[0.04]"
                style={{ gridTemplateColumns: GRID }}
              >
                <span className="justify-self-start inline-flex items-center justify-center bg-white/[0.05] rounded-[5px] px-2 py-[3px] font-pk-mono text-[11px] text-pk-surface-200 font-semibold">
                  {tab === "level" ? move.level : "—"}
                </span>
                <span className="font-medium text-pk-surface-50">{move.name}</span>
                <span>
                  <TypeChip type={move.type} size="sm" />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em]" style={{ color: CATEGORY_COLORS[move.category] || "#cdd7e3" }}>
                  {CATEGORY_LABELS[move.category] || move.category}
                </span>
                <span className={`text-center font-pk-mono text-xs tabular-nums ${move.power >= 90 ? "text-pk-primary-300 font-semibold" : "text-pk-surface-300"}`}>
                  {move.power || "—"}
                </span>
                <span className="text-center font-pk-mono text-xs tabular-nums text-pk-surface-300">{move.accuracy || "—"}</span>
                <span className="text-center font-pk-mono text-xs tabular-nums text-pk-surface-300">{move.pp}</span>
                <span className="text-center">
                  <span className="w-[26px] h-[26px] inline-grid place-items-center rounded text-pk-surface-400">
                    <InformationCircleIcon className="w-3 h-3" />
                  </span>
                </span>
              </Link>
            ))
          ) : (
            <div className="py-[30px] text-center text-pk-surface-500">No hay movimientos con esos filtros.</div>
          )}
        </div>
      </div>
    </div>
  )
}
