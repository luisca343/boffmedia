import type { IconName } from "@/components/boffmedia/primitives"

// v3 «Señal» — Claves de Steam shared types + helpers. Mirrors v3-keys-data.jsx.
// Each key reproduces the Steam `appdetails` shape (info · price · media). The
// key itself is never shown. Art is served deterministically from the Steam CDN
// by appid. [deferred] — the giveaway/library API isn't wired to the design system.

const KV_CDN = "https://cdn.cloudflare.steamstatic.com/steam/apps/"
export const kvHeaderArt = (id: number) => `${KV_CDN}${id}/header.jpg`
export const kvCapsuleArt = (id: number) => `${KV_CDN}${id}/capsule_231x87.jpg`
const kvHeroArt = (id: number) => `${KV_CDN}${id}/library_hero.jpg`
const kvCapsuleWide = (id: number) => `${KV_CDN}${id}/capsule_616x353.jpg`
const kvBgArt = (id: number) => `${KV_CDN}${id}/page_bg_generated_v6b.jpg`
export const kvMedia = (id: number) => [kvHeroArt(id), kvCapsuleWide(id), kvHeaderArt(id), kvBgArt(id)]

export type KvViaKey = "sorteo" | "manual"
export type KvPlatform = "win" | "mac" | "linux"

export interface KvInfoData {
  developer: string
  publisher: string
  release: string
  platforms: KvPlatform[]
  genres: string[]
  review: number
  reviewCount: number
  metacritic: number | null
}
export interface KvPriceData {
  isFree: boolean
  final: string
  initial: string
  discount: number
}
export interface KvKey {
  name: string
  appid: number
  stock: number
  given: boolean
  via: KvViaKey
  tags: string[]
  desc: string
  info: KvInfoData
  price: KvPriceData
}

// green / blue / amber by Steam review percentage
export function kvReviewColor(score: number): string {
  if (score >= 95) return "var(--ok)"
  if (score >= 85) return "var(--info)"
  return "var(--warn)"
}
// Bands resolve to copy in locales/{es,en}/common.json under common.keys.review.*
// — components call t(`review.${kvReviewBand(score)}`).
export type KvReviewBand = "extremelyPositive" | "veryPositive" | "positive" | "mixed"
export function kvReviewBand(score: number): KvReviewBand {
  if (score >= 95) return "extremelyPositive"
  if (score >= 85) return "veryPositive"
  if (score >= 70) return "positive"
  return "mixed"
}
export function kvMetaColor(score: number): string {
  if (score >= 75) return "var(--ok)"
  if (score >= 50) return "var(--warn)"
  return "var(--bad)"
}
// Bands resolve to copy under common.keys.meta.* — t(`meta.${kvMetaBand(score)}`).
export type KvMetaBand = "universal" | "favorable" | "mixed" | "unfavorable"
export function kvMetaBand(score: number): KvMetaBand {
  if (score >= 90) return "universal"
  if (score >= 75) return "favorable"
  if (score >= 50) return "mixed"
  return "unfavorable"
}
// Platform names (Windows/macOS/Linux) are proper nouns — never translated.
export function kvPlatformMeta(p: KvPlatform): { icon: IconName; label: string } {
  return ({ win: { icon: "grid" as IconName, label: "Windows" }, mac: { icon: "swatch" as IconName, label: "macOS" }, linux: { icon: "database" as IconName, label: "Linux" } })[p] || { icon: "grid", label: p }
}
// label/short live under common.keys.via.<key> — components call
// t(`via.${via}.label`) / t(`via.${via}.short`); this only carries the icon.
export function kvViaIcon(via: KvViaKey): IconName {
  return via === "manual" ? "gift" : "trophy"
}
