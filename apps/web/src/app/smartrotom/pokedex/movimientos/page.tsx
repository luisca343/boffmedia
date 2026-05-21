"use client"
import { useTranslations } from "next-intl"
import { useGetAllMoves } from "@/hooks/pokemon/useGetAllMoves"
import { useGetMove } from "@/hooks/pokemon/useGetMove"
import type { MoveCount } from "@/services/api/smartrotom/pokemonService"
import { MagnifyingGlassIcon, BoltIcon, InformationCircleIcon } from "@heroicons/react/24/outline"
import { useState, useMemo } from "react"
import { HubSidebar } from "../_components/HubSidebar"
import { TypeChip } from "../_components/TypeChip"
import { TypeGlyph } from "../_components/TypeChip"
import { MoveEffect } from "./_components/MoveEffect"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/primitives/hover-card"
import { getTranslatedMoveName } from "@/utils/pokemonTranslations"
import { useGetPokemonByMove } from "@/hooks/pokemon/useGetPokemonByMove"
import { PokemonSpriteLink } from "../_components/PokemonSprite"


const CATEGORY_LABELS: Record<string, string> = {
  physical: "Físico",
  special: "Especial",
  status: "Estado",
  PHYSICAL: "Físico",
  SPECIAL: "Especial",
  STATUS: "Estado",
}

const CATEGORY_COLORS: Record<string, string> = {
  physical: "#fb923c",
  special: "#22d3ee",
  status: "#94a3b8",
  PHYSICAL: "#fb923c",
  SPECIAL: "#22d3ee",
  STATUS: "#94a3b8",
}

const TYPE_COLORS: Record<string, string> = {
  normal: "#9fa19f", fire: "#e62829", water: "#2980ef", grass: "#3fa129",
  electric: "#fac000", ice: "#3fd8ff", fighting: "#ff8000", poison: "#9141cb",
  ground: "#d6985c", flying: "#81b9ef", psychic: "#ef4179", bug: "#91a119",
  rock: "#afa981", ghost: "#704170", dragon: "#5061e1", dark: "#50413f",
  steel: "#60a1b8", fairy: "#ef71ef",
}

function MoveDetailCard({ moveName, t }: { moveName: string; t: any }) {
  const { move } = useGetMove(moveName)
  const { pokemon } = useGetPokemonByMove(moveName)
  const [showAll, setShowAll] = useState(false)

  if (!move) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-5 w-5 border-2 border-primary-300 rounded-full border-t-transparent" />
      </div>
    )
  }

  const name = getTranslatedMoveName(move.attackName, t)
  const catKey = move.attackCategory.toLowerCase()
  const typeKey = move.attackType.toLowerCase()
  const displayLimit = 10
  const displayPokemon = showAll ? (pokemon || []) : (pokemon?.slice(0, displayLimit) || [])

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="font-orbitron font-bold text-lg text-surface-50">{name}</span>
        <TypeChip type={typeKey} size="md" />
        <span
          className="ml-auto font-jetbrains text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: CATEGORY_COLORS[catKey] || "rgb(var(--surface-300))" }}
        >
          {CATEGORY_LABELS[catKey] || move.attackCategory}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
        {move.basePower > 0 && (
          <div>
            <div className="font-jetbrains text-[10px] tracking-[0.08em] uppercase text-surface-500 mb-0.5">Poder</div>
            <div className="font-orbitron font-bold text-surface-50 tabular-nums">{move.basePower}</div>
          </div>
        )}
        {move.accuracy > 0 && (
          <div>
            <div className="font-jetbrains text-[10px] tracking-[0.08em] uppercase text-surface-500 mb-0.5">Precisión</div>
            <div className="font-orbitron font-bold text-surface-50 tabular-nums">{move.accuracy}</div>
          </div>
        )}
        <div>
          <div className="font-jetbrains text-[10px] tracking-[0.08em] uppercase text-surface-500 mb-0.5">PP</div>
          <div className="font-orbitron font-bold text-surface-50 tabular-nums">{move.ppBase}</div>
        </div>
        <div>
          <div className="font-jetbrains text-[10px] tracking-[0.08em] uppercase text-surface-500 mb-0.5">Pokémon</div>
          <div className="font-orbitron font-bold text-surface-50 tabular-nums">{pokemon?.length || 0}</div>
        </div>
      </div>

      {/* Effects */}
      {move.effects && move.effects.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
          <h3 className="font-orbitron font-semibold text-sm text-surface-50 mb-2">Efectos</h3>
          <div className="flex flex-col gap-1 text-sm text-surface-100">
            {move.effects.map((effect: any) => (
              <MoveEffect key={effect.effectTypeID + effect.type} effect={effect} />
            ))}
          </div>
        </div>
      )}

      {/* Targeting */}
      {move.targetingInfo && (
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
          <h3 className="font-orbitron font-semibold text-sm text-surface-50 mb-3">Alcance</h3>
          <MoveTargets targetInfo={move.targetingInfo} />
        </div>
      )}

      {/* Pokémon that learn this move */}
      {pokemon && pokemon.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-jetbrains text-[10.5px] tracking-[0.1em] uppercase text-surface-500">
              Pokémon que lo aprenden
            </span>
            <span className="font-jetbrains text-xs text-surface-400">
              · {pokemon.length}
            </span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-1.5">
            {displayPokemon.map((poke) => (
              <div
                key={poke.speciesID + poke.form}
                className="bg-white/[0.02] border border-white/[0.05] rounded-[9px] p-1.5 flex flex-col items-center gap-0.5 cursor-pointer transition-all hover:-translate-y-px hover:border-primary-400/20"
              >
                <PokemonSpriteLink
                  id={poke.speciesID}
                  form={poke.form}
                  palette="none"
                  width={40}
                  height={40}
                  hide={true}
                  url={poke.spriteUrl}
                />
                <span className="font-jetbrains text-[9px] text-surface-500">
                  #{String(poke.speciesID).padStart(3, "0")}
                </span>
              </div>
            ))}
          </div>
          {pokemon.length > displayLimit && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-3 w-full bg-white/[0.03] border border-white/[0.06] text-surface-200 py-2 px-3 rounded-lg text-[12.5px] font-medium text-center hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              {showAll ? "Mostrar menos" : `Ver todos (${pokemon.length}) →`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function Cell({ children, isActive, hitsAll }: { children: React.ReactNode; isActive: boolean; hitsAll?: boolean }) {
  const bgColor = isActive && hitsAll ? "bg-red-500" : isActive ? "bg-primary-300" : "bg-white/[0.04]"
  const textColor = isActive ? "text-black" : "text-surface-100"
  const borderColor = isActive && hitsAll ? "border-red-500" : isActive ? "border-primary-300" : "border-white/[0.06]"
  return (
    <div className={`border ${borderColor} ${bgColor} ${textColor} flex items-center justify-center text-center p-1 text-[10px] font-medium rounded`}>
      {children}
    </div>
  )
}

function MoveTargets({ targetInfo }: { targetInfo: any }) {
  return (
    <div>
      <div className="flex justify-center items-center mb-2">
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
              <span className="text-xs text-surface-200">Alcanza a todos</span>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
      <div className="grid grid-cols-3 grid-rows-2 gap-1 h-14 max-w-[240px] m-auto">
        <Cell isActive={targetInfo.hitsOppositeFoe} hitsAll={targetInfo.hitsAll}>Oponente</Cell>
        <Cell isActive={targetInfo.hitsAdjacentFoe} hitsAll={targetInfo.hitsAll}>Oponente</Cell>
        <Cell isActive={targetInfo.hitsExtendedFoe} hitsAll={targetInfo.hitsAll}>Oponente</Cell>
        <Cell isActive={targetInfo.hitsSelf} hitsAll={targetInfo.hitsAll}>Usuario</Cell>
        <Cell isActive={targetInfo.hitsAdjacentAlly} hitsAll={targetInfo.hitsAll}>Aliado</Cell>
        <Cell isActive={targetInfo.hitsExtendedAlly} hitsAll={targetInfo.hitsAll}>Aliado</Cell>
      </div>
    </div>
  )
}

export default function Movimientos() {
  const { moves } = useGetAllMoves()
  const t = useTranslations("pokedex")
  const [searchQuery, setSearchQuery] = useState("")
  const [catFilter, setCatFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedMove, setSelectedMove] = useState<string | null>(null)

  const pokemonTypes = [
    "normal", "fire", "water", "electric", "grass", "ice", "fighting",
    "poison", "ground", "flying", "psychic", "bug", "rock", "ghost",
    "dragon", "dark", "steel", "fairy",
  ]

  const filteredMoves = useMemo(() => {
    if (!moves) return []
    return moves.filter((move) => {
      const name = t(`attack_${move.name.toLowerCase().replaceAll(" ", "_")}`)
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || move.name.toLowerCase().includes(searchQuery.toLowerCase())
      const moveType = (move.attackType || "").toLowerCase()
      const moveCat = (move.attackCategory || "").toLowerCase()
      const matchesCat = catFilter === "all" || moveCat === catFilter
      const matchesType = typeFilter === "all" || moveType === typeFilter
      return matchesSearch && matchesCat && matchesType
    })
  }, [moves, searchQuery, catFilter, typeFilter, t])

  if (!moves)
    return (
      <div className="flex h-full bg-surface-950">
        <HubSidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-primary-300 rounded-full border-t-transparent" />
            <div className="text-surface-100 text-xl font-orbitron">Cargando movimientos...</div>
          </div>
        </main>
      </div>
    )

  const maxCount = Math.max(...moves.map((m) => m.count), 1)

  return (
    <div className="flex h-full bg-surface-950">
      <HubSidebar />
      <main className="flex-1 min-w-0 flex flex-col overflow-auto">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/[0.05]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="icon w-5 h-5 rounded bg-primary-400/[0.12] text-primary-300 grid place-items-center">
                  <BoltIcon className="w-3 h-3" />
                </span>
                <span className="font-jetbrains text-[10.5px] tracking-[0.12em] uppercase text-surface-500">
                  01 · Referencia
                </span>
              </div>
              <h1 className="font-orbitron font-bold text-[28px] tracking-tight text-surface-50">
                {t("moves_title")}
              </h1>
              <p className="text-surface-400 text-sm mt-1 max-w-[600px]">
                {moves.length} movimientos disponibles. Filtra por tipo o categoría, abre cualquier ficha para ver poder, precisión, efectos y la lista de Pokémon que lo aprenden.
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-surface-400 font-jetbrains">
              <span>
                Total<b className="ml-1 text-surface-100">{moves.length}</b>
              </span>
              <span>
                Resultados<b className="ml-1 text-surface-100">{filteredMoves.length}</b>
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-6 pb-0 flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              type="search"
              placeholder="Buscar por nombre, efecto o tipo…"
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-[10px] py-2.5 pr-3 pl-9 text-[13px] text-surface-50 outline-none placeholder:text-surface-500 focus:border-primary-400/50 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "Todas" },
              { id: "physical", label: "Físico", color: "#fb923c" },
              { id: "special", label: "Especial", color: "#22d3ee" },
              { id: "status", label: "Estado" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCatFilter(cat.id)}
                className="px-3 py-1.5 rounded-full text-[11.5px] font-medium transition-colors cursor-pointer border"
                style={
                  catFilter === cat.id
                    ? { background: "rgba(249,115,22,0.14)", color: cat.color || "rgb(var(--primary-200))", borderColor: "rgba(249,115,22,0.35)" }
                    : { background: "rgba(255,255,255,0.03)", color: "rgb(var(--surface-200))", borderColor: "rgba(255,255,255,0.07)" }
                }
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setTypeFilter("all")}
              className="px-2.5 py-1.5 rounded-full text-[11.5px] font-medium transition-colors cursor-pointer border"
              style={
                typeFilter === "all"
                  ? { background: "rgba(249,115,22,0.14)", color: "rgb(var(--primary-200))", borderColor: "rgba(249,115,22,0.35)" }
                  : { background: "rgba(255,255,255,0.03)", color: "rgb(var(--surface-200))", borderColor: "rgba(255,255,255,0.07)" }
              }
            >
              Cualquier tipo
            </button>
            {pokemonTypes.map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className="px-2.5 py-1.5 rounded-full text-[11.5px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 border"
                style={
                  typeFilter === type
                    ? { background: "rgba(249,115,22,0.14)", color: "rgb(var(--primary-200))", borderColor: "rgba(249,115,22,0.35)" }
                    : { background: "rgba(255,255,255,0.03)", color: "rgb(var(--surface-200))", borderColor: "rgba(255,255,255,0.07)" }
                }
              >
                <span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS[type] }} />
                {t(`type_${type}` as any)}
              </button>
            ))}
          </div>
        </div>

        {/* Content: list + detail */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-[18px] items-start">
            {/* List */}
            <div className="flex flex-col border border-white/[0.05] rounded-xl overflow-hidden bg-white/[0.012]">
              {filteredMoves.length > 0 ? (
                filteredMoves.map((move: MoveCount) => {
                  const isSelected = selectedMove === move.name
                  const moveName = t(`attack_${move.name.toLowerCase().replaceAll(" ", "_")}`)
                  const typeKey = (move.attackType || "").toLowerCase()
                  const catKey = (move.attackCategory || "").toLowerCase()
                  const power = move.basePower || 0

                  return (
                    <button
                      key={move.name}
                      onClick={() => setSelectedMove(move.name)}
                      className="grid grid-cols-[36px_1fr_80px_100px_56px_80px] items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-b-0 transition-colors cursor-pointer text-left"
                      style={
                        isSelected
                          ? { background: "rgba(249,115,22,0.08)", boxShadow: "inset 0 0 0 1px rgba(249,115,22,0.25)" }
                          : { background: "transparent" }
                      }
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.03)"
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "transparent"
                      }}
                    >
                      {/* Type icon */}
                      <div
                        className="w-8 h-8 grid place-items-center rounded-lg"
                        style={{
                          background: typeKey ? `${TYPE_COLORS[typeKey]}22` : "rgba(255,255,255,0.04)",
                          color: typeKey ? TYPE_COLORS[typeKey] : "rgb(var(--surface-300))",
                        }}
                      >
                        {typeKey ? <TypeGlyph type={typeKey} size={14} /> : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                            <path d="m13 2-9 13h7l-2 7 9-13h-7l2-7Z" />
                          </svg>
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-semibold text-surface-50 tracking-tight">{moveName}</span>
                        <span className="text-xs text-surface-400 line-clamp-1">{move.name}</span>
                      </div>

                      {/* Type chip */}
                      {typeKey ? <TypeChip type={typeKey} size="sm" /> : <span />}

                      {/* Category */}
                      <span
                        className="text-[11px] font-semibold uppercase tracking-wider text-center"
                        style={{ color: CATEGORY_COLORS[catKey] || "rgb(var(--surface-400))" }}
                      >
                        {CATEGORY_LABELS[catKey] || "—"}
                      </span>

                      {/* Power */}
                      <span
                        className="font-jetbrains text-xs font-semibold tabular-nums text-center"
                        style={{ color: power >= 90 ? "rgb(var(--primary-300))" : "rgb(var(--surface-300))" }}
                      >
                        {power || "—"}
                      </span>

                      {/* Count bar + number */}
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-[60px] h-1 bg-white/[0.04] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-400 rounded-full"
                            style={{ width: `${(move.count / maxCount) * 100}%` }}
                          />
                        </div>
                        <span className="font-jetbrains text-xs font-semibold text-amber-400 tabular-nums min-w-[36px] text-right">
                          {move.count}
                        </span>
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="p-8 text-center text-surface-400">No hay movimientos que coincidan con los filtros.</div>
              )}
            </div>

            {/* Detail card */}
            <div className="sticky top-6">
              {selectedMove ? (
                <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-5 max-h-[calc(100vh-3rem)] overflow-y-auto">
                  <MoveDetailCard moveName={selectedMove} t={t} />
                </div>
              ) : (
                <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-8 text-center">
                  <BoltIcon className="w-8 h-8 mx-auto text-surface-500 mb-3" />
                  <p className="text-surface-400 text-sm">Selecciona un movimiento para ver sus detalles</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
