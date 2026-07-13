// Domain types for Gobierno de Teras. These mirror `apps/api/src/_db/schema/SmartRotomGobierno.ts`
// one-for-one, plus the fields each list endpoint enriches (player names off a uuid, the plot's
// real owner off WorldGuard). Enrichment is marked, because it is derived at the seam and does
// not exist as a column.

export type Uuid = string

/** Every list endpoint answers with this envelope. */
export type Paged<T> = { items: T[]; total: number; page: number; pageSize: number }

/** Attached wherever a uuid is shown as a person. */
export type PlayerRef = { uuid: Uuid; username: string }

// ─── Urbanismo ────────────────────────────────────────────────────────────────

export type Zona = {
  id: number
  town: string
  name: string
  kind: "residencial" | "comercial" | "civico" | "industrial" | "agricola"
  description: string | null
  /** Derived: the plots that fall inside this district. */
  parcelas?: number
  ocupadas?: number
}

export type Parcela = {
  id: number | null
  regionId: string
  town: string
  number: number
  zonaId: number | null
  status: "ocupada" | "vacante" | "embargada" | "subasta"
  taxAmount: number
  taxDueAt: string | null
  notes: string | null
  /** Enriched from WorldGuard — the plot itself lives in the other database. */
  owner: PlayerRef | null
  zona?: Zona | null
}

export type ParcelaHistorial = {
  id: number
  regionId: string
  town: string
  number: number
  previousOwner: PlayerRef | null
  newOwner: PlayerRef | null
  reason: string | null
  changedAt: string
}

export type Subasta = {
  id: number
  code: string
  regionId: string
  town: string
  number: number
  startBid: number
  currentBid: number
  bidder: PlayerRef | null
  bids: number
  reason: string | null
  status: "live" | "closed" | "cancelled"
  endsAt: string
  settledTxId: number | null
  createdBy: Uuid
  createdAt: string
}

export type Puja = { id: number; subastaId: number; player: PlayerRef; amount: number; createdAt: string }

// ─── Seguridad ────────────────────────────────────────────────────────────────

export type Denuncia = {
  id: number
  code: string
  town: string | null
  plotNumber: number | null
  accused: PlayerRef | null
  reporter: PlayerRef
  category: "griefing" | "theft" | "dispute" | "harassment" | "other"
  status: "pending" | "reviewing" | "resolved" | "dismissed"
  description: string
  resolution: string | null
  resolvedBy: PlayerRef | null
  resolvedAt: string | null
  createdAt: string
}

export type Buscado = {
  id: number
  code: string
  player: PlayerRef
  severity: "low" | "medium" | "high" | "critical"
  status: "active" | "resolved" | "cancelled"
  bounty: number
  offense: string
  reportedBy: PlayerRef
  lastSeen: string | null
  notes: string | null
  capturedBy: PlayerRef | null
  capturedAt: string | null
  createdAt: string
}

export type Patrulla = {
  id: number
  label: string
  fromTime: string
  toTime: string
  zone: string | null
  status: "active" | "next" | "rest"
  officers: PlayerRef[]
  /** Derived: bitácora entries logged during this shift. */
  incidents?: number
}

export type BitacoraEntry = {
  id: number
  patrullaId: number | null
  officer: PlayerRef
  text: string
  tone: "ok" | "warn" | "danger" | "info"
  createdAt: string
}

// ─── Hacienda ─────────────────────────────────────────────────────────────────

export type Multa = {
  id: number
  code: string
  player: PlayerRef
  amount: number
  status: "pending" | "paid" | "cancelled" | "appealed"
  reason: string
  issuedBy: PlayerRef
  denunciaId: number | null
  paidTxId: number | null
  paidAt: string | null
  createdAt: string
}

export type Tasa = {
  id: number
  code: string
  concept: string
  kind: string
  rate: string
  amount: number
  active: boolean
  /** Derived from the StarBank ledger — the sum of TASA transactions, never a column. */
  collected: number
}

export type TesoreriaBreakdown = { concept: string; amount: number; count: number; dep: string }

/** Every figure here is derived from the real StarBank ledger; nothing is self-reported. */
export type Tesoreria = {
  balance: number
  /** The size of the window the figures below cover. */
  days: number
  ingresosMes: number
  gastosMes: number
  series: { label: string; ingreso: number; gasto: number }[]
  ingresos: TesoreriaBreakdown[]
  gastos: TesoreriaBreakdown[]
  tasas: Tasa[]
}

// ─── Justicia ─────────────────────────────────────────────────────────────────

export type ExpedienteEvento = {
  id: number
  kind: "denuncia" | "multa" | "buscado" | "apelacion" | "nota" | "cierre"
  ref: string | null
  text: string
  at: string
}

export type Expediente = {
  id: number
  code: string
  title: string
  subject: PlayerRef
  dep: string
  status: "open" | "closed"
  severity: "low" | "medium" | "high" | "critical"
  lead: PlayerRef
  openedAt: string
  closedAt: string | null
  timeline: ExpedienteEvento[]
}

export type Apelacion = {
  id: number
  code: string
  multaId: number
  multa?: Multa
  player: PlayerRef
  status: "pending" | "reviewing" | "upheld" | "overturned"
  grounds: string
  reviewer: PlayerRef | null
  decision: string | null
  resolvedAt: string | null
  refundTxId: number | null
  createdAt: string
}

// ─── Población ────────────────────────────────────────────────────────────────

/** Derived, not a table: standing and plot count come from the real multas/buscados/plots. */
export type Ciudadano = {
  uuid: Uuid
  username: string
  standing: "bueno" | "observado" | "sancionado"
  parcelas: number
  towns: string[]
  multasPendientes: number
  buscado: boolean
}

export type Rank = {
  role: string
  label: string
  prefix: string
}

export type Oficial = {
  uuid: Uuid
  username: string
  userId: number
  profilePicture?: string | null
  roles: string[]
  /**
   * The highest GOB_* rank held, resolved server-side — null when the officer only holds the
   * base GOBIERNO role. Rank has no table; the roles ARE the roster.
   */
  rank: Rank | null
}

// ─── Gobierno ─────────────────────────────────────────────────────────────────

export type Anuncio = {
  id: number
  kind: "evento" | "anuncio" | "alerta"
  title: string
  body: string
  town: string | null
  author: PlayerRef
  pinned: boolean
  audience: string
  publishedAt: string
}

export type AuditEntry = {
  id: number
  actor: PlayerRef
  action: string
  target: string
  dep: string
  source: string
  createdAt: string
}

// ─── Eventos ──────────────────────────────────────────────────────────────────

export type EventoWeights = { tamano: number; ivs: number; shiny: number; nivel: number; especie: number }

export type Obra = {
  id: number
  eventoId: number
  town: string
  buildName: string
  description: string | null
  builders: string[]
  /** Derived from the votes — the average of each category, and how many people voted. */
  cats: { diseno: number; ambicion: number; fidelidad: number }
  votes: number
  score10: number
}

export type Especie = {
  id: number
  name: string
  rarity: string
  rarityPts: number
  spawnPct: number
  shinyPct: number
  lvlMin: number
  lvlMax: number
}

export type Evento = {
  id: number
  code: string
  type: "construccion" | "caza"
  status: "upcoming" | "building" | "rating" | "live" | "closed"
  title: string
  brief: string | null
  prize: string | null
  crew: string | null
  buildClosedAt: string | null
  ratingOpensAt: string | null
  ratingClosesAt: string | null
  winnerTown: string | null
  zone: string | null
  coordsX: number | null
  coordsZ: number | null
  radius: number | null
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

export type NpcSkin = {
  id: number
  skin: string
  npcs: string[]
  src: boolean
  face: boolean
  head: boolean
  body: boolean
  updatedAt: string
}

export type MegafoniaEntry = {
  id: number
  speaker: string
  text: string
  by: PlayerRef
  createdAt: string
}

export type CartelDestino = { dest: string; dist: string; dir: string }

export type Cartel = {
  id: number
  name: string
  highway: string
  destinations: CartelDestino[]
  createdBy: Uuid
  createdAt: string
}

/** The pending-work counts the sidebar badges read. */
export type Counters = {
  denuncias: number
  buscados: number
  multas: number
  apelaciones: number
}
