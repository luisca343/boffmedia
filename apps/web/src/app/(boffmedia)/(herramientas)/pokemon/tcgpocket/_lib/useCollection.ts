"use client"

import { useCallback, useEffect, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { PtcgpService } from "@/services/api/boffmedia/ptcgpService"
import { boffGET } from "@/services/boffAPI"
import { useBoffSession } from "@/services/useBoffSession"
import { toast } from "@/components/boffmedia/primitives"
import type { TcgCard } from "@boffmedia/shared"

export interface RecentUpdate {
  id: string | number
  cardId: string
  count: number
  at: string
  cardName?: string
}

/** Raw user-card rows come back snake-cased (`card_id`) from the API. */
function toOwnedMap(rows: any[]): Record<string, number> {
  const m: Record<string, number> = {}
  for (const r of rows || []) {
    const id = r.card_id ?? r.cardId
    if (id != null) m[id] = r.quantity ?? 0
  }
  return m
}

interface UseCollectionOpts {
  /** When set, load this player's collection read-only. Otherwise the session user's own (editable). */
  username?: string
  byId?: Record<string, TcgCard>
}

export function useCollection({ username, byId }: UseCollectionOpts) {
  const { session, status } = useBoffSession()
  const locale = useLocale()
  const t = useTranslations("tcgpocket")

  const sessionUserId = session?.user?.id != null ? String(session.user.id) : null
  const target = username || sessionUserId // whose collection to load
  const editable = !username // own collection is the only editable one
  const authReady = status !== "loading"

  const [owned, setOwned] = useState<Record<string, number>>({})
  const [changes, setChanges] = useState<Record<string, number>>({})
  const [recent, setRecent] = useState<RecentUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchOwned = useCallback(async () => {
    if (!target) { setOwned({}); setLoading(false); return }
    setLoading(true)
    try {
      const res = await PtcgpService.getUserCards(target)
      setOwned(toOwnedMap(res.data as any[]))
    } catch {
      setOwned({})
    } finally {
      setLoading(false)
    }
  }, [target])

  useEffect(() => { if (authReady) fetchOwned() }, [authReady, fetchOwned])

  // Recent activity feed (best-effort; endpoint keyed by username).
  useEffect(() => {
    const name = username || session?.user?.name
    if (!name) return
    let live = true
    boffGET<any[]>(`/herramientas/ptcgp/recent-updates?username=${encodeURIComponent(name)}&limit=10&offset=0`)
      .then((res) => {
        const rows = (Array.isArray(res) ? res : res?.data) || []
        if (!live) return
        setRecent(rows.map((u: any, i: number) => ({
          id: u.id ?? i,
          cardId: u.card_id ?? u.cardId,
          count: u.count ?? u.change ?? 0,
          at: u.updatedAt ?? u.updated_at ?? u.at ?? new Date().toISOString(),
          cardName: u.cardName ?? u.card_name,
        })))
      })
      .catch(() => {})
    return () => { live = false }
  }, [username, session?.user?.name])

  const effective = useCallback(
    (cardId: string) => Math.max(0, (owned[cardId] || 0) + (changes[cardId] || 0)),
    [owned, changes],
  )

  const setChange = useCallback((cardId: string, delta: number) => {
    if (!editable) return
    setChanges((p) => {
      const cur = Math.max(0, (owned[cardId] || 0) + (p[cardId] || 0))
      if (delta < 0 && cur <= 0) return p
      return { ...p, [cardId]: (p[cardId] || 0) + delta }
    })
  }, [editable, owned])

  const dirty = Object.values(changes).filter((v) => v !== 0)
  const dirtyCount = dirty.length

  const discard = useCallback(() => setChanges({}), [])

  const save = useCallback(async () => {
    if (!editable || !sessionUserId || dirtyCount === 0) return
    setSaving(true)
    const uid = Number(sessionUserId)
    const entries = Object.entries(changes).filter(([, d]) => d !== 0)
    try {
      await Promise.all(entries.map(async ([cardId, delta]) => {
        const next = Math.max(0, (owned[cardId] || 0) + delta)
        const existed = (owned[cardId] || 0) > 0
        if (next === 0) {
          if (existed) await PtcgpService.removeUserCard(uid, cardId)
        } else if (existed) {
          await PtcgpService.updateUserCardQuantity(uid, cardId, { quantity: next })
        } else {
          await PtcgpService.addUserCard({ userId: uid, cardId, quantity: next })
        }
      }))
      const now = new Date().toISOString()
      const news: RecentUpdate[] = entries.map(([cardId, delta]) => ({
        id: `${cardId}-${Date.now()}`, cardId, count: delta, at: now, cardName: byId?.[cardId]?.name,
      }))
      setRecent((r) => news.concat(r))
      setChanges({})
      await fetchOwned()
      toast.success(t("app.coleccion.saveSuccess"))
    } catch {
      toast.error(t("app.coleccion.saveError"))
    } finally {
      setSaving(false)
    }
  }, [editable, sessionUserId, dirtyCount, changes, owned, byId, fetchOwned, t])

  return {
    owned, changes, effective, setChange, dirtyCount, discard, save,
    recent, loading, saving, editable, authReady,
    loggedIn: !!sessionUserId,
  }
}
