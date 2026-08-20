// Domain types for Gobierno de Teras. These mirror `apps/api/src/_db/schema/SmartRotomGobierno.ts`
// one-for-one, plus the fields each list endpoint enriches (player names off a uuid, the plot's
// real owner off WorldGuard). Enrichment is marked, because it is derived at the seam and does
// not exist as a column.
//
// Linked against the generated `@boffmedia/shared` entities wherever they describe the same wire
// shape (audit P9). Most generated fields typed `Record<string, any> | null` are a NestJS/swagger
// artifact, not a real shape: a `string | null` property has no reflectable `design:type`, so
// swagger falls back to `object` and the codegen widens it. Those are narrowed back to
// `string | null` below without further comment; only genuine drift gets one.

import type {
  GobiernoAnuncioEntity,
  GobiernoApelacionEntity,
  GobiernoAuditoriaEntity,
  GobiernoBitacoraEntity,
  GobiernoBuscadoEntity,
  GobiernoCartelEntity,
  GobiernoCensoEntity,
  GobiernoCountersEntity,
  GobiernoDenunciaEntity,
  GobiernoEventoEntity,
  GobiernoEventoEspecieEntity,
  GobiernoEventoObraEntity,
  GobiernoExpedienteEntity,
  GobiernoExpedienteEventoEntity,
  GobiernoMegafoniaEntity,
  GobiernoMultaEntity,
  GobiernoNpcSkinEntity,
  GobiernoOficialEntity,
  GobiernoOficialRankEntity,
  GobiernoParcelaEntity,
  GobiernoParcelaHistorialEntity,
  GobiernoPatrullaEntity,
  GobiernoPujaEntity,
  GobiernoSubastaEntity,
  GobiernoTasaEntity,
  GobiernoTesoreriaEntity,
  GobiernoZonaEntity,
  TesoreriaBreakdownItemEntity,
} from "@boffmedia/shared"

export type Uuid = string

/** Every list endpoint answers with this envelope. Deliberately generic — no single generated
 * model backs it; each `Gobierno*ListEntity` is its own concrete `{ items, total, page, pageSize }`
 * for the same shape, so a shared alias would need re-exporting per-endpoint for no benefit. */
export type Paged<T> = { items: T[]; total: number; page: number; pageSize: number }

/**
 * Attached wherever a uuid is shown as a person.
 *
 * Shadows shared `PersonRefEntity`, whose `username` may be missing/null — the real enrichment
 * (`toPersonRef` in `apps/api/.../person-ref.entity.ts`) sends `username: null` for any uuid it
 * can't resolve a name for. Rather than pushing that null through ~90 call sites across ~30
 * files (every `PlayerLink`, `OficialCard`, `CiudadanoCard`, `AuditoriaBoard`…), it is normalized
 * at the query boundary: every `_hooks/queries.ts` read and mutation runs the wire payload through
 * `_utils/personRef.ts`'s `toPlayerRef`/`normalize*` helpers, which coalesce a missing username to
 * "—" before the data ever reaches a component. `username` stays a plain `string` here.
 */
export type PlayerRef = { uuid: Uuid; username: string }

// ─── Urbanismo ────────────────────────────────────────────────────────────────

export interface Zona extends Omit<GobiernoZonaEntity, "kind" | "description"> {
  /** Narrows the wire's `string` to the five kinds this app actually renders. */
  kind: "residencial" | "comercial" | "civico" | "industrial" | "agricola"
  description: string | null
  /** Derived: the plots that fall inside this district. */
  parcelas?: number
  ocupadas?: number
}

export interface Parcela
  extends Omit<GobiernoParcelaEntity, "status" | "taxDueAt" | "notes" | "owner" | "createdAt" | "updatedAt"> {
  /** Narrows the wire's `string` to the four statuses this app actually renders. */
  status: "ocupada" | "vacante" | "embargada" | "subasta"
  taxDueAt: string | null
  notes: string | null
  /** Enriched from WorldGuard — the plot itself lives in the other database. */
  owner: PlayerRef | null
  zona?: Zona | null
}

export interface ParcelaHistorial extends Omit<GobiernoParcelaHistorialEntity, "previousOwner" | "newOwner" | "reason"> {
  previousOwner: PlayerRef | null
  newOwner: PlayerRef | null
  reason: string | null
}

export interface Subasta extends Omit<GobiernoSubastaEntity, "bidder" | "reason" | "status" | "createdBy"> {
  bidder: PlayerRef | null
  reason: string | null
  /** Narrows the wire's `string` to the three statuses this app actually renders. */
  status: "live" | "closed" | "cancelled"
  createdBy: Uuid
}

/** Not currently read anywhere as its own list (only nested via `Subasta.bidder`/`recentBids`),
 * kept for a standalone bid-history endpoint. `subastaId` is an addition — the nested shape has
 * no need to repeat its own parent's id. */
export interface Puja extends GobiernoPujaEntity {
  subastaId: number
}

// ─── Seguridad ────────────────────────────────────────────────────────────────

export interface Denuncia
  extends Omit<
    GobiernoDenunciaEntity,
    "town" | "accused" | "reporter" | "category" | "status" | "resolution" | "resolvedBy" | "resolvedAt"
  > {
  town: string | null
  plotNumber: number | null
  accused: PlayerRef | null
  reporter: PlayerRef
  /** Narrows the wire's `string` to the categories this app actually renders. */
  category: "griefing" | "theft" | "dispute" | "harassment" | "other"
  /** Narrows the wire's `string` to the statuses this app actually renders. */
  status: "pending" | "reviewing" | "resolved" | "dismissed"
  resolution: string | null
  resolvedBy: PlayerRef | null
  resolvedAt: string | null
}

export interface Buscado
  extends Omit<GobiernoBuscadoEntity, "player" | "severity" | "status" | "reportedBy" | "lastSeen" | "notes" | "capturedBy" | "capturedAt"> {
  player: PlayerRef
  /** Same values as the generated `GobiernoBuscadoEntity.severity` enum, restated as a plain union. */
  severity: "low" | "medium" | "high" | "critical"
  /** Narrows the wire's `string` to the statuses this app actually renders. */
  status: "active" | "resolved" | "cancelled"
  reportedBy: PlayerRef
  lastSeen: string | null
  notes: string | null
  capturedBy: PlayerRef | null
  capturedAt: string | null
}

export interface Patrulla extends Omit<GobiernoPatrullaEntity, "zone" | "status" | "officers"> {
  label: string
  zone: string | null
  /** Narrows the wire's `string` to the statuses this app actually renders. */
  status: "active" | "next" | "rest"
  officers: PlayerRef[]
  /** Derived: bitácora entries logged during this shift. */
  incidents?: number
}

export interface BitacoraEntry extends Omit<GobiernoBitacoraEntity, "officer" | "tone"> {
  officer: PlayerRef
  /** Same values as the generated `GobiernoBitacoraEntity.tone` enum, restated as a plain union. */
  tone: "ok" | "warn" | "danger" | "info"
}

// ─── Hacienda ─────────────────────────────────────────────────────────────────

export interface Multa extends Omit<GobiernoMultaEntity, "player" | "status" | "issuedBy" | "paidAt"> {
  player: PlayerRef
  /** Narrows the wire's `string` to the statuses this app actually renders. */
  status: "pending" | "paid" | "cancelled" | "appealed"
  issuedBy: PlayerRef
  paidAt: string | null
}

export type Tasa = GobiernoTasaEntity

export type TesoreriaBreakdown = TesoreriaBreakdownItemEntity

/** Every figure here is derived from the real StarBank ledger; nothing is self-reported. */
export type Tesoreria = GobiernoTesoreriaEntity

// ─── Justicia ─────────────────────────────────────────────────────────────────

export interface ExpedienteEvento extends Omit<GobiernoExpedienteEventoEntity, "kind" | "ref"> {
  /** Narrows the wire's `string` to the kinds this app actually renders. */
  kind: "denuncia" | "multa" | "buscado" | "apelacion" | "nota" | "cierre"
  ref: string | null
}

export interface Expediente
  extends Omit<GobiernoExpedienteEntity, "subject" | "status" | "severity" | "lead" | "closedAt" | "timeline"> {
  subject: PlayerRef
  dep: string
  /** Narrows the wire's `string` to the statuses this app actually renders. */
  status: "open" | "closed"
  /** Narrows the wire's `string` to the severities this app actually renders. */
  severity: "low" | "medium" | "high" | "critical"
  lead: PlayerRef
  closedAt: string | null
  timeline: ExpedienteEvento[]
}

export interface Apelacion
  extends Omit<GobiernoApelacionEntity, "player" | "status" | "reviewer" | "decision" | "resolvedAt"> {
  player: PlayerRef
  multa?: Multa
  /** Narrows the wire's `string` to the statuses this app actually renders. */
  status: "pending" | "reviewing" | "upheld" | "overturned"
  reviewer: PlayerRef | null
  decision: string | null
  resolvedAt: string | null
}

// ─── Población ────────────────────────────────────────────────────────────────

/** Derived, not a table: standing and plot count come from the real multas/buscados/plots. */
export interface Ciudadano extends Omit<GobiernoCensoEntity, "standing"> {
  /** Same values as the generated `GobiernoCensoEntity.standing` enum, restated as a plain union. */
  standing: "bueno" | "observado" | "sancionado"
}

export type Rank = GobiernoOficialRankEntity

export interface Oficial extends Omit<GobiernoOficialEntity, "profilePicture" | "rank"> {
  profilePicture?: string | null
  /**
   * The highest GOB_* rank held, resolved server-side — null when the officer only holds the
   * base GOBIERNO role. Rank has no table; the roles ARE the roster.
   */
  rank: Rank | null
}

// ─── Gobierno ─────────────────────────────────────────────────────────────────

export interface Anuncio extends Omit<GobiernoAnuncioEntity, "kind" | "town" | "author"> {
  /** Narrows the wire's `string` to the kinds this app actually renders. */
  kind: "evento" | "anuncio" | "alerta"
  town: string | null
  author: PlayerRef
}

/**
 * Shadows shared `GobiernoAuditoriaEntity`, whose `actor` is `PersonRefEntity | null` —
 * system/automated rows genuinely have no acting officer, so `actor` must stay
 * nullable here. `AuditoriaBoard.tsx` and `admin/actividad/page.tsx` both read
 * `.actor.username` and fall back to "Sistema"; declaring it non-null makes them
 * throw on a system row.
 */
export interface AuditEntry extends Omit<GobiernoAuditoriaEntity, "actor"> {
  actor: PlayerRef | null
}

// ─── Eventos ──────────────────────────────────────────────────────────────────

export type EventoWeights = { tamano: number; ivs: number; shiny: number; nivel: number; especie: number }

/**
 * Shadows shared `GobiernoEventoObraEntity`. Match the wire exactly:
 *  - `builders` is `PersonRefEntity[]`, not `string[]` — typing it as strings makes
 *    `ConstruccionDetail.tsx` render a raw object into `<Avatar user={…}>` and use it
 *    as a React `key`.
 *  - `diseno`/`ambicion`/`fidelidad` are FLAT fields. There is no nested `cats`
 *    wrapper on the wire, so `r.cats[k]` throws the moment an obra has any votes.
 *  - There is no combined `score10`; `ConstruccionDetail.tsx` computes it client-side
 *    from the three real fields. A cast (`GobiernoService.evento(...) as Promise<Evento>`,
 *    see `_hooks/queries.ts`) papers over every one of these.
 */
export interface Obra extends Omit<GobiernoEventoObraEntity, "description" | "builders"> {
  description: string | null
  builders: PlayerRef[]
}

export type Especie = GobiernoEventoEspecieEntity

export interface Evento
  extends Omit<
    GobiernoEventoEntity,
    | "type"
    | "status"
    | "brief"
    | "prize"
    | "crew"
    | "buildClosedAt"
    | "ratingOpensAt"
    | "ratingClosesAt"
    | "winnerTown"
    | "zone"
    | "opensAt"
    | "closesAt"
    | "rules"
    | "weights"
    | "createdBy"
  > {
  /** Same values as the generated `GobiernoEventoEntity.type` enum, restated as a plain union. */
  type: "construccion" | "caza"
  /** Narrows the wire's `string` to the statuses this app actually renders. */
  status: "upcoming" | "building" | "rating" | "live" | "closed"
  brief: string | null
  prize: string | null
  crew: string | null
  buildClosedAt: string | null
  ratingOpensAt: string | null
  ratingClosesAt: string | null
  winnerTown: string | null
  zone: string | null
  opensAt: string | null
  closesAt: string | null
  rules: string | null
  weights: EventoWeights | null
  obras?: Obra[]
  especies?: Especie[]
  /** A hunt is blind: while it is live only these aggregates are readable. */
  participants?: number
  capturas?: number
  winnerSpecies?: string | null
  winningScore?: number | null
}

// ─── Administración ───────────────────────────────────────────────────────────

/**
 * Shadows shared `GobiernoNpcSkinEntity`. Match the wire exactly:
 *  - `npcs` is `Array<string> | null`. Typing it as a plain array makes an unguarded
 *    `npcs.join(...)` throw for a skin with zero linked NPCs — `admin/skins/page.tsx`
 *    and `NpcSkinModal.tsx` both read it, and neither guards `npcs` itself.
 *  - `src`/`face`/`head`/`body` are `number` (0/1), not `boolean`. Most reads sit in a
 *    truthy context, but the typed consumers (`NpcSkinModal`'s form state, `RenderThumb`'s
 *    `ok` prop) coerce with `!!` at the boundary rather than mismatching silently.
 */
export type NpcSkin = GobiernoNpcSkinEntity

export interface MegafoniaEntry extends Omit<GobiernoMegafoniaEntity, "by"> {
  by: PlayerRef
}

/**
 * Matches shared `CartelDestinationDto` (`dist` is a number on the wire). Edit-time string
 * state lives in `HighwaySign.tsx`'s `CartelDestinationInput` and is converted on save in
 * `admin/senalizacion/page.tsx`.
 */
export type CartelDestino = { dest: string; dist: number; dir: string }

export interface Cartel extends Omit<GobiernoCartelEntity, "destinations" | "createdBy"> {
  destinations: CartelDestino[]
  createdBy: Uuid
}

/** The pending-work counts the sidebar badges read. */
export type Counters = GobiernoCountersEntity
