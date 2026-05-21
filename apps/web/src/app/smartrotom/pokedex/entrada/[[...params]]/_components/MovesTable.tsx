"use client"
import { TableBody } from "@/components/ui/primitives/table"
import { LevelUpMove, Moves, Pokemon } from "@/types/Pokemon"
import PokedexTable, { PokedexCell, PokedexHead, PokedexHeader, PokedexRow } from "../../../_components/PokedexTable"
import { TypeChip } from "../../../_components/TypeChip"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/primitives/hover-card"
import MoveDataElement from "../../../movimientos/_components/MoveData"
import { useTranslations } from "next-intl"
import { InternalLink } from "@/components/ui/navigation/Link"
import { getTranslatedMoveName, getTranslatedMoveCategory } from "@/utils/pokemonTranslations"
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

export function UnifiedMovesTable({
  pokemon,
  formIndex,
  moveData,
}: {
  pokemon: Pokemon
  formIndex: number
  moveData: any
}) {
  const t = useTranslations("pokedex")
  const [tab, setTab] = useState<"level" | "mt" | "egg" | "tutor">("level")
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const moves = (pokemon.forms[formIndex].moves || pokemon.forms[0].moves) as Moves | undefined
  if (!moves) return <div className="text-surface-300 text-center py-4">Movimientos no encontrados</div>

  // Build move entries for each tab
  const moveEntries = useMemo(() => {
    const entries: MoveEntry[] = []

    // Level-up moves
    if (moves.levelUpMoves) {
      moves.levelUpMoves.forEach((levelMove: LevelUpMove) => {
        levelMove.attacks.forEach((moveName: string) => {
          if (moveData?.[moveName]) {
            const data = moveData[moveName]
            entries.push({
              key: moveName,
              name: getTranslatedMoveName(moveName, t),
              type: data.type?.toLowerCase() || "normal",
              category: data.category?.toLowerCase() || "status",
              power: data.power || 0,
              accuracy: data.accuracy || 0,
              pp: data.pp || 0,
              level: levelMove.level,
              source: "level",
            })
          }
        })
      })
    }

    // TM moves
    const tmKeys = ["tmMoves", "tmMoves8", "tmMoves7", "tmMoves6", "tmMoves5", "tmMoves4", "tmMoves3", "tmMoves2", "tmMoves1", "trMoves", "hmMoves"]
    tmKeys.forEach((key) => {
      const list = (moves as any)[key]
      if (Array.isArray(list)) {
        list.forEach((moveName: string) => {
          if (moveData?.[moveName] && !entries.find((e) => e.key === moveName && e.source === "mt")) {
            const data = moveData[moveName]
            entries.push({
              key: moveName,
              name: getTranslatedMoveName(moveName, t),
              type: data.type?.toLowerCase() || "normal",
              category: data.category?.toLowerCase() || "status",
              power: data.power || 0,
              accuracy: data.accuracy || 0,
              pp: data.pp || 0,
              source: "mt",
            })
          }
        })
      }
    })

    // Egg moves
    if (moves.eggMoves) {
      moves.eggMoves.forEach((moveName: string) => {
        if (moveData?.[moveName]) {
          const data = moveData[moveName]
          entries.push({
            key: moveName,
            name: getTranslatedMoveName(moveName, t),
            type: data.type?.toLowerCase() || "normal",
            category: data.category?.toLowerCase() || "status",
            power: data.power || 0,
            accuracy: data.accuracy || 0,
            pp: data.pp || 0,
            source: "egg",
          })
        }
      })
    }

    // Tutor moves
    if (moves.tutorMoves) {
      moves.tutorMoves.forEach((moveName: string) => {
        if (moveData?.[moveName]) {
          const data = moveData[moveName]
          entries.push({
            key: moveName,
            name: getTranslatedMoveName(moveName, t),
            type: data.type?.toLowerCase() || "normal",
            category: data.category?.toLowerCase() || "status",
            power: data.power || 0,
            accuracy: data.accuracy || 0,
            pp: data.pp || 0,
            source: "tutor",
          })
        }
      })
    }

    return entries
  }, [moves, moveData, t])

  // Count per tab
  const counts = useMemo(() => ({
    level: moveEntries.filter((m) => m.source === "level").length,
    mt: moveEntries.filter((m) => m.source === "mt").length,
    egg: moveEntries.filter((m) => m.source === "egg").length,
    tutor: moveEntries.filter((m) => m.source === "tutor").length,
  }), [moveEntries])

  // Available types for filter
  const availableTypes = useMemo(() => {
    const types = new Set(moveEntries.map((m) => m.type))
    return Array.from(types).sort()
  }, [moveEntries])

  // Filtered list
  const filteredMoves = useMemo(() => {
    let list = moveEntries.filter((m) => m.source === tab)
    if (query.trim()) {
      list = list.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
    }
    if (typeFilter !== "all") {
      list = list.filter((m) => m.type === typeFilter)
    }
    if (tab === "level") {
      list.sort((a, b) => (a.level || 0) - (b.level || 0))
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name))
    }
    return list
  }, [moveEntries, tab, query, typeFilter])

  const TABS = [
    { id: "level" as const, label: "Por nivel", count: counts.level },
    { id: "mt" as const, label: "MT/MO", count: counts.mt },
    { id: "egg" as const, label: "Huevo", count: counts.egg },
    { id: "tutor" as const, label: "Tutor", count: counts.tutor },
  ]

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-3.5 border-b border-white/[0.05]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-2.5 text-[13px] font-medium cursor-pointer relative transition-colors whitespace-nowrap inline-flex items-center gap-1.5 ${
              tab === t.id
                ? "text-primary-300"
                : "text-surface-400 hover:text-surface-100"
            }`}
          >
            {t.label}
            <span className="font-jetbrains text-[10px] text-surface-300 bg-white/[0.05] px-1.5 py-0.5 rounded">
              {t.count}
            </span>
            {tab === t.id && (
              <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-primary-400" />
            )}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="relative flex-1 max-w-[300px]">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-500" />
          <input
            type="search"
            placeholder="Filtrar movimientos…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/[0.07] rounded-[7px] text-surface-100 text-[12.5px] px-2.5 py-1.5 pl-8 outline-none focus:border-primary-400/50"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-white/[0.03] border border-white/[0.07] rounded-[7px] text-surface-100 text-[12.5px] px-2.5 py-1.5 outline-none focus:border-primary-400/50"
        >
          <option value="all">Cualquier tipo</option>
          {availableTypes.map((type) => (
            <option key={type} value={type}>
              {t(`type_${type}` as any) || type}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <PokedexTable>
          <PokedexHeader>
            <PokedexRow>
              <PokedexHead className="w-[60px] text-center">{tab === "level" ? "Nivel" : "Origen"}</PokedexHead>
              <PokedexHead className="min-w-[140px]">Movimiento</PokedexHead>
              <PokedexHead className="w-[100px] text-center">Tipo</PokedexHead>
              <PokedexHead className="w-[80px] text-center">Categoría</PokedexHead>
              <PokedexHead className="w-[60px] text-center">Pot.</PokedexHead>
              <PokedexHead className="w-[60px] text-center">Pre.</PokedexHead>
              <PokedexHead className="w-[60px] text-center">PP</PokedexHead>
              <PokedexHead className="w-[80px] text-center">Detalles</PokedexHead>
            </PokedexRow>
          </PokedexHeader>
          <TableBody>
            {filteredMoves.length > 0 ? (
              filteredMoves.map((move, index) => (
                <PokedexRow key={`${move.key}-${index}`}>
                  <PokedexCell>
                    <span className="inline-flex items-center justify-center bg-white/[0.05] rounded px-2 py-0.5 font-jetbrains text-[11px] text-surface-200 font-semibold">
                      {tab === "level" ? move.level : "—"}
                    </span>
                  </PokedexCell>
                  <PokedexCell className="font-medium text-surface-50">
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <InternalLink
                          href={`/smartrotom/pokedex/movimientos/${move.key}`}
                          className="hover:text-primary-400 transition-colors"
                        >
                          {move.name}
                        </InternalLink>
                      </HoverCardTrigger>
                      <HoverCardContent className="bg-surface-700 text-surface-50 w-[400px] border-surface-950 border font-normal z-50">
                        <MoveDataElement id={move.key} />
                      </HoverCardContent>
                    </HoverCard>
                  </PokedexCell>
                  <PokedexCell className="text-center">
                    <TypeChip type={move.type} size="sm" />
                  </PokedexCell>
                  <PokedexCell className="text-center">
                    <span
                      className="text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: CATEGORY_COLORS[move.category] || "var(--surface-300)" }}
                    >
                      {CATEGORY_LABELS[move.category] || move.category}
                    </span>
                  </PokedexCell>
                  <PokedexCell
                    className={`text-center font-jetbrains text-xs tabular-nums ${
                      move.power >= 90 ? "text-primary-300 font-semibold" : "text-surface-300"
                    }`}
                  >
                    {move.power || "—"}
                  </PokedexCell>
                  <PokedexCell className="text-center font-jetbrains text-xs tabular-nums text-surface-300">
                    {move.accuracy || "—"}
                  </PokedexCell>
                  <PokedexCell className="text-center font-jetbrains text-xs tabular-nums text-surface-300">
                    {move.pp}
                  </PokedexCell>
                  <PokedexCell className="text-center">
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <button className="w-6 h-6 grid place-items-center rounded hover:bg-white/[0.05] text-surface-400 hover:text-surface-100 transition-colors cursor-pointer">
                          <InformationCircleIcon className="w-3.5 h-3.5" />
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent className="bg-surface-700 text-surface-50 w-[400px] border-surface-950 border font-normal z-50">
                        <MoveDataElement id={move.key} />
                      </HoverCardContent>
                    </HoverCard>
                  </PokedexCell>
                </PokedexRow>
              ))
            ) : (
              <PokedexRow>
                <PokedexCell colSpan={8} className="text-center py-8 text-surface-500">
                  No hay movimientos con esos filtros.
                </PokedexCell>
              </PokedexRow>
            )}
          </TableBody>
        </PokedexTable>
      </div>
    </div>
  )
}

// Keep backward-compatible exports
export function MovesTable({ moves, sort = false, moveData, title }: { moves: Moves; sort?: boolean; moveData?: any; title?: string }) {
  return null
}

export function LevelMovesTable({ pokemon, formIndex, moveData }: { pokemon: Pokemon; formIndex: number; moveData: any }) {
  return <UnifiedMovesTable pokemon={pokemon} formIndex={formIndex} moveData={moveData} />
}

export function OtherMovesTable({ pokemon, formIndex, moveData }: { pokemon: Pokemon; formIndex: number; moveData: any }) {
  return null
}
