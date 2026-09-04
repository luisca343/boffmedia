"use client"

/**
 * The player's collection, local first.
 *
 * The rule this implements: the tool does something useful with no account and
 * no network, and syncs when both appear. So the local store is what the screen
 * renders, always, and the server is a thing the local store is reconciled with
 * — never the other way round.
 *
 * Three states, and none of them is an error:
 *
 * * **Signed out.** Edits are kept locally and nothing is queued. The tool
 *   offers a sign-in; declining leaves a perfectly usable collection that lives
 *   on this machine.
 * * **Signed in, offline.** Edits are applied locally and queued. The pending
 *   count is shown, because "saved" with a silent queue behind it is the kind
 *   of half-truth that gets found out later.
 * * **Signed in, online.** The queue drains (the host flushes it on reconnect)
 *   and the server's snapshot is folded back in.
 *
 * The one subtle rule is in `mergeServer`: a card with a write still queued
 * keeps its LOCAL value. Otherwise a snapshot fetched before the queue drains
 * would overwrite the player's offline edit with the state that edit is about
 * to replace — the loss would look exactly like a bug in the counter.
 */

import { useCallback, useEffect, useState } from "react"
import { toast } from "@boffmedia/ui"
import {
  toolDb,
  toolOutbox,
  useToolOnline,
  useToolSession,
  useToolSync,
} from "@boffmedia/tool-kit"

import { TCGP_NS, useLocale, useToolT } from "../i18n"
import { TcgpService, userCardPath, type TcgCard, type UserCardRow } from "./service"

/** This tool's namespace in the durable store and the queue. */
const NS = "pokemon.tcgpocket"
/** One document per collection: the whole owned map. Collections are a few
 *  hundred entries, so a row per card would be a thousand IPC round trips to
 *  render one screen. */
const COLLECTION = "collection"
/** Documents are keyed by whose collection they are, so signing in as someone
 *  else on a shared machine cannot show the previous player's cards. */
const OWN = "own"

/**
 * What the last reconcile silently changed under the player.
 *
 * The merge rule below is last-writer-wins with the SERVER as the writer: a
 * card with no pending local write takes the server's number, full stop. That
 * rule is fine — it is what "another device edited this" has to mean without a
 * per-card version, and inventing a merge would be worse. What was not fine is
 * that it happened with no trace: a count edited on this device before signing
 * in, or on a second device, was simply replaced and nothing said so. This is
 * the receipt.
 */
export interface CollectionOverride {
  /** How many cards took the server's value over a different local one. */
  count: number
  /** Up to a handful of card ids, for a UI that wants to name them. */
  cardIds: string[]
  /** When the server's copy won, so "which side won and when" is answerable. */
  at: number
}

export interface RecentUpdate {
  id: string | number
  cardId: string
  count: number
  at: string
  cardName?: string
}

function toOwnedMap(rows: UserCardRow[] | undefined): Record<string, number> {
  const map: Record<string, number> = {}
  for (const row of rows || []) {
    const id = row.card_id ?? row.cardId
    if (id != null) map[id] = row.quantity ?? 0
  }
  return map
}

interface UseCollectionOpts {
  /** When set, load this player's collection read-only (the gallery). */
  username?: string
  byId?: Record<string, TcgCard>
}

export function useCollection({ username, byId }: UseCollectionOpts) {
  const t = useToolT(TCGP_NS)
  const locale = useLocale()
  const online = useToolOnline()
  const { user, status } = useToolSession()

  const sessionUserId = user?.id ?? null
  const target = username || sessionUserId
  /** Only your own collection is editable, and it stays editable signed out. */
  const editable = !username
  const authReady = status !== "loading"
  /** Where this collection lives locally. A gallery view is somebody else's, so
   *  it is cached under their id and never written to. */
  const docId = username ? `user:${username}` : sessionUserId ? `user:${sessionUserId}` : OWN

  const [owned, setOwned] = useState<Record<string, number>>({})
  const [changes, setChanges] = useState<Record<string, number>>({})
  const [recent, setRecent] = useState<RecentUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [override, setOverride] = useState<CollectionOverride | null>(null)

  // The queue's own state, with a bounded retry behind it. Before this the tool
  // could only report a COUNT: a player looking at "3 changes not synced" had
  // no way to tell whether they were on their way, waiting for a network, being
  // retried, or dead — and nothing was retrying them anyway except the next
  // `online` event.
  const sync = useToolSync(NS)
  // Destructured because `save` below needs it: the view object is memoised but
  // still changes whenever the status does, and listing it as a dependency
  // would hand every consumer of `save` a new identity on every sync tick.
  const { clearRejection } = sync

  // ── local first ───────────────────────────────────────────────────────────
  // Render what is on disk before anything is asked of the network, so the
  // screen is complete offline and does not flash empty online.
  useEffect(() => {
    let live = true
    setLoading(true)
    void toolDb(NS)
      .get<Record<string, number>>(COLLECTION, docId)
      .then((stored) => {
        if (!live) return
        setOwned(stored ?? {})
        setLoading(false)
      })
      .catch(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
  }, [docId])

  /** Fold the server's snapshot into the local one, keeping any card whose
   *  write has not been delivered yet. */
  const mergeServer = useCallback(async () => {
    if (!target) return
    const res = await TcgpService.getUserCards(target)
    if (!res.success) return
    const server = toOwnedMap(res.data)

    // Cards still owed to the server. Their local value is newer by definition.
    const queued = new Set(
      (await toolOutbox(NS).pending())
        .map((op) => op.dedupeKey)
        .filter((key): key is string => !!key)
        .map((key) => key.replace(/^card:/, "")),
    )

    setOwned((local) => {
      const merged = { ...server }
      for (const cardId of queued) {
        if (local[cardId] !== undefined) merged[cardId] = local[cardId]
        else delete merged[cardId]
      }

      // Everything the server just won. Only cards this device actually HELD a
      // different number for — an absent local value is a first sync, not a
      // conflict, and reporting those would cry wolf on every fresh install.
      const lost = Object.keys(local).filter(
        (cardId) => !queued.has(cardId) && local[cardId] !== merged[cardId],
      )
      setOverride(
        lost.length > 0
          ? { count: lost.length, cardIds: lost.slice(0, 5), at: Date.now() }
          : null,
      )

      void toolDb(NS).put(COLLECTION, docId, merged)
      return merged
    })
  }, [target, docId])

  /** The player has read the notice. It is dismissible rather than a toast
   *  because the data is already gone — it has to survive long enough to be
   *  seen, and a toast on a background refresh would not. */
  const dismissOverride = useCallback(() => setOverride(null), [])

  useEffect(() => {
    if (!authReady || !target || !online) return
    void mergeServer().catch(() => {
      // A failed refresh is not an error state: what is on screen came from
      // disk and is still true.
    })
  }, [authReady, target, online, mergeServer])

  // Recent activity feed. Best-effort and online-only — it is a server-side
  // view of history, so there is nothing local to fall back on.
  useEffect(() => {
    const name = username || user?.name
    if (!name || !online) return
    let live = true
    void TcgpService.getRecentUpdates(name)
      .then((res) => {
        if (!live || !res.success) return
        const rows = res.data ?? []
        setRecent(
          rows.map((row, i) => ({
            id: row.id ?? i,
            cardId: (row.card_id ?? row.cardId) as string,
            count: row.count ?? row.change ?? 0,
            at: row.updatedAt ?? row.updated_at ?? row.at ?? new Date().toISOString(),
            cardName: row.cardName ?? row.card_name,
          })),
        )
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [username, user?.name, online, locale])

  const effective = useCallback(
    (cardId: string) => Math.max(0, (owned[cardId] || 0) + (changes[cardId] || 0)),
    [owned, changes],
  )

  const setChange = useCallback(
    (cardId: string, delta: number) => {
      if (!editable) return
      setChanges((prev) => {
        const current = Math.max(0, (owned[cardId] || 0) + (prev[cardId] || 0))
        if (delta < 0 && current <= 0) return prev
        return { ...prev, [cardId]: (prev[cardId] || 0) + delta }
      })
    },
    [editable, owned],
  )

  const dirtyCount = Object.values(changes).filter((value) => value !== 0).length
  const discard = useCallback(() => setChanges({}), [])

  /**
   * Apply the staged edits.
   *
   * The local write happens FIRST and unconditionally — that is what makes the
   * button honest with no network — and the server call is queued rather than
   * awaited. The host drains that queue when the API is reachable; here it is
   * only flushed opportunistically so an online player sees it land now.
   */
  const save = useCallback(async () => {
    if (!editable || dirtyCount === 0) return
    setSaving(true)
    const entries = Object.entries(changes).filter(([, delta]) => delta !== 0)
    const next = { ...owned }
    for (const [cardId, delta] of entries) {
      next[cardId] = Math.max(0, (owned[cardId] || 0) + delta)
      if (next[cardId] === 0) delete next[cardId]
    }

    try {
      await toolDb(NS).put(COLLECTION, docId, next)
      setOwned(next)

      if (sessionUserId) {
        const outbox = toolOutbox(NS)
        for (const [cardId] of entries) {
          await outbox.enqueue({
            method: "PUT",
            path: userCardPath(sessionUserId, cardId),
            body: { quantity: next[cardId] ?? 0 },
            // The final state per card, so three nudges of the same card while
            // offline send one write, and a replay lands on the same result.
            dedupeKey: `card:${cardId}`,
          })
        }
        if (online) {
          const result = await outbox.flush()
          for (const rejection of result.rejected) {
            // The server refused it for good, so the local value it was meant
            // to produce is now a lie. Said plainly rather than swallowed.
            toast.error(t("app.coleccion.syncRejected", { detail: rejection.message }))
          }
          if (result.rejected.length) {
            await mergeServer().catch(() => {})
            // Reconciled, so the status must stop reporting a refusal it has
            // already dealt with.
            clearRejection()
          }
        }
      }

      const now = new Date().toISOString()
      setRecent((rows) =>
        entries
          .map(([cardId, delta]): RecentUpdate => ({
            id: `${cardId}-${Date.now()}`,
            cardId,
            count: delta,
            at: now,
            cardName: byId?.[cardId]?.name,
          }))
          .concat(rows),
      )
      setChanges({})
      toast.success(
        sessionUserId && !online
          ? t("app.coleccion.saveQueued")
          : t("app.coleccion.saveSuccess"),
      )
    } catch {
      toast.error(t("app.coleccion.saveError"))
    } finally {
      setSaving(false)
    }
  }, [
    editable,
    dirtyCount,
    changes,
    owned,
    docId,
    sessionUserId,
    online,
    byId,
    mergeServer,
    clearRejection,
    t,
  ])

  return {
    owned,
    changes,
    effective,
    setChange,
    dirtyCount,
    discard,
    save,
    recent,
    loading,
    saving,
    editable,
    authReady,
    loggedIn: !!sessionUserId,
    sync,
    override,
    dismissOverride,
  }
}
