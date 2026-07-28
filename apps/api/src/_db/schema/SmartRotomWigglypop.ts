import {
  bigint,
  boolean,
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
import { rotomUsers } from './SmartRotom';
import { starBankTransactions } from './SmartRotomStarBank';

// The Pokémon on sale live on the Pixelmon game server and have NO id (see SmartRotomPc.ts).
// A listing therefore stores a full *snapshot* of the mon plus the same opaque content hash
// the PC app keys its marks on (dex|palette|nature|ability|ivs) and the (box, index) it sat at
// when it was listed. The pair is what lets us prove, at settlement time, that the seller still
// holds the very mon they listed: re-read their PC, recompute the key at that slot, compare.
const pokemonKey = (name = 'pokemon_key') => varchar(name, { length: 64 });

// Player uuids are FK'd to rotom_users where the column is required and single-purpose
// (seller, buyer, bidder…). Matches how the rest of SmartRotom references players.
const playerUuid = (name: string) => varchar(name, { length: 36 });

// ─── Listings ─────────────────────────────────────────────────────────────────

// One row per thing for sale. `kind` says what is inside (a mon, a stack of items, or a
// bundle of several), `format` says how it is sold (fixed price, auction, best-offer, trade).
// The contents live in rotom_wigglypop_listing_mons / rotom_wigglypop_listing_items.
export const wigglypopListings = mysqlTable(
  'rotom_wigglypop_listings',
  {
    id: int('id').primaryKey().autoincrement(),
    code: varchar('code', { length: 24 }).notNull().unique(),
    sellerUuid: playerUuid('seller_uuid')
      .notNull()
      .references(() => rotomUsers.uuid, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    kind: varchar('kind', { length: 16 }).notNull(),
    format: varchar('format', { length: 16 }).notNull().default('fixed'),
    title: varchar('title', { length: 255 }).notNull(),
    note: text('note'),
    status: varchar('status', { length: 16 }).notNull().default('activo'),
    // What the seller asks. For an auction this is the starting bid.
    price: bigint('price', { mode: 'number' }).notNull().default(0),
    // What WigglypopValuationService thinks it is worth — the "tasación", shown next to the
    // asking price. Never used to charge anybody.
    value: bigint('value', { mode: 'number' }).notNull().default(0),
    escrow: boolean('escrow').notNull().default(true),
    views: int('views').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    soldAt: timestamp('sold_at'),
    soldFor: bigint('sold_for', { mode: 'number' }),
    soldOrderId: int('sold_order_id'),

    // Auction-only columns.
    startsAt: timestamp('starts_at'),
    endsAt: timestamp('ends_at'),
    currentBid: bigint('current_bid', { mode: 'number' }).notNull().default(0),
    bids: int('bids').notNull().default(0),
    minIncrement: bigint('min_increment', { mode: 'number' })
      .notNull()
      .default(50),
    buyNow: bigint('buy_now', { mode: 'number' }),

    // Trade-only columns. `wants` is a string[] of species names the seller will trade for.
    wants: json('wants').$type<string[]>(),
    tradePlus: boolean('trade_plus').notNull().default(false),
  },
  (t) => ({
    browseIdx: index('wp_listings_browse_idx').on(t.status, t.kind, t.format),
    sellerIdx: index('wp_listings_seller_idx').on(t.sellerUuid),
  }),
);

export type WigglypopListing = typeof wigglypopListings.$inferSelect;

// A frozen copy of a Pokémon as it was when listed. A `mon` listing has exactly one row;
// a `bundle` has N. Nothing here is re-read from the game server — it is the shop window.
export const wigglypopListingMons = mysqlTable(
  'rotom_wigglypop_listing_mons',
  {
    id: int('id').primaryKey().autoincrement(),
    // FK named explicitly below: the auto-generated name exceeds MySQL's
    // 64-char identifier limit.
    listingId: int('listing_id').notNull(),
    pokemonKey: pokemonKey().notNull(),
    sourceBox: int('source_box').notNull(),
    sourceIndex: int('source_index').notNull(),
    dex: int('dex').notNull(),
    species: varchar('species', { length: 64 }).notNull(),
    form: varchar('form', { length: 64 }),
    palette: varchar('palette', { length: 64 }),
    name: varchar('name', { length: 64 }),
    level: int('level').notNull().default(1),
    nature: varchar('nature', { length: 32 }),
    ability: varchar('ability', { length: 64 }),
    gender: varchar('gender', { length: 16 }),
    heldItem: varchar('held_item', { length: 128 }),
    ball: varchar('ball', { length: 64 }),
    ot: varchar('ot', { length: 64 }),
    caughtIn: varchar('caught_in', { length: 128 }),
    ivs: json('ivs').$type<number[]>(),
    evs: json('evs').$type<number[]>(),
    stats: json('stats').$type<number[]>(),
    moves: json('moves').$type<(string | null)[]>(),
    rarity: varchar('rarity', { length: 16 }).notNull().default('comun'),
    legendary: boolean('legendary').notNull().default(false),
    shiny: boolean('shiny').notNull().default(false),
    value: bigint('value', { mode: 'number' }).notNull().default(0),
  },
  (t) => ({
    listingIdx: index('wp_lmons_listing_idx').on(t.listingId),
    dexIdx: index('wp_lmons_dex_idx').on(t.dex),
    listingFk: foreignKey({
      name: 'wp_lmons_listing_fk',
      columns: [t.listingId],
      foreignColumns: [wigglypopListings.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export type WigglypopListingMon = typeof wigglypopListingMons.$inferSelect;

export const wigglypopListingItems = mysqlTable(
  'rotom_wigglypop_listing_items',
  {
    id: int('id').primaryKey().autoincrement(),
    // FK named explicitly below: the auto-generated name exceeds MySQL's
    // 64-char identifier limit.
    listingId: int('listing_id').notNull(),
    itemId: varchar('item_id', { length: 128 }).notNull(),
    itemName: varchar('item_name', { length: 128 }).notNull(),
    category: varchar('category', { length: 32 }),
    qty: int('qty').notNull().default(1),
    unitPrice: bigint('unit_price', { mode: 'number' }).notNull().default(0),
  },
  (t) => ({
    listingIdx: index('wp_litems_listing_idx').on(t.listingId),
    listingFk: foreignKey({
      name: 'wp_litems_listing_fk',
      columns: [t.listingId],
      foreignColumns: [wigglypopListings.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export type WigglypopListingItem = typeof wigglypopListingItems.$inferSelect;

// The reference price list. Seeded by the migration; an admin can retune ref_price later.
// Item valuation is ref_price × qty and nothing else — there is no market model for items.
export const wigglypopCatalogItems = mysqlTable(
  'rotom_wigglypop_catalog_items',
  {
    id: varchar('id', { length: 128 }).primaryKey(),
    name: varchar('name', { length: 128 }).notNull(),
    category: varchar('category', { length: 32 }).notNull().default('otros'),
    refPrice: bigint('ref_price', { mode: 'number' }).notNull().default(0),
    sprite: varchar('sprite', { length: 255 }),
  },
);

export type WigglypopCatalogItem = typeof wigglypopCatalogItems.$inferSelect;

// ─── Orders ───────────────────────────────────────────────────────────────────

// The buy. `escrow_tx_id` is the real StarBank transfer that moved the buyer's money into the
// market's escrow account — not a bookkeeping row. The order cannot progress without it.
export const wigglypopOrders = mysqlTable(
  'rotom_wigglypop_orders',
  {
    id: int('id').primaryKey().autoincrement(),
    code: varchar('code', { length: 24 }).notNull().unique(),
    buyerUuid: playerUuid('buyer_uuid')
      .notNull()
      .references(() => rotomUsers.uuid, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    subtotal: bigint('subtotal', { mode: 'number' }).notNull().default(0),
    fee: bigint('fee', { mode: 'number' }).notNull().default(0),
    total: bigint('total', { mode: 'number' }).notNull().default(0),
    status: varchar('status', { length: 16 }).notNull().default('escrow'),
    // FK named explicitly below: the auto-generated name exceeds MySQL's
    // 64-char identifier limit.
    escrowTxId: int('escrow_tx_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    buyerIdx: index('wp_orders_buyer_idx').on(t.buyerUuid),
    escrowFk: foreignKey({
      name: 'wp_orders_escrow_fk',
      columns: [t.escrowTxId],
      foreignColumns: [starBankTransactions.id],
    })
      .onDelete('set null')
      .onUpdate('cascade'),
  }),
);

export type WigglypopOrder = typeof wigglypopOrders.$inferSelect;

export const wigglypopOrderLines = mysqlTable(
  'rotom_wigglypop_order_lines',
  {
    id: int('id').primaryKey().autoincrement(),
    // FK named explicitly below: the auto-generated name exceeds MySQL's
    // 64-char identifier limit.
    orderId: int('order_id').notNull(),
    listingId: int('listing_id').notNull(),
    sellerUuid: playerUuid('seller_uuid').notNull(),
    kind: varchar('kind', { length: 16 }).notNull(),
    qty: int('qty').notNull().default(1),
    unitPrice: bigint('unit_price', { mode: 'number' }).notNull().default(0),
    lineTotal: bigint('line_total', { mode: 'number' }).notNull().default(0),
    deliveryStatus: varchar('delivery_status', { length: 16 })
      .notNull()
      .default('pendiente'),
    // The escrow → seller transfer that paid this line out. Set once, at confirmation.
    settleTxId: int('settle_tx_id'),
    // ATOMIC custody only: what /takepokemon actually handed back (the pokespec) or what
    // /takeitems reported taking. Kept so a give-side failure can be replayed or refunded
    // against the real thing that left the seller's PC, instead of against the snapshot.
    takenPayload: json('taken_payload'),
    confirmedAt: timestamp('confirmed_at'),
  },
  (t) => ({
    orderIdx: index('wp_olines_order_idx').on(t.orderId),
    sellerIdx: index('wp_olines_seller_idx').on(t.sellerUuid),
    listingIdx: index('wp_olines_listing_idx').on(t.listingId),
    orderFk: foreignKey({
      name: 'wp_olines_order_fk',
      columns: [t.orderId],
      foreignColumns: [wigglypopOrders.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    settleFk: foreignKey({
      name: 'wp_olines_settle_fk',
      columns: [t.settleTxId],
      foreignColumns: [starBankTransactions.id],
    })
      .onDelete('set null')
      .onUpdate('cascade'),
  }),
);

export type WigglypopOrderLine = typeof wigglypopOrderLines.$inferSelect;

// ─── Bids / offers / trades ───────────────────────────────────────────────────

export const wigglypopBids = mysqlTable(
  'rotom_wigglypop_bids',
  {
    id: int('id').primaryKey().autoincrement(),
    listingId: int('listing_id')
      .notNull()
      .references(() => wigglypopListings.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    bidderUuid: playerUuid('bidder_uuid').notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({ listingIdx: index('wp_bids_listing_idx').on(t.listingId) }),
);

export type WigglypopBid = typeof wigglypopBids.$inferSelect;

export const wigglypopOffers = mysqlTable(
  'rotom_wigglypop_offers',
  {
    id: int('id').primaryKey().autoincrement(),
    listingId: int('listing_id')
      .notNull()
      .references(() => wigglypopListings.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    buyerUuid: playerUuid('buyer_uuid').notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    qty: int('qty').notNull().default(1),
    status: varchar('status', { length: 16 }).notNull().default('pendiente'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    respondedAt: timestamp('responded_at'),
  },
  (t) => ({
    listingIdx: index('wp_offers_listing_idx').on(t.listingId),
    buyerIdx: index('wp_offers_buyer_idx').on(t.buyerUuid),
  }),
);

export type WigglypopOffer = typeof wigglypopOffers.$inferSelect;

// A trade proposal against a `format=trade` listing. The offered mon is snapshotted the same
// way a listed one is (same shape as rotom_wigglypop_listing_mons, box/index included), so the
// proposer's side can be verified against their PC exactly like the seller's.
export const wigglypopTradeOffers = mysqlTable(
  'rotom_wigglypop_trade_offers',
  {
    id: int('id').primaryKey().autoincrement(),
    // FK named explicitly below: the auto-generated name exceeds MySQL's
    // 64-char identifier limit.
    listingId: int('listing_id').notNull(),
    proposerUuid: playerUuid('proposer_uuid').notNull(),
    offeredPokemonKey: pokemonKey('offered_pokemon_key').notNull(),
    offeredSnapshot: json('offered_snapshot'),
    status: varchar('status', { length: 16 }).notNull().default('pendiente'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    respondedAt: timestamp('responded_at'),
  },
  (t) => ({
    listingIdx: index('wp_trades_listing_idx').on(t.listingId),
    listingFk: foreignKey({
      name: 'wp_trades_listing_fk',
      columns: [t.listingId],
      foreignColumns: [wigglypopListings.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export type WigglypopTradeOffer = typeof wigglypopTradeOffers.$inferSelect;

// ─── Watchlist / reviews ──────────────────────────────────────────────────────

export const wigglypopWatchlist = mysqlTable(
  'rotom_wigglypop_watchlist',
  {
    id: int('id').primaryKey().autoincrement(),
    userUuid: playerUuid('user_uuid').notNull(),
    // FK named explicitly below: the auto-generated name exceeds MySQL's
    // 64-char identifier limit.
    listingId: int('listing_id').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    userListingUq: uniqueIndex('wp_watch_user_listing_uq').on(
      t.userUuid,
      t.listingId,
    ),
    listingFk: foreignKey({
      name: 'wp_watch_listing_fk',
      columns: [t.listingId],
      foreignColumns: [wigglypopListings.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export type WigglypopWatch = typeof wigglypopWatchlist.$inferSelect;

// Seller reputation is DERIVED from these rows plus completed orders — there is no cached
// rating/sales column anywhere. A seller with no sales has no rating, and the API says so
// rather than inventing one.
export const wigglypopReviews = mysqlTable(
  'rotom_wigglypop_reviews',
  {
    id: int('id').primaryKey().autoincrement(),
    orderId: int('order_id')
      .notNull()
      .references(() => wigglypopOrders.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    reviewerUuid: playerUuid('reviewer_uuid').notNull(),
    sellerUuid: playerUuid('seller_uuid').notNull(),
    rating: tinyint('rating').notNull(),
    body: text('body'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    oneReviewPerOrder: uniqueIndex('wp_reviews_order_reviewer_uq').on(
      t.orderId,
      t.reviewerUuid,
    ),
    sellerIdx: index('wp_reviews_seller_idx').on(t.sellerUuid),
  }),
);

export type WigglypopReview = typeof wigglypopReviews.$inferSelect;
