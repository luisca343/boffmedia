"use client"

import { useCallback, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { PokemonW } from "@boffmedia/shared"
import { PcMarksService } from "@/services/api/smartrotom/pcMarksService"
import { wingullPOSTOrThrow } from "@/services/boffAPI"
import { useBoffSession } from "@/services/useBoffSession"
import type { BattleTeamData } from "@/types/dto/battle-team.dto"
import type { ExtendedPokemonW, PCPokemon } from "@/types/dto/pc-pokemon.dto"
import type { Mon, SlotLoc } from "../_types/pc.types"
import { PARTY_SIZE, TOTAL_BOXES } from "../_utils/constants"
import type { PcMarkMap, PcMarkState } from "../_utils/marks"
import { pokemonKey } from "../_utils/pokemonKey"

/** The party is box -1 — the game server's own convention, which `/pc/move` speaks. */
const PARTY_BOX = -1

/** The SmartRotom uuid every PC endpoint is keyed by. `null` until signed in. */
export function usePcUuid(): string | null {
  const { session } = useBoffSession()
  return session?.user?.smartRotomUser?.uuid ?? null
}

export const pcKeys = {
  pc: (uuid: string) => ["pc", "boxes", uuid] as const,
  party: (uuid: string) => ["pc", "party", uuid] as const,
  battleTeams: (uuid: string) => ["pc", "battle-teams", uuid] as const,
  marks: (uuid: string) => ["pc", "marks", uuid] as const,
}

// ── Reads ────────────────────────────────────────────────────────────────────

/** Every Pokémon in storage. The server sends only occupied slots. */
export function usePcBoxes() {
  const uuid = usePcUuid()
  return useQuery({
    queryKey: pcKeys.pc(uuid ?? ""),
    queryFn: () => wingullPOSTOrThrow<PCPokemon[]>("/pc", { uuid: uuid! }),
    enabled: Boolean(uuid),
  })
}

/** The live in-game party. Always six slots; empty ones come back null. */
export function useParty() {
  const uuid = usePcUuid()
  return useQuery({
    queryKey: pcKeys.party(uuid ?? ""),
    queryFn: async () => {
      const team = await wingullPOSTOrThrow<PokemonW[]>("/team", { uuid: uuid! })
      return padParty(team as ExtendedPokemonW[])
    },
    enabled: Boolean(uuid),
  })
}

export function useBattleTeams() {
  const uuid = usePcUuid()
  return useQuery({
    queryKey: pcKeys.battleTeams(uuid ?? ""),
    queryFn: () => wingullPOSTOrThrow<BattleTeamData>("/battleteams", { uuid: uuid! }),
    enabled: Boolean(uuid),
  })
}

/** Favourites + tags. Ours, not the game's — see `_utils/pokemonKey.ts`. */
export function useMarks() {
  const uuid = usePcUuid()
  return useQuery({
    queryKey: pcKeys.marks(uuid ?? ""),
    queryFn: async () => {
      const rows = await PcMarksService.getMarks(uuid!)
      const map: PcMarkMap = {}
      for (const r of rows) {
        map[r.pokemonKey] = { favorite: !!r.favorite, tags: Array.isArray(r.tags) ? r.tags : [] }
      }
      return map
    },
    enabled: Boolean(uuid),
  })
}

const padParty = (team: ExtendedPokemonW[]): (ExtendedPokemonW | null)[] =>
  Array.from({ length: PARTY_SIZE }, (_, i) => team[i] ?? null)

// ── The flat view every surface actually consumes ─────────────────────────────

/**
 * Storage and party, flattened into one addressable list. The grid, the drag layer,
 * the filters and the detail drawer all work in `Mon`s so they never have to care
 * which of the two payloads a Pokémon came from.
 */
export function useMons(): {
  mons: Mon[]
  byKey: Map<string, Mon>
  isLoading: boolean
  /** Fatal: storage itself is unreachable, so there is no app to show. */
  error: Error | null
  /**
   * Not fatal: the party call failed but storage answered. The game server 500s on
   * `/team` for a trainer who has never had one, and a dead party panel is no reason
   * to blank out 900 Pokémon — so this is surfaced next to the party, not over the app.
   */
  partyError: Error | null
} {
  const pc = usePcBoxes()
  const party = useParty()

  return useMemo(() => {
    const mons: Mon[] = []
    for (const entry of pc.data ?? []) {
      if (!entry?.pokemon) continue
      mons.push({
        pokemon: entry.pokemon,
        loc: { kind: "box", box: entry.box, index: entry.index },
        key: pokemonKey(entry.pokemon),
      })
    }
    ;(party.data ?? []).forEach((p, i) => {
      if (!p) return
      mons.push({ pokemon: p, loc: { kind: "party", index: i }, key: pokemonKey(p) })
    })

    // Two identical clones hash to one key; the map keeps the first, which is all
    // the detail drawer needs to resolve a click back to a Pokémon.
    const byKey = new Map<string, Mon>()
    for (const m of mons) if (!byKey.has(m.key)) byKey.set(m.key, m)

    return {
      mons,
      byKey,
      // `isLoading`, not `isPending`: a query that has errored is no longer loading (so
      // the boot screen gives way instead of spinning at 75% forever), and a query
      // disabled for want of a uuid never claims to be loading at all.
      isLoading: pc.isLoading || party.isLoading,
      error: (pc.error as Error | null) ?? null,
      partyError: (party.error as Error | null) ?? null,
    }
  }, [pc.data, party.data, pc.isPending, party.isPending, pc.error, party.error])
}

/** The 30 boxes, materialised as fixed 30-slot grids. Boxes are pure derivation. */
export function useBoxGrid(mons: Mon[]): (Mon | null)[][] {
  return useMemo(() => {
    const boxes: (Mon | null)[][] = Array.from({ length: TOTAL_BOXES }, () =>
      Array.from({ length: 30 }, () => null),
    )
    for (const m of mons) {
      if (m.loc.kind !== "box") continue
      const b = m.loc.box ?? 0
      if (b < 0 || b >= TOTAL_BOXES) continue
      if (m.loc.index < 0 || m.loc.index >= 30) continue
      boxes[b][m.loc.index] = m
    }
    return boxes
  }, [mons])
}

// ── Moves ────────────────────────────────────────────────────────────────────

const boxOf = (loc: SlotLoc) => (loc.kind === "party" ? PARTY_BOX : (loc.box ?? 0))
const sameSlot = (a: SlotLoc, b: SlotLoc) => boxOf(a) === boxOf(b) && a.index === b.index

/** Apply a swap to the two caches, so the sprite lands before the server answers. */
function applyMoveLocally(
  pc: PCPokemon[],
  party: (ExtendedPokemonW | null)[],
  from: SlotLoc,
  to: SlotLoc,
): { pc: PCPokemon[]; party: (ExtendedPokemonW | null)[] } {
  const read = (loc: SlotLoc): ExtendedPokemonW | null =>
    loc.kind === "party"
      ? (party[loc.index] ?? null)
      : (pc.find((e) => e.box === loc.box && e.index === loc.index)?.pokemon ?? null)

  const moving = read(from)
  if (!moving) return { pc, party }
  const displaced = read(to)

  const nextPc = pc.filter(
    (e) => !(sameSlot({ kind: "box", box: e.box, index: e.index }, from) || sameSlot({ kind: "box", box: e.box, index: e.index }, to)),
  )
  const nextParty = [...party]

  const write = (loc: SlotLoc, p: ExtendedPokemonW | null) => {
    if (loc.kind === "party") nextParty[loc.index] = p
    else if (p) nextPc.push({ pokemon: p, box: loc.box ?? 0, index: loc.index })
  }

  write(to, moving)
  write(from, displaced)

  return { pc: nextPc, party: nextParty }
}

/**
 * The one write the game server actually offers. It is a *swap*: the destination's
 * occupant, if any, lands back in the source slot. Box↔box, box↔party and
 * party↔party all go through it — only the `-1` box number differs.
 */
export function useMovePokemon() {
  const uuid = usePcUuid()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ from, to }: { from: SlotLoc; to: SlotLoc }) => {
      if (!uuid) throw new Error("Sesión no iniciada")
      return wingullPOSTOrThrow("/pc/move", {
        uuid,
        sourceBox: boxOf(from),
        sourceIndex: from.index,
        destinationBox: boxOf(to),
        destinationIndex: to.index,
      })
    },
    onMutate: async ({ from, to }) => {
      if (!uuid) return
      const pcKey = pcKeys.pc(uuid)
      const partyKey = pcKeys.party(uuid)
      await Promise.all([qc.cancelQueries({ queryKey: pcKey }), qc.cancelQueries({ queryKey: partyKey })])

      const prevPc = qc.getQueryData<PCPokemon[]>(pcKey) ?? []
      const prevParty = qc.getQueryData<(ExtendedPokemonW | null)[]>(partyKey) ?? padParty([])

      const next = applyMoveLocally(prevPc, prevParty, from, to)
      qc.setQueryData(pcKey, next.pc)
      qc.setQueryData(partyKey, next.party)

      return { prevPc, prevParty }
    },
    onError: (_err, _vars, ctx) => {
      if (!uuid || !ctx) return
      qc.setQueryData(pcKeys.pc(uuid), ctx.prevPc)
      qc.setQueryData(pcKeys.party(uuid), ctx.prevParty)
    },
    onSettled: () => {
      if (!uuid) return
      // One move can touch storage and the party at once, so both are refetched.
      void qc.invalidateQueries({ queryKey: pcKeys.pc(uuid) })
      void qc.invalidateQueries({ queryKey: pcKeys.party(uuid) })
    },
  })
}

/**
 * A move is legal unless it would empty the party — the game refuses to let a
 * trainer walk around with nothing, so we refuse before the round-trip.
 *
 * Only a move *out* of the party onto an *empty* box slot shrinks it. Dropping onto
 * an occupied slot is a swap, so the party comes back the same size and is fine even
 * at one Pokémon. Returns the reason to refuse, or `null` to allow.
 */
export function useCanMove() {
  const { data: party } = useParty()
  return useCallback(
    (from: SlotLoc, to: SlotLoc, destinationOccupied: boolean): string | null => {
      if (sameSlot(from, to)) return null
      const shrinksParty = from.kind === "party" && to.kind === "box" && !destinationOccupied
      if (!shrinksParty) return null
      const filled = (party ?? []).filter(Boolean).length
      return filled <= 1 ? "No puedes dejar el equipo completamente vacío" : null
    },
    [party],
  )
}

// ── Marks (favourites + tags) ────────────────────────────────────────────────

/** Optimistically patch the marks cache, then reconcile with the server. */
function usePatchMarks() {
  const uuid = usePcUuid()
  const qc = useQueryClient()
  return useCallback(
    (patch: (prev: PcMarkMap) => PcMarkMap) => {
      if (!uuid) return undefined
      const key = pcKeys.marks(uuid)
      const prev = qc.getQueryData<PcMarkMap>(key) ?? {}
      qc.setQueryData(key, patch(prev))
      return prev
    },
    [qc, uuid],
  )
}

const withMark = (map: PcMarkMap, key: string, next: Partial<PcMarkState>): PcMarkMap => ({
  ...map,
  [key]: {
    favorite: next.favorite ?? map[key]?.favorite ?? false,
    tags: next.tags ?? map[key]?.tags ?? [],
  },
})

export function useSetMark() {
  const uuid = usePcUuid()
  const qc = useQueryClient()
  const patchLocal = usePatchMarks()

  return useMutation({
    mutationFn: ({ key, patch }: { key: string; patch: Partial<PcMarkState> }) => {
      if (!uuid) throw new Error("Sesión no iniciada")
      return PcMarksService.upsertMark(uuid, key, patch)
    },
    onMutate: ({ key, patch }) => ({ prev: patchLocal((m) => withMark(m, key, patch)) }),
    onError: (_e, _v, ctx) => {
      if (uuid && ctx?.prev) qc.setQueryData(pcKeys.marks(uuid), ctx.prev)
    },
    onSettled: () => {
      if (uuid) void qc.invalidateQueries({ queryKey: pcKeys.marks(uuid) })
    },
  })
}

/** Favourite or tag a whole multi-selection in one round-trip. */
export function useBulkMark() {
  const uuid = usePcUuid()
  const qc = useQueryClient()
  const patchLocal = usePatchMarks()

  return useMutation({
    mutationFn: (vars: {
      keys: string[]
      favorite?: boolean
      addTags?: string[]
      removeTags?: string[]
    }) => {
      if (!uuid) throw new Error("Sesión no iniciada")
      return PcMarksService.bulkUpsert(uuid, vars.keys, {
        favorite: vars.favorite,
        addTags: vars.addTags,
        removeTags: vars.removeTags,
      })
    },
    onMutate: ({ keys, favorite, addTags, removeTags }) => ({
      prev: patchLocal((prev) => {
        let next = prev
        for (const key of keys) {
          const cur = next[key] ?? { favorite: false, tags: [] }
          const tags = new Set(cur.tags)
          for (const t of addTags ?? []) tags.add(t)
          for (const t of removeTags ?? []) tags.delete(t)
          next = withMark(next, key, {
            favorite: favorite ?? cur.favorite,
            tags: [...tags],
          })
        }
        return next
      }),
    }),
    onError: (_e, _v, ctx) => {
      if (uuid && ctx?.prev) qc.setQueryData(pcKeys.marks(uuid), ctx.prev)
    },
    onSettled: () => {
      if (uuid) void qc.invalidateQueries({ queryKey: pcKeys.marks(uuid) })
    },
  })
}
