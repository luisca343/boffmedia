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
 * TODO(P9): shadows shared `PersonRefEntity`, which has `username?: string | null` — the real
 * enrichment (`toPersonRef` in `apps/api/.../person-ref.entity.ts`) sends `username: null` for any
 * uuid it can't resolve a name for. This type claims `username` is always a string, and ~90 call
 * sites across ~30 files (every `PlayerLink`, `OficialCard`, `CiudadanoCard`, `AuditoriaBoard`…)
 * read `.username` assuming that. Drift is real but aligning it cascades far past a mechanical
 * fix — left unlinked; if a name genuinely fails to resolve today it renders blank rather than a
 * fallback, it does not crash.
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
 * TODO(P9): shadows shared `GobiernoAuditoriaEntity`, whose `actor` is `PersonRefEntity | null` —
 * system/automated rows genuinely have no acting officer. This type used to claim `actor` was
 * always present; two consumers (`AuditoriaBoard.tsx`, `admin/actividad/page.tsx`) read
 * `.actor.username` unguarded and would throw on such a row. Fixed here: `actor` is now nullable
 * and both consumers fall back to "Sistema".
 */
export interface AuditEntry extends Omit<GobiernoAuditoriaEntity, "actor"> {
  actor: PlayerRef | null
}

// ─── Eventos ──────────────────────────────────────────────────────────────────

export type EventoWeights = { tamano: number; ivs: number; shiny: number; nivel: number; especie: number }

/**
 * TODO(P9): shadows shared `GobiernoEventoObraEntity`. Real drift, fixed here: the wire sends
 * `builders: PersonRefEntity[]` (this type claimed `string[]`, so `ConstruccionDetail.tsx` was
 * rendering a raw object into `<Avatar user={…}>` and using it as a React `key`) and flat
 * `diseno`/`ambicion`/`fidelidad` fields (this type invented a nested `cats` wrapper that does
 * not exist on the wire — `r.cats[k]` would throw the moment an obra had any votes). There is
 * also no combined `score10` on the wire; it was a straight cast (`GobiernoService.evento(...) as
 * Promise<Evento>`, see `_hooks/queries.ts`) papering over both gaps. `score10` is now computed
 * client-side in `ConstruccionDetail.tsx` from the three real fields instead of assumed present.
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
 * TODO(P9): shadows shared `GobiernoNpcSkinEntity`. Real drift, fixed here: `npcs` is
 * `Array<string> | null` on the wire (this type claimed a plain array — `admin/skins/page.tsx`
 * called `x.npcs.join(...)` unguarded, and `NpcSkinModal.tsx` called `skin?.npcs.join(...)`,
 * neither guards `npcs` itself, so a skin with zero linked NPCs would throw); both call sites are
 * now null-safe. `src`/`face`/`head`/`body` are `number` (0/1) on the wire, not `boolean` — this
 * type claimed `boolean`; every read was already in a truthy context (`&&`, ternaries) so nothing
 * was actually broken, but the two typed consumers (`NpcSkinModal`'s local form state,
 * `RenderThumb`'s `ok` prop) now coerce with `!!` at the boundary instead of silently mismatching.
 */
export type NpcSkin = GobiernoNpcSkinEntity

export interface MegafoniaEntry extends Omit<GobiernoMegafoniaEntity, "by"> {
  by: PlayerRef
}

/**
 * TODO(P9): shadows shared `CartelDestinationDto`, whose `dist` is `number` — this type has
 * always said `string`. In practice this is inert: the one read site (`HighwaySign.tsx`) renders
 * it straight into a template literal and the one write site (`admin/senalizacion/page.tsx`)
 * builds its own `CartelDestinationInput` (string, bound to a live `<Field>`) rather than this
 * type. Aligning `dist` to `number` here would require splitting that component's edit-time
 * string state from its read-time wire value, which is a bigger change than this pass — left
 * unlinked.
 */
export type CartelDestino = { dest: string; dist: string; dir: string }

export interface Cartel extends Omit<GobiernoCartelEntity, "destinations" | "createdBy"> {
  destinations: CartelDestino[]
  createdBy: Uuid
}

/** The pending-work counts the sidebar badges read. */
export type Counters = GobiernoCountersEntity
