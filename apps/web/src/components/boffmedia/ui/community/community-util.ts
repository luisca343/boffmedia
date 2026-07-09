import type { IconName } from "@/components/boffmedia/primitives/icon"

// v3 «Señal» — Comunidad (Blog + Foro) shared types + helpers. Mirrors the
// window globals/helpers from comunidad-data.js + comunidad-kit.jsx, but the
// components are prop-driven (resolved entities passed in) so they can be wired
// to a real API later. Everything the API doesn't expose yet is [deferred] —
// fed from demo data in the showcase.

export type CmTone = "orange" | "accent" | "emerald" | "purple"

// author tone → display hue (mirrors CM_TONE_HUE)
export const CM_TONE_HUE: Record<CmTone, number> = { orange: 28, accent: 18, emerald: 152, purple: 265 }

export function authorHue(a?: { tone?: CmTone } | null): number {
  return (a && a.tone && CM_TONE_HUE[a.tone]) || 28
}

export interface CmAuthor {
  id: number
  name: string
  handle: string
  avatar: string
  tone: CmTone
  role: string
  bio?: string
}

// Fixed reference «now» so relative timestamps are deterministic (no hydration
// drift). All community data is demo/[deferred] until the API lands.
export const CM_NOW = new Date("2026-07-09T12:00:00")

const MIN = 60000
const HOUR = 3600000
const DAY = 86400000

/** Spanish relative time — mirrors window.timeAgo. */
export function timeAgo(iso: string, now: Date = CM_NOW): string {
  const diff = now.getTime() - new Date(iso).getTime()
  if (diff < MIN) return "ahora mismo"
  if (diff < HOUR) return "hace " + Math.floor(diff / MIN) + " min"
  if (diff < DAY) return "hace " + Math.floor(diff / HOUR) + " h"
  const days = Math.floor(diff / DAY)
  if (days < 7) return "hace " + days + " d"
  if (days < 30) return "hace " + Math.floor(days / 7) + " sem"
  const months = Math.floor(days / 30)
  return "hace " + months + " mes" + (months > 1 ? "es" : "")
}

/** 1.2k-style compact number — mirrors window.fmtNum. */
export function fmtNum(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".0", "") + "k"
  return String(n)
}

// ── PostBody blocks ──────────────────────────────────────────────────────────
export interface PostBlock {
  h?: string
  p?: string
  quote?: string
  cite?: string
  list?: string[]
  ordered?: boolean
  code?: string
  note?: string
  tone?: "info" | "success" | "warning"
  title?: string
}

export const CM_NOTE_TONE: Record<string, string> = {
  info: "var(--info)",
  success: "var(--ok)",
  warning: "var(--warn)",
}
export const CM_NOTE_ICON: Record<string, IconName> = {
  info: "info",
  success: "check",
  warning: "flame",
}

// ── Blog ─────────────────────────────────────────────────────────────────────
export interface BlogPostLike {
  id: number
  slug: string
  title: string
  excerpt: string
  category: string
  /** Resolved category label (blog category → label). */
  categoryLabel?: string
  tags: string[]
  /** Resolved author entity (the API returns an id; the showcase resolves it). */
  author: CmAuthor
  publishedAt: string
  readMins: number
  hue: number
  icon: IconName
  featured?: boolean
  views?: number
  likes?: number
}

export interface BlogCategoryLike {
  slug: string
  label: string
  icon: IconName
  hue: number
  description?: string
}

// ── Foro ─────────────────────────────────────────────────────────────────────
export interface ForumThreadLike {
  id: number
  catSlug: string
  /** Resolved category name (for showCat) + hue. */
  catName?: string
  catHue?: number
  title: string
  author: CmAuthor
  /** Resolved last replier (or the author when there are no replies). */
  lastAuthor?: CmAuthor | null
  lastAt?: string | null
  createdAt: string
  pinned?: boolean
  locked?: boolean
  solved?: boolean
  replies: number
  views: number
  votes?: number
}

export interface ForumCategoryLike {
  id: number
  slug: string
  name: string
  description: string
  icon: IconName
  hue: number
  locked?: boolean
  threads: number
  posts: number
  lastAuthor?: CmAuthor | null
  lastAt?: string | null
}

export interface ForumMember extends CmAuthor {
  status?: "online" | "idle" | "offline"
}

export interface ForumStatsData {
  posts: number
  threads: number
  members: number
  online: number
  newest: string
}
