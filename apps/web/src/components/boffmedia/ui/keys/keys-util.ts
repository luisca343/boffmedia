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
export function kvReviewLabel(score: number): string {
  if (score >= 95) return "Extremadamente positivas"
  if (score >= 85) return "Muy positivas"
  if (score >= 70) return "Positivas"
  return "Variadas"
}
export function kvMetaColor(score: number): string {
  if (score >= 75) return "var(--ok)"
  if (score >= 50) return "var(--warn)"
  return "var(--bad)"
}
export function kvMetaLabel(score: number): string {
  if (score >= 90) return "Aclamación universal"
  if (score >= 75) return "Generalmente favorable"
  if (score >= 50) return "Reseñas mixtas"
  return "Generalmente desfavorable"
}
export function kvPlatformMeta(p: KvPlatform): { icon: IconName; label: string } {
  return ({ win: { icon: "grid" as IconName, label: "Windows" }, mac: { icon: "swatch" as IconName, label: "macOS" }, linux: { icon: "database" as IconName, label: "Linux" } })[p] || { icon: "grid", label: p }
}
export function kvViaMeta(via: KvViaKey): { icon: IconName; label: string; short: string } {
  if (via === "manual") return { icon: "gift", label: "Entrega manual", short: "Manual" }
  return { icon: "trophy", label: "Sorteo", short: "Sorteo" }
}
