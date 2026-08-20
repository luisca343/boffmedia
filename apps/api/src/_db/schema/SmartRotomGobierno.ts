import {
  boolean,
  char,
  bigint,
  decimal,
  foreignKey,
  index,
  int,
  json,
  mysqlTable,
  text,
  timestamp,
  tinyint,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';
import { starBankTransactions } from './SmartRotomStarBank';

// Plots live in the WorldGuard database (WINGULL_DB), reached over raw SQL — a different
// connection from this schema. Every reference to one here is a `region_id` string joined in
// application code; a foreign key across the two databases is not possible.
const regionId = (name = 'region_id') => varchar(name, { length: 128 });

// Player uuids stay unconstrained rather than FK-ing rotom_users: this domain already has to
// join players in application code (the plot side lives in another database), and 20-odd
// nullable actor columns would each need a hand-shortened constraint name to clear MySQL's
// 64-char limit.
// char(36), like every other player-uuid column in the schema. A type that
// varies table by table mismatches `rotom_users.uuid` and makes these columns
// unusable as clean join keys.
const playerUuid = (name: string) => char(name, { length: 36 });

// Actor columns carry the `_uuid` suffix because they hold a PLAYER identity.
// `created_by` alone is an `int` Boffmedia user id elsewhere in the schema
// (pack_versions, pack_invites, randomizer_presets), so an unsuffixed name here
// meant the same column name denoted two different identities.

// ─── Urbanismo ────────────────────────────────────────────────────────────────

export const gobiernoZonas = mysqlTable('rotom_gobierno_zonas', {
  id: int('id').primaryKey().autoincrement(),
  town: varchar('town', { length: 64 }).notNull(),
  name: varchar('name', { length: 128 }).notNull(),
  kind: varchar('kind', { length: 32 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export type GobiernoZona = typeof gobiernoZonas.$inferSelect;

export const gobiernoParcelas = mysqlTable(
  'rotom_gobierno_parcelas',
  {
    id: int('id').primaryKey().autoincrement(),
    regionId: regionId().notNull(),
    town: varchar('town', { length: 64 }).notNull(),
    number: int('number').notNull(),
    zonaId: int('zona_id').references(() => gobiernoZonas.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    status: varchar('status', { length: 16 }).notNull().default('ocupada'),
    taxAmount: bigint('tax_amount', { mode: 'number' }).notNull().default(500),
    taxDueAt: timestamp('tax_due_at'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    regionIdx: uniqueIndex('gob_parcelas_region_uq').on(t.regionId),
    townIdx: index('gob_parcelas_town_idx').on(t.town),
  }),
);

export type GobiernoParcela = typeof gobiernoParcelas.$inferSelect;

export const gobiernoParcelaHistorial = mysqlTable(
  'rotom_gobierno_parcela_historial',
  {
    id: int('id').primaryKey().autoincrement(),
    regionId: regionId().notNull(),
    town: varchar('town', { length: 64 }).notNull(),
    number: int('number').notNull(),
    previousOwnerUuid: playerUuid('previous_owner_uuid'),
    newOwnerUuid: playerUuid('new_owner_uuid'),
    reason: varchar('reason', { length: 255 }),
    changedAt: timestamp('changed_at').notNull().defaultNow(),
  },
  (t) => ({ regionIdx: index('gob_hist_region_idx').on(t.regionId) }),
);

export type GobiernoParcelaHistorial =
  typeof gobiernoParcelaHistorial.$inferSelect;

export const gobiernoSubastas = mysqlTable(
  'rotom_gobierno_subastas',
  {
    id: int('id').primaryKey().autoincrement(),
    code: varchar('code', { length: 16 }).notNull().unique(),
    regionId: regionId().notNull(),
    town: varchar('town', { length: 64 }).notNull(),
    number: int('number').notNull(),
    startBid: bigint('start_bid', { mode: 'number' }).notNull(),
    currentBid: bigint('current_bid', { mode: 'number' }).notNull(),
    bidderUuid: playerUuid('bidder_uuid'),
    bids: int('bids').notNull().default(0),
    reason: varchar('reason', { length: 255 }),
    status: varchar('status', { length: 16 }).notNull().default('live'),
    endsAt: timestamp('ends_at').notNull(),
    // The StarBank transfer that settled the auction — set once, when the winner is charged.
    // FK named explicitly below: the auto-generated name exceeds MySQL's
    // 64-char identifier limit.
    settledTxId: int('settled_tx_id'),
    createdByUuid: playerUuid('created_by_uuid').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    settledFk: foreignKey({
      name: 'gob_subastas_settled_fk',
      columns: [t.settledTxId],
      foreignColumns: [starBankTransactions.id],
    })
      .onDelete('set null')
      .onUpdate('cascade'),
  }),
);

export type GobiernoSubasta = typeof gobiernoSubastas.$inferSelect;

export const gobiernoPujas = mysqlTable(
  'rotom_gobierno_pujas',
  {
    id: int('id').primaryKey().autoincrement(),
    subastaId: int('subasta_id')
      .notNull()
      .references(() => gobiernoSubastas.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    uuid: playerUuid('uuid').notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({ subastaIdx: index('gob_pujas_subasta_idx').on(t.subastaId) }),
);

export type GobiernoPuja = typeof gobiernoPujas.$inferSelect;

// ─── Seguridad ────────────────────────────────────────────────────────────────

export const gobiernoDenuncias = mysqlTable('rotom_gobierno_denuncias', {
  id: int('id').primaryKey().autoincrement(),
  code: varchar('code', { length: 16 }).notNull().unique(),
  town: varchar('town', { length: 64 }),
  plotNumber: int('plot_number'),
  accusedUuid: playerUuid('accused_uuid'),
  reporterUuid: playerUuid('reporter_uuid').notNull(),
  category: varchar('category', { length: 32 }).notNull(),
  status: varchar('status', { length: 16 }).notNull().default('pending'),
  description: text('description').notNull(),
  resolution: text('resolution'),
  resolvedByUuid: playerUuid('resolved_by_uuid'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export type GobiernoDenuncia = typeof gobiernoDenuncias.$inferSelect;

export const gobiernoBuscados = mysqlTable(
  'rotom_gobierno_buscados',
  {
    id: int('id').primaryKey().autoincrement(),
    code: varchar('code', { length: 16 }).notNull().unique(),
    playerUuid: playerUuid('player_uuid').notNull(),
    severity: varchar('severity', { length: 16 }).notNull(),
    status: varchar('status', { length: 16 }).notNull().default('active'),
    bounty: bigint('bounty', { mode: 'number' }).notNull().default(0),
    offense: varchar('offense', { length: 255 }).notNull(),
    reportedByUuid: playerUuid('reported_by_uuid').notNull(),
    lastSeen: varchar('last_seen', { length: 128 }),
    notes: text('notes'),
    capturedByUuid: playerUuid('captured_by_uuid'),
    capturedAt: timestamp('captured_at'),
    // The StarBank transfer that paid the bounty out of the treasury to the captor.
    // FK named explicitly below: the auto-generated name exceeds MySQL's
    // 64-char identifier limit.
    payoutTxId: int('payout_tx_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    payoutFk: foreignKey({
      name: 'gob_buscados_payout_fk',
      columns: [t.payoutTxId],
      foreignColumns: [starBankTransactions.id],
    })
      .onDelete('set null')
      .onUpdate('cascade'),
  }),
);

export type GobiernoBuscado = typeof gobiernoBuscados.$inferSelect;

export const gobiernoPatrullas = mysqlTable('rotom_gobierno_patrullas', {
  id: int('id').primaryKey().autoincrement(),
  label: varchar('label', { length: 64 }).notNull(),
  fromTime: varchar('from_time', { length: 8 }).notNull(),
  toTime: varchar('to_time', { length: 8 }).notNull(),
  zone: varchar('zone', { length: 128 }),
  status: varchar('status', { length: 16 }).notNull().default('rest'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export type GobiernoPatrulla = typeof gobiernoPatrullas.$inferSelect;

export const gobiernoPatrullaOficiales = mysqlTable(
  'rotom_gobierno_patrulla_oficiales',
  {
    id: int('id').primaryKey().autoincrement(),
    // FK named explicitly below: the auto-generated name exceeds MySQL's
    // 64-char identifier limit.
    patrullaId: int('patrulla_id').notNull(),
    uuid: playerUuid('uuid').notNull(),
  },
  (t) => ({
    patrullaIdx: index('gob_patoff_patrulla_idx').on(t.patrullaId),
    patrullaFk: foreignKey({
      name: 'gob_patoff_patrulla_fk',
      columns: [t.patrullaId],
      foreignColumns: [gobiernoPatrullas.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export type GobiernoPatrullaOficial =
  typeof gobiernoPatrullaOficiales.$inferSelect;

export const gobiernoBitacora = mysqlTable(
  'rotom_gobierno_bitacora',
  {
    id: int('id').primaryKey().autoincrement(),
    // FK named explicitly below: the auto-generated name exceeds MySQL's
    // 64-char identifier limit.
    patrullaId: int('patrulla_id'),
    uuid: playerUuid('uuid').notNull(),
    text: text('text').notNull(),
    tone: varchar('tone', { length: 16 }).notNull().default('info'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    patrullaFk: foreignKey({
      name: 'gob_bitacora_patrulla_fk',
      columns: [t.patrullaId],
      foreignColumns: [gobiernoPatrullas.id],
    })
      .onDelete('set null')
      .onUpdate('cascade'),
  }),
);

export type GobiernoBitacora = typeof gobiernoBitacora.$inferSelect;

// ─── Hacienda ─────────────────────────────────────────────────────────────────

export const gobiernoMultas = mysqlTable(
  'rotom_gobierno_multas',
  {
    id: int('id').primaryKey().autoincrement(),
    code: varchar('code', { length: 16 }).notNull().unique(),
    playerUuid: playerUuid('player_uuid').notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    status: varchar('status', { length: 16 }).notNull().default('pending'),
    reason: varchar('reason', { length: 255 }).notNull(),
    issuedByUuid: playerUuid('issued_by_uuid').notNull(),
    denunciaId: int('denuncia_id').references(() => gobiernoDenuncias.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    // The StarBank transfer that paid the fine into the treasury.
    // FK named explicitly below: the auto-generated name exceeds MySQL's
    // 64-char identifier limit.
    paidTxId: int('paid_tx_id'),
    paidAt: timestamp('paid_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    paidFk: foreignKey({
      name: 'gob_multas_paid_fk',
      columns: [t.paidTxId],
      foreignColumns: [starBankTransactions.id],
    })
      .onDelete('set null')
      .onUpdate('cascade'),
  }),
);

export type GobiernoMulta = typeof gobiernoMultas.$inferSelect;

// Rate card only. What was actually collected derives from the StarBank ledger
// (transactions of type TASA into the treasury) — never stored here.
export const gobiernoTasas = mysqlTable('rotom_gobierno_tasas', {
  id: int('id').primaryKey().autoincrement(),
  code: varchar('code', { length: 16 }).notNull().unique(),
  concept: varchar('concept', { length: 128 }).notNull(),
  kind: varchar('kind', { length: 32 }).notNull(),
  rate: varchar('rate', { length: 64 }).notNull(),
  amount: bigint('amount', { mode: 'number' }).notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export type GobiernoTasa = typeof gobiernoTasas.$inferSelect;

// ─── Justicia ─────────────────────────────────────────────────────────────────

export const gobiernoExpedientes = mysqlTable('rotom_gobierno_expedientes', {
  id: int('id').primaryKey().autoincrement(),
  code: varchar('code', { length: 16 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  subjectUuid: playerUuid('subject_uuid').notNull(),
  dep: varchar('dep', { length: 32 }).notNull().default('justicia'),
  status: varchar('status', { length: 16 }).notNull().default('open'),
  severity: varchar('severity', { length: 16 }).notNull().default('medium'),
  leadUuid: playerUuid('lead_uuid').notNull(),
  openedAt: timestamp('opened_at').notNull().defaultNow(),
  closedAt: timestamp('closed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export type GobiernoExpediente = typeof gobiernoExpedientes.$inferSelect;

export const gobiernoExpedienteEventos = mysqlTable(
  'rotom_gobierno_expediente_eventos',
  {
    id: int('id').primaryKey().autoincrement(),
    expedienteId: int('expediente_id').notNull(),
    kind: varchar('kind', { length: 16 }).notNull(),
    ref: varchar('ref', { length: 32 }),
    text: text('text').notNull(),
    at: timestamp('at').notNull().defaultNow(),
  },
  (t) => ({
    expIdx: index('gob_expev_expediente_idx').on(t.expedienteId),
    // Named by hand: drizzle's derived name is 68 chars and MySQL caps identifiers at 64.
    expedienteFk: foreignKey({
      columns: [t.expedienteId],
      foreignColumns: [gobiernoExpedientes.id],
      name: 'gob_expev_expediente_fk',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export type GobiernoExpedienteEvento =
  typeof gobiernoExpedienteEventos.$inferSelect;

export const gobiernoApelaciones = mysqlTable(
  'rotom_gobierno_apelaciones',
  {
    id: int('id').primaryKey().autoincrement(),
    code: varchar('code', { length: 16 }).notNull().unique(),
    multaId: int('multa_id')
      .notNull()
      .references(() => gobiernoMultas.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    playerUuid: playerUuid('player_uuid').notNull(),
    status: varchar('status', { length: 16 }).notNull().default('pending'),
    grounds: text('grounds').notNull(),
    reviewerUuid: playerUuid('reviewer_uuid'),
    decision: text('decision'),
    resolvedAt: timestamp('resolved_at'),
    // Set when an overturned appeal refunds an already-paid fine out of the treasury.
    // FK named explicitly below: the auto-generated name exceeds MySQL's
    // 64-char identifier limit.
    refundTxId: int('refund_tx_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    refundFk: foreignKey({
      name: 'gob_apelaciones_refund_fk',
      columns: [t.refundTxId],
      foreignColumns: [starBankTransactions.id],
    })
      .onDelete('set null')
      .onUpdate('cascade'),
  }),
);

export type GobiernoApelacion = typeof gobiernoApelaciones.$inferSelect;

// ─── Gobierno ─────────────────────────────────────────────────────────────────

export const gobiernoAnuncios = mysqlTable('rotom_gobierno_anuncios', {
  id: int('id').primaryKey().autoincrement(),
  kind: varchar('kind', { length: 16 }).notNull().default('anuncio'),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  town: varchar('town', { length: 64 }),
  authorUuid: playerUuid('author_uuid').notNull(),
  pinned: boolean('pinned').notNull().default(false),
  audience: varchar('audience', { length: 16 }).notNull().default('public'),
  publishedAt: timestamp('published_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export type GobiernoAnuncio = typeof gobiernoAnuncios.$inferSelect;

// Append-only. Serves both «Auditoría» (Gobierno) and «Actividad» (Administración) —
// the same log, filtered differently. Nothing updates or deletes a row here.
export const gobiernoAuditoria = mysqlTable(
  'rotom_gobierno_auditoria',
  {
    id: int('id').primaryKey().autoincrement(),
    actorUuid: playerUuid('actor_uuid').notNull(),
    action: varchar('action', { length: 32 }).notNull(),
    target: varchar('target', { length: 255 }).notNull(),
    dep: varchar('dep', { length: 32 }).notNull(),
    source: varchar('source', { length: 16 }).notNull().default('gobierno'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    depIdx: index('gob_audit_dep_idx').on(t.dep),
    createdIdx: index('gob_audit_created_idx').on(t.createdAt),
  }),
);

export type GobiernoAuditoria = typeof gobiernoAuditoria.$inferSelect;

// ─── Eventos ──────────────────────────────────────────────────────────────────

// Two event types share this table. `construccion` uses build*/rating* + obras + votos;
// `caza` uses zone/coords/radius/opens/closes + especies + capturas.
export const gobiernoEventos = mysqlTable('rotom_gobierno_eventos', {
  id: int('id').primaryKey().autoincrement(),
  code: varchar('code', { length: 16 }).notNull().unique(),
  type: varchar('type', { length: 16 }).notNull(),
  status: varchar('status', { length: 16 }).notNull().default('upcoming'),
  title: varchar('title', { length: 255 }).notNull(),
  brief: text('brief'),
  prize: varchar('prize', { length: 255 }),
  crew: varchar('crew', { length: 128 }),
  buildClosedAt: timestamp('build_closed_at'),
  ratingOpensAt: timestamp('rating_opens_at'),
  ratingClosesAt: timestamp('rating_closes_at'),
  winnerTown: varchar('winner_town', { length: 64 }),
  zone: varchar('zone', { length: 128 }),
  coordsX: int('coords_x'),
  coordsZ: int('coords_z'),
  radius: int('radius'),
  opensAt: timestamp('opens_at'),
  closesAt: timestamp('closes_at'),
  rules: text('rules'),
  // { tamano, ivs, shiny, nivel, especie } — the public scoring weights of a hunt.
  weights: json('weights'),
  createdByUuid: playerUuid('created_by_uuid').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export type GobiernoEvento = typeof gobiernoEventos.$inferSelect;

export const gobiernoEventoObras = mysqlTable(
  'rotom_gobierno_evento_obras',
  {
    id: int('id').primaryKey().autoincrement(),
    // FK named explicitly below: the auto-generated name exceeds MySQL's
    // 64-char identifier limit.
    eventoId: int('evento_id').notNull(),
    town: varchar('town', { length: 64 }).notNull(),
    buildName: varchar('build_name', { length: 255 }).notNull(),
    description: text('description'),
    builders: json('builders'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    eventoIdx: index('gob_obras_evento_idx').on(t.eventoId),
    eventoFk: foreignKey({
      name: 'gob_obras_evento_fk',
      columns: [t.eventoId],
      foreignColumns: [gobiernoEventos.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export type GobiernoEventoObra = typeof gobiernoEventoObras.$inferSelect;

// One vote per player per build. The categories {diseno, ambicion, fidelidad} are the
// average of these rows; stars / nota10 / nota100 / medallas all derive from that.
export const gobiernoEventoVotos = mysqlTable(
  'rotom_gobierno_evento_votos',
  {
    id: int('id').primaryKey().autoincrement(),
    // FK named explicitly below: the auto-generated name exceeds MySQL's
    // 64-char identifier limit.
    obraId: int('obra_id').notNull(),
    voterUuid: playerUuid('voter_uuid').notNull(),
    diseno: int('diseno').notNull(),
    ambicion: int('ambicion').notNull(),
    fidelidad: int('fidelidad').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    oneVotePerObra: uniqueIndex('gob_votos_obra_voter_uq').on(
      t.obraId,
      t.voterUuid,
    ),
  }),
);

export type GobiernoEventoVoto = typeof gobiernoEventoVotos.$inferSelect;

export const gobiernoEventoEspecies = mysqlTable(
  'rotom_gobierno_evento_especies',
  {
    id: int('id').primaryKey().autoincrement(),
    // FK named explicitly below: the auto-generated name exceeds MySQL's
    // 64-char identifier limit.
    eventoId: int('evento_id').notNull(),
    name: varchar('name', { length: 64 }).notNull(),
    rarity: varchar('rarity', { length: 32 }).notNull(),
    rarityPts: int('rarity_pts').notNull().default(0),
    spawnPct: decimal('spawn_pct', { precision: 5, scale: 2 })
      .notNull()
      .default('0'),
    shinyPct: decimal('shiny_pct', { precision: 5, scale: 2 })
      .notNull()
      .default('0'),
    lvlMin: int('lvl_min').notNull().default(1),
    lvlMax: int('lvl_max').notNull().default(100),
  },
  (t) => ({
    eventoIdx: index('gob_especies_evento_idx').on(t.eventoId),
    eventoFk: foreignKey({
      name: 'gob_especies_evento_fk',
      columns: [t.eventoId],
      foreignColumns: [gobiernoEventos.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export type GobiernoEventoEspecie = typeof gobiernoEventoEspecies.$inferSelect;

// A hunt is played blind: nobody may read another player's row until the event closes.
// One registered capture per player — re-registering replaces it.
export const gobiernoEventoCapturas = mysqlTable(
  'rotom_gobierno_evento_capturas',
  {
    id: int('id').primaryKey().autoincrement(),
    // FK named explicitly below: the auto-generated name exceeds MySQL's
    // 64-char identifier limit.
    eventoId: int('evento_id').notNull(),
    uuid: playerUuid('uuid').notNull(),
    species: varchar('species', { length: 64 }).notNull(),
    level: int('level').notNull(),
    ivsTotal: int('ivs_total').notNull(),
    shiny: tinyint('shiny').notNull().default(0),
    size: decimal('size', { precision: 6, scale: 2 }),
    score: int('score').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    oneCapturePerPlayer: uniqueIndex('gob_capturas_evento_uuid_uq').on(
      t.eventoId,
      t.uuid,
    ),
    eventoFk: foreignKey({
      name: 'gob_capturas_evento_fk',
      columns: [t.eventoId],
      foreignColumns: [gobiernoEventos.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export type GobiernoEventoCaptura = typeof gobiernoEventoCapturas.$inferSelect;

// ─── Administración ───────────────────────────────────────────────────────────

export const gobiernoNpcSkins = mysqlTable('rotom_gobierno_npc_skins', {
  id: int('id').primaryKey().autoincrement(),
  skin: varchar('skin', { length: 64 }).notNull().unique(),
  npcs: json('npcs'),
  src: tinyint('src').notNull().default(0),
  face: tinyint('face').notNull().default(0),
  head: tinyint('head').notNull().default(0),
  body: tinyint('body').notNull().default(0),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export type GobiernoNpcSkin = typeof gobiernoNpcSkins.$inferSelect;

// Broadcast history. The message itself goes out over wingull/globalchat; this is the record
// of who said what as whom.
export const gobiernoMegafonia = mysqlTable('rotom_gobierno_megafonia', {
  id: int('id').primaryKey().autoincrement(),
  speaker: varchar('speaker', { length: 64 }).notNull(),
  text: text('text').notNull(),
  byUuid: playerUuid('by_uuid').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type GobiernoMegafonia = typeof gobiernoMegafonia.$inferSelect;

export const gobiernoCarteles = mysqlTable('rotom_gobierno_carteles', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 128 }).notNull(),
  highway: varchar('highway', { length: 64 }).notNull(),
  // [{ dest, dist, dir }] — the destinations rendered on the sign.
  destinations: json('destinations'),
  createdByUuid: playerUuid('created_by_uuid').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export type GobiernoCartel = typeof gobiernoCarteles.$inferSelect;
