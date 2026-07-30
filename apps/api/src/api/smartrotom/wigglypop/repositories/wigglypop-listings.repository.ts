import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNotNull,
  like,
  lte,
  or,
  sql,
} from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  wigglypopCatalogItems,
  wigglypopListingItems,
  wigglypopListingMons,
  wigglypopListings,
  wigglypopOffers,
  wigglypopOrderLines,
  wigglypopWatchlist,
  WigglypopCatalogItem,
  WigglypopListing,
  WigglypopListingItem,
  WigglypopListingMon,
} from '@/_db/schema/SmartRotomWigglypop';
import { rotomUsers } from '@/_db/schema/SmartRotom';
import { ListListingsQueryDto } from '../dto/wigglypop.dto';
import { IV_TOTAL_MAX } from '../services/wigglypop-valuation.service';

export interface ListingWithContents extends WigglypopListing {
  mons: WigglypopListingMon[];
  items: WigglypopListingItem[];
  // Both are COUNTs, never cached columns, and both are 0 (never null) when there is nothing to
  // count. They are hydrated with one grouped query each across the whole page — a per-card
  // count would fire 2 extra round trips per listing on a 24-card feed.
  watchers: number;
  offers: number;
}

// The sum of a mon's six IVs, computed in SQL over the JSON array — there is no numeric column
// to sort or filter on. Used by both `perfectOnly` and the `iv` sort.
const IV_SUM_SQL = sql`(
  COALESCE(JSON_EXTRACT(${wigglypopListingMons.ivs}, '$[0]'), 0) +
  COALESCE(JSON_EXTRACT(${wigglypopListingMons.ivs}, '$[1]'), 0) +
  COALESCE(JSON_EXTRACT(${wigglypopListingMons.ivs}, '$[2]'), 0) +
  COALESCE(JSON_EXTRACT(${wigglypopListingMons.ivs}, '$[3]'), 0) +
  COALESCE(JSON_EXTRACT(${wigglypopListingMons.ivs}, '$[4]'), 0) +
  COALESCE(JSON_EXTRACT(${wigglypopListingMons.ivs}, '$[5]'), 0)
)`;

@Injectable()
export class WigglypopListingsRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  /**
   * Hydrates a set of listings with their mons, items, watcher count and pending-offer count —
   * four batched queries for the whole page, never one per listing. A 24-card browse page must
   * cost 5 round trips, not 97.
   */
  private async withContents(
    listings: WigglypopListing[],
  ): Promise<ListingWithContents[]> {
    if (listings.length === 0) return [];
    const ids = listings.map((l) => l.id);

    const [mons, items, watchers, offers] = await Promise.all([
      this.db
        .select()
        .from(wigglypopListingMons)
        .where(inArray(wigglypopListingMons.listingId, ids)),
      this.db
        .select()
        .from(wigglypopListingItems)
        .where(inArray(wigglypopListingItems.listingId, ids)),
      this.db
        .select({
          listingId: wigglypopWatchlist.listingId,
          total: sql<number>`count(*)`,
        })
        .from(wigglypopWatchlist)
        .where(inArray(wigglypopWatchlist.listingId, ids))
        .groupBy(wigglypopWatchlist.listingId),
      this.db
        .select({
          listingId: wigglypopOffers.listingId,
          total: sql<number>`count(*)`,
        })
        .from(wigglypopOffers)
        .where(
          and(
            inArray(wigglypopOffers.listingId, ids),
            eq(wigglypopOffers.status, 'pendiente'),
          ),
        )
        .groupBy(wigglypopOffers.listingId),
    ]);

    const monsBy = new Map<number, WigglypopListingMon[]>();
    for (const m of mons) {
      const bucket = monsBy.get(m.listingId) ?? [];
      bucket.push(m);
      monsBy.set(m.listingId, bucket);
    }
    const itemsBy = new Map<number, WigglypopListingItem[]>();
    for (const i of items) {
      const bucket = itemsBy.get(i.listingId) ?? [];
      bucket.push(i);
      itemsBy.set(i.listingId, bucket);
    }

    // A listing nobody watches has no row in the grouped result at all — it counts 0, not null.
    const watchersBy = new Map(
      watchers.map((w) => [w.listingId, Number(w.total)]),
    );
    const offersBy = new Map(offers.map((o) => [o.listingId, Number(o.total)]));

    return listings.map((l) => ({
      ...l,
      mons: monsBy.get(l.id) ?? [],
      items: itemsBy.get(l.id) ?? [],
      watchers: watchersBy.get(l.id) ?? 0,
      offers: offersBy.get(l.id) ?? 0,
    }));
  }

  async search(
    query: ListListingsQueryDto,
  ): Promise<{ items: ListingWithContents[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 24;

    // The mon-shaped filters (rarity, shiny, legendary, perfect) live on the CHILD table, so
    // they are applied as an EXISTS subquery rather than a join — a bundle with 3 mons must
    // count once, not three times, and a join would duplicate its row into the page.
    const monConditions = [
      query.rarities?.length
        ? inArray(wigglypopListingMons.rarity, query.rarities)
        : undefined,
      query.shinyOnly ? eq(wigglypopListingMons.shiny, true) : undefined,
      query.legendaryOnly
        ? eq(wigglypopListingMons.legendary, true)
        : undefined,
      // "Perfect" means a flawless 6IV.
      query.perfectOnly ? sql`${IV_SUM_SQL} = ${IV_TOTAL_MAX}` : undefined,
    ].filter((c) => c !== undefined);

    const monExists =
      monConditions.length > 0
        ? sql`EXISTS (SELECT 1 FROM ${wigglypopListingMons} WHERE ${wigglypopListingMons.listingId} = ${wigglypopListings.id} AND ${and(...monConditions)})`
        : undefined;

    // `search` matches the listing title OR any contained species / item name — a player
    // typing "garchomp" expects the bundle containing one to come back too.
    const searchTerm = query.search?.trim();
    const searchWhere = searchTerm
      ? or(
          like(wigglypopListings.title, `%${searchTerm}%`),
          sql`EXISTS (SELECT 1 FROM ${wigglypopListingMons} WHERE ${wigglypopListingMons.listingId} = ${wigglypopListings.id} AND ${wigglypopListingMons.species} LIKE ${`%${searchTerm}%`})`,
          sql`EXISTS (SELECT 1 FROM ${wigglypopListingItems} WHERE ${wigglypopListingItems.listingId} = ${wigglypopListings.id} AND ${wigglypopListingItems.itemName} LIKE ${`%${searchTerm}%`})`,
        )
      : undefined;

    const conditions = [
      eq(wigglypopListings.status, query.status ?? 'activo'),
      query.kind ? eq(wigglypopListings.kind, query.kind) : undefined,
      query.format ? eq(wigglypopListings.format, query.format) : undefined,
      query.priceMax !== undefined
        ? lte(wigglypopListings.price, query.priceMax)
        : undefined,
      searchWhere,
      monExists,
    ].filter((c) => c !== undefined);

    const where = and(...conditions);

    // The feed's dropdown sends hyphenated names (`price-asc`); the underscore forms are kept
    // as aliases so nothing already calling the API breaks.
    const orderBy = (() => {
      switch (query.sort) {
        case 'price-asc':
        case 'price_asc':
          return asc(wigglypopListings.price);

        case 'price-desc':
        case 'price_desc':
          return desc(wigglypopListings.price);

        // Best mon first. A listing's IV score is the BEST mon in it (a bundle is as good as
        // its star), and a listing with no mons at all — an items lot — has no IV score and
        // sorts last rather than sorting as if it were 0IV.
        case 'iv':
          return sql`(
            SELECT MAX(${IV_SUM_SQL})
            FROM ${wigglypopListingMons}
            WHERE ${wigglypopListingMons.listingId} = ${wigglypopListings.id}
          ) IS NULL, (
            SELECT MAX(${IV_SUM_SQL})
            FROM ${wigglypopListingMons}
            WHERE ${wigglypopListingMons.listingId} = ${wigglypopListings.id}
          ) DESC`;

        // Auctions closing soonest first. A non-auction has no endsAt, and MySQL sorts NULLs
        // FIRST on ASC — so they are explicitly pushed to the back and the auctions lead.
        case 'ending':
          return sql`${wigglypopListings.endsAt} IS NULL, ${wigglypopListings.endsAt} ASC`;

        case 'value':
          return desc(wigglypopListings.value);

        // `relevance` only means anything alongside a search term. With one, a title hit
        // outranks a hit that only matched a contained species/item; without one there is
        // nothing to be relevant TO, so it degrades to `recent` rather than pretending.
        case 'relevance':
          return searchTerm
            ? sql`${wigglypopListings.title} LIKE ${`%${searchTerm}%`} DESC, ${wigglypopListings.createdAt} DESC`
            : desc(wigglypopListings.createdAt);

        case 'recent':
        default:
          return desc(wigglypopListings.createdAt);
      }
    })();

    const [rows, totalRows] = await Promise.all([
      this.db
        .select()
        .from(wigglypopListings)
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset((page - 1) * limit),
      this.db
        .select({ total: sql<number>`count(*)` })
        .from(wigglypopListings)
        .where(where),
    ]);

    return {
      items: await this.withContents(rows),
      total: Number(totalRows[0]?.total ?? 0),
    };
  }

  async findById(id: number): Promise<ListingWithContents | null> {
    const rows = await this.db
      .select()
      .from(wigglypopListings)
      .where(eq(wigglypopListings.id, id));
    if (rows.length === 0) return null;
    const [hydrated] = await this.withContents(rows);
    return hydrated;
  }

  async findManyByIds(ids: number[]): Promise<ListingWithContents[]> {
    if (ids.length === 0) return [];
    const rows = await this.db
      .select()
      .from(wigglypopListings)
      .where(inArray(wigglypopListings.id, ids));
    return this.withContents(rows);
  }

  async incrementViews(id: number): Promise<void> {
    await this.db
      .update(wigglypopListings)
      .set({ views: sql`${wigglypopListings.views} + 1` })
      .where(eq(wigglypopListings.id, id));
  }

  async create(
    listing: {
      code: string;
      sellerUuid: string;
      kind: string;
      format: string;
      title: string;
      note?: string | null;
      price: number;
      value: number;
      escrow?: boolean;
      endsAt?: Date | null;
      minIncrement?: number;
      buyNow?: number | null;
      wants?: string[] | null;
      tradePlus?: boolean;
    },
    mons: Array<Omit<WigglypopListingMon, 'id' | 'listingId'>>,
    items: Array<Omit<WigglypopListingItem, 'id' | 'listingId'>>,
  ): Promise<ListingWithContents> {
    const inserted = await this.db.insert(wigglypopListings).values({
      code: listing.code,
      sellerUuid: listing.sellerUuid,
      kind: listing.kind,
      format: listing.format,
      title: listing.title,
      note: listing.note,
      price: listing.price,
      value: listing.value,
      escrow: listing.escrow ?? true,
      currentBid: listing.format === 'auction' ? listing.price : 0,
      startsAt: listing.format === 'auction' ? new Date() : null,
      endsAt: listing.endsAt ?? null,
      minIncrement: listing.minIncrement ?? 50,
      buyNow: listing.buyNow ?? null,
      wants: listing.wants ?? null,
      tradePlus: listing.tradePlus ?? false,
    });
    const listingId = inserted[0].insertId;

    if (mons.length > 0) {
      await this.db
        .insert(wigglypopListingMons)
        .values(mons.map((m) => ({ ...m, listingId })));
    }
    if (items.length > 0) {
      await this.db
        .insert(wigglypopListingItems)
        .values(items.map((i) => ({ ...i, listingId })));
    }

    return (await this.findById(listingId)) as ListingWithContents;
  }

  async update(
    id: number,
    data: Partial<{ price: number; note: string; status: string }>,
  ): Promise<ListingWithContents | null> {
    const set: Record<string, unknown> = {};
    if (data.price !== undefined) set.price = data.price;
    if (data.note !== undefined) set.note = data.note;
    if (data.status !== undefined) set.status = data.status;
    if (Object.keys(set).length > 0) {
      await this.db
        .update(wigglypopListings)
        .set(set)
        .where(eq(wigglypopListings.id, id));
    }
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(wigglypopListings)
      .where(eq(wigglypopListings.id, id));
    return result[0].affectedRows > 0;
  }

  async markSold(id: number, orderId: number, soldFor: number): Promise<void> {
    await this.db
      .update(wigglypopListings)
      .set({
        status: 'vendido',
        soldAt: new Date(),
        soldFor,
        soldOrderId: orderId,
      })
      .where(eq(wigglypopListings.id, id));
  }

  async setStatus(id: number, status: string): Promise<void> {
    await this.db
      .update(wigglypopListings)
      .set({ status })
      .where(eq(wigglypopListings.id, id));
  }

  /** Auctions that are live, have an end time, and are past it. Drives the closer cron. */
  async findExpiredAuctions(now: Date): Promise<WigglypopListing[]> {
    return this.db
      .select()
      .from(wigglypopListings)
      .where(
        and(
          eq(wigglypopListings.status, 'activo'),
          eq(wigglypopListings.format, 'auction'),
          sql`${wigglypopListings.endsAt} IS NOT NULL`,
          lte(wigglypopListings.endsAt, now),
        ),
      );
  }

  async countActiveBySeller(sellerUuid: string): Promise<number> {
    const rows = await this.db
      .select({ total: sql<number>`count(*)` })
      .from(wigglypopListings)
      .where(
        and(
          eq(wigglypopListings.sellerUuid, sellerUuid),
          eq(wigglypopListings.status, 'activo'),
        ),
      );
    return Number(rows[0]?.total ?? 0);
  }

  async bumpBid(id: number, amount: number): Promise<void> {
    await this.db
      .update(wigglypopListings)
      .set({
        currentBid: amount,
        bids: sql`${wigglypopListings.bids} + 1`,
      })
      .where(eq(wigglypopListings.id, id));
  }

  // ─── Item catalog ───────────────────────────────────────────────────────────

  async findCatalogEntries(ids: string[]): Promise<WigglypopCatalogItem[]> {
    if (ids.length === 0) return [];
    return this.db
      .select()
      .from(wigglypopCatalogItems)
      .where(inArray(wigglypopCatalogItems.id, ids));
  }

  /**
   * The whole catalogue. It backs the sell flow's item picker: the game server exposes no way
   * to read a player's bag, so a seller DECLARES what they are selling by picking from this
   * list rather than from a real inventory.
   */
  async listCatalog(): Promise<WigglypopCatalogItem[]> {
    return this.db
      .select()
      .from(wigglypopCatalogItems)
      .orderBy(
        asc(wigglypopCatalogItems.category),
        asc(wigglypopCatalogItems.name),
      );
  }

  // ─── Derived data ───────────────────────────────────────────────────────────

  /**
   * The price history of a species: what people ACTUALLY paid, oldest first. Derived from
   * completed order lines joined back to the mon that was in them — there is no price-history
   * table, and there must not be one, because a fabricated series is worse than no series.
   * The caller returns [] when there are fewer than 2 real sales.
   */
  async findSalePricesByDex(dex: number): Promise<number[]> {
    // Built on the schema objects, not a raw-SQL string: hardcoded table names
    // here silently survive a rename and only fail at runtime.
    const rows = await this.db
      .select({
        unitPrice: wigglypopOrderLines.unitPrice,
        confirmedAt: wigglypopOrderLines.confirmedAt,
      })
      .from(wigglypopOrderLines)
      .innerJoin(
        wigglypopListingMons,
        eq(wigglypopListingMons.listingId, wigglypopOrderLines.listingId),
      )
      .where(
        and(
          eq(wigglypopListingMons.dex, dex),
          eq(wigglypopOrderLines.deliveryStatus, 'confirmado'),
          isNotNull(wigglypopOrderLines.confirmedAt),
        ),
      )
      .orderBy(asc(wigglypopOrderLines.confirmedAt));

    return rows.map((r) => Number(r.unitPrice));
  }

  async findSellerUsername(uuid: string): Promise<string | null> {
    const rows = await this.db
      .select({ username: rotomUsers.username })
      .from(rotomUsers)
      .where(eq(rotomUsers.uuid, uuid));
    return rows[0]?.username ?? null;
  }

  /**
   * Batched form of `findSellerUsername`: one `inArray` query for a whole page of
   * sellers/reviewers instead of one round-trip each. A uuid with no matching user is
   * simply absent from the map — callers resolve that to `null`.
   */
  async findUsernamesByUuids(
    uuids: string[],
  ): Promise<Map<string, string | null>> {
    const names = new Map<string, string | null>();
    if (uuids.length === 0) return names;
    const rows = await this.db
      .select({
        uuid: rotomUsers.uuid,
        username: rotomUsers.username,
      })
      .from(rotomUsers)
      .where(inArray(rotomUsers.uuid, uuids));
    for (const r of rows) names.set(r.uuid, r.username ?? null);
    return names;
  }
}
