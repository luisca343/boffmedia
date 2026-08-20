import type { PlayerRef } from "../_types"

/**
 * The one normalization boundary for every wire payload that embeds a `PersonRefEntity`.
 * The generated model allows `username` to be missing/null for any uuid the API can't
 * resolve a name for; the app-internal `PlayerRef` keeps `username: string` so the ~90
 * read sites across the app (every `PlayerLink`, `OficialCard`, `AuditoriaBoard`…) don't
 * need a null guard — the miss is coalesced into "—" here, once, at the query/mutation
 * boundary in `_hooks/queries.ts`, rather than swept across those call sites.
 */
export function toPlayerRef(ref: { uuid: string; username?: unknown }): PlayerRef
export function toPlayerRef(ref: { uuid: string; username?: unknown } | null | undefined): PlayerRef | null
export function toPlayerRef(ref: { uuid: string; username?: unknown } | null | undefined): PlayerRef | null {
  if (!ref) return null
  return { uuid: ref.uuid, username: typeof ref.username === "string" ? ref.username : "—" }
}

const refArray = (refs: unknown): PlayerRef[] => (Array.isArray(refs) ? refs.map((r) => toPlayerRef(r) as PlayerRef) : [])

// Normalizers below deliberately stay untyped past the wire boundary: they patch a handful
// of known `PersonRefEntity` keys on whatever payload shape arrives, and the caller casts
// the result to the app type.
const withRefs = (item: any, keys: string[]): any => {
  if (!item) return item
  const out = { ...item }
  for (const key of keys) out[key] = toPlayerRef(item[key])
  return out
}

export const normalizeParcela = (p: any) => withRefs(p, ["owner"])

export const normalizeParcelaHistorial = (h: any) => withRefs(h, ["previousOwner", "newOwner"])

/** Also normalizes the nested `recentBids[].bidder` (Puja), not just the auction's own `bidder`. */
export const normalizeSubasta = (s: any) => {
  const withBidder = withRefs(s, ["bidder"])
  if (!Array.isArray(s?.recentBids)) return withBidder
  return { ...withBidder, recentBids: s.recentBids.map((b: any) => withRefs(b, ["bidder"])) }
}

export const normalizeDenuncia = (d: any) => withRefs(d, ["accused", "reporter", "resolvedBy"])

export const normalizeBuscado = (b: any) => withRefs(b, ["player", "reportedBy", "capturedBy"])

export const normalizePatrulla = (p: any) => (p ? { ...p, officers: refArray(p.officers) } : p)

export const normalizeBitacoraEntry = (e: any) => withRefs(e, ["officer"])

export const normalizeMulta = (m: any) => withRefs(m, ["player", "issuedBy"])

export const normalizeExpediente = (e: any) => withRefs(e, ["subject", "lead"])

/** Also normalizes the nested `multa` (Apelacion.multa), when the wire includes it. */
export const normalizeApelacion = (a: any) => {
  const base = withRefs(a, ["player", "reviewer"])
  return a?.multa ? { ...base, multa: normalizeMulta(a.multa) } : base
}

export const normalizeAnuncio = (a: any) => withRefs(a, ["author"])

export const normalizeAuditEntry = (e: any) => withRefs(e, ["actor"])

export const normalizeObra = (o: any) => (o ? { ...o, builders: refArray(o.builders) } : o)

/** Also normalizes every nested `obras[].builders` (Evento.obras). */
export const normalizeEvento = (e: any) => (Array.isArray(e?.obras) ? { ...e, obras: e.obras.map(normalizeObra) } : e)

export const normalizeMegafoniaEntry = (e: any) => withRefs(e, ["by"])

export const mapPaged = (paged: any, fn: (item: any) => any) =>
  paged && Array.isArray(paged.items) ? { ...paged, items: paged.items.map(fn) } : paged
