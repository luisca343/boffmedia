import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { WingullFacadeService } from '../../wingull/wingull.facade.service';
import {
  ListingWithContents,
  WigglypopListingsRepository,
} from '../repositories/wigglypop-listings.repository';
import { WigglypopTradingRepository } from '../repositories/wigglypop-trading.repository';
import { WigglypopOrdersRepository } from '../repositories/wigglypop-orders.repository';
import { WigglypopValuationService } from './wigglypop-valuation.service';
import { pokemonKey } from '../_shared/pokemon-key.util';
import { generateWpCode } from '../_shared/code.util';
import {
  CreateListingDto,
  ListListingsQueryDto,
  ListingItemInputDto,
  ListingMonInputDto,
  UpdateListingDto,
  ValuateDto,
  isItemsKind,
  resolveMonSlot,
} from '../dto/wigglypop.dto';
import {
  WigglypopItemCatalogEntity,
  WigglypopListingEntity,
  WigglypopListingListEntity,
  WigglypopSellerEntity,
  WigglypopValuationEntity,
  WigglypopWatchlistEntity,
} from '../entities/wigglypop.entity';

// The shape the Pixelmon /pc endpoint hands back. Mirrors apps/web's PCData — the API stores
// no PC of its own, it re-reads the live one every time it needs to prove something.
interface PcSlot {
  pokemon: Record<string, any>;
  index: number;
  box: number;
}
interface PcBox {
  boxNumber: number;
  pokemon: (PcSlot | null)[];
}
interface PcData {
  boxes: PcBox[];
}

// A mon is not sellable if the seller does not actually have it. Everything in this file that
// touches a mon goes through verifyMonInPc().
export interface VerifiedMon {
  raw: Record<string, any>;
  input: ListingMonInputDto;
  box: number;
  index: number;
}

@Injectable()
export class WigglypopListingsService {
  constructor(
    private readonly logger: Logger,
    private readonly listingsRepository: WigglypopListingsRepository,
    private readonly tradingRepository: WigglypopTradingRepository,
    private readonly ordersRepository: WigglypopOrdersRepository,
    private readonly valuation: WigglypopValuationService,
    private readonly wingull: WingullFacadeService,
  ) {}

  // ─── PC verification ────────────────────────────────────────────────────────

  /**
   * Proves a player really holds the mon they claim to, at the slot they claim it is in.
   *
   * This is the load-bearing anti-fraud check of the whole market: without it a player could
   * list a Pokémon they never owned, or list one, move it away, and still take the money. We
   * re-read the LIVE PC and recompute the same content hash the web app computed — position
   * alone proves nothing, because slots are reused the moment a mon is moved.
   */
  async verifyMonInPc(
    uuid: string,
    input: ListingMonInputDto,
  ): Promise<VerifiedMon> {
    const { box: boxNo, index } = resolveMonSlot(input);

    let pc: PcData;
    try {
      pc = (await this.wingull.getPC(uuid)) as PcData;
    } catch (error: any) {
      throw new BadRequestException(
        `Could not read the PC of ${uuid} to verify the Pokémon: ${error?.message}`,
      );
    }

    const box = pc?.boxes?.find((b) => b.boxNumber === boxNo);
    const slot = box?.pokemon?.find(
      (p): p is PcSlot => !!p && p.index === index,
    );
    if (!slot?.pokemon) {
      throw new BadRequestException(
        `There is no Pokémon in box ${boxNo}, slot ${index} of your PC — it may have been moved.`,
      );
    }

    // The hash is recomputed from the LIVE mon, never from anything the client sent. This is
    // what the "Propiedad verificada (PC)" badge actually means.
    const actualKey = pokemonKey({
      dex: Number(slot.pokemon.dex),
      palette: slot.pokemon.palette,
      nature: slot.pokemon.nature,
      ability: slot.pokemon.ability,
      ivs: slot.pokemon.ivs,
    });

    if (actualKey !== input.pokemonKey) {
      throw new BadRequestException(
        `The Pokémon in box ${boxNo}, slot ${index} is not the one you selected — it may have ` +
          `been moved or changed. Reopen your PC and try again.`,
      );
    }

    return { raw: slot.pokemon, input, box: boxNo, index };
  }

  /** Turns a verified live mon into the frozen listing snapshot, valued deterministically. */
  private snapshotMon(v: VerifiedMon) {
    const p = v.raw;
    const legendary = Boolean(p.legendary ?? false);
    // Pixelmon calls a non-standard colouring a "palette"; anything that is not `none` is a
    // shiny for our purposes, which is also exactly what the PC app shows.
    const shiny =
      Boolean(p.shiny) ||
      (typeof p.palette === 'string' &&
        p.palette !== '' &&
        p.palette.toLowerCase() !== 'none');

    const { value, rarity } = this.valuation.valuateMon({
      level: Number(p.level ?? 1),
      ivs: Array.isArray(p.ivs) ? p.ivs.map(Number) : [],
      shiny,
      legendary,
      // PokemonW calls the held item `item`, not `heldItem` — the column is `held_item`.
      heldItem: p.item ?? p.heldItem ?? null,
    });

    return {
      pokemonKey: v.input.pokemonKey,
      sourceBox: v.box,
      sourceIndex: v.index,
      dex: Number(p.dex),
      species: String(p.species ?? p.name ?? 'Pokémon'),
      form: p.form ?? null,
      palette: p.palette ?? null,
      name: p.name ?? null,
      level: Number(p.level ?? 1),
      nature: p.nature ?? null,
      ability: p.ability ?? null,
      gender: p.gender ?? null,
      heldItem: p.item ?? p.heldItem ?? null,
      ball: p.ball ?? null,
      ot: p.ot ?? null,
      caughtIn: p.caughtIn ?? null,
      ivs: Array.isArray(p.ivs) ? p.ivs.map(Number) : null,
      evs: Array.isArray(p.evs) ? p.evs.map(Number) : null,
      stats: Array.isArray(p.stats) ? p.stats.map(Number) : null,
      moves: Array.isArray(p.moves) ? p.moves : null,
      rarity,
      legendary,
      shiny,
      value,
    };
  }

  /**
   * Items are DECLARED, not verified.
   *
   * There is no way to read a player's bag — the game server exposes no such route — so an item
   * listing cannot be checked the way a mon can. The seller picks from the catalogue and says
   * what they have. That is a real hole and the UI says so; it is also why an item sale still
   * settles through escrow, with the buyer confirming receipt before the seller sees a coin.
   *
   * The catalogue fills in whatever the client did not send (name, category, price), but an
   * item that is not in it is still recorded rather than rejected — the seller is describing
   * their own bag, not picking from an authoritative inventory.
   */
  private async snapshotItems(inputs: ListingItemInputDto[]) {
    const catalog = await this.listingsRepository.findCatalogEntries(
      inputs.map((i) => i.itemId),
    );
    const byId = new Map(catalog.map((c) => [c.id, c]));

    return inputs.map((i) => {
      const entry = byId.get(i.itemId);
      return {
        itemId: i.itemId,
        itemName: i.itemName ?? entry?.name ?? i.itemId,
        category: i.category ?? entry?.category ?? 'otros',
        qty: i.qty,
        // An item with no catalog price and no declared price is worth 0 — never a guess.
        unitPrice: i.unitPrice ?? entry?.refPrice ?? 0,
      };
    });
  }

  /** The item picker's source of truth. Public, unparameterised, cacheable. */
  async listCatalog(): Promise<WigglypopItemCatalogEntity[]> {
    const entries = await this.listingsRepository.listCatalog();
    return entries.map((e) => ({
      id: e.id,
      name: e.name,
      category: e.category,
      refPrice: e.refPrice,
      sprite: e.sprite,
    }));
  }

  // ─── Entity mapping ─────────────────────────────────────────────────────────

  private async toEntity(
    listing: ListingWithContents,
  ): Promise<WigglypopListingEntity> {
    const username = await this.listingsRepository.findSellerUsername(
      listing.sellerUuid,
    );
    return this.toEntitySync(listing, username);
  }

  private toEntitySync(
    listing: ListingWithContents,
    username: string | null,
  ): WigglypopListingEntity {
    return {
      id: listing.id,
      code: listing.code,
      seller: { uuid: listing.sellerUuid, username },
      kind: listing.kind,
      format: listing.format,
      title: listing.title,
      note: listing.note,
      status: listing.status,
      price: listing.price,
      value: listing.value,
      escrow: listing.escrow,
      views: listing.views,
      watchers: listing.watchers,
      offers: listing.offers,
      mons: listing.mons.map((m) => ({ ...m })) as any,
      items: listing.items.map((i) => ({ ...i })) as any,
      startsAt: listing.startsAt,
      endsAt: listing.endsAt,
      currentBid: listing.currentBid,
      bids: listing.bids,
      minIncrement: listing.minIncrement,
      buyNow: listing.buyNow,
      wants: listing.wants,
      tradePlus: listing.tradePlus,
      soldAt: listing.soldAt,
      soldFor: listing.soldFor,
      soldOrderId: listing.soldOrderId,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    };
  }

  /** Batches the seller-name lookup across a page instead of firing one query per card. */
  async toEntities(
    listings: ListingWithContents[],
  ): Promise<WigglypopListingEntity[]> {
    const names = await this.listingsRepository.findUsernamesByUuids([
      ...new Set(listings.map((l) => l.sellerUuid)),
    ]);
    return listings.map((l) =>
      this.toEntitySync(l, names.get(l.sellerUuid) ?? null),
    );
  }

  // ─── Queries ────────────────────────────────────────────────────────────────

  async list(query: ListListingsQueryDto): Promise<WigglypopListingListEntity> {
    const { items, total } = await this.listingsRepository.search(query);
    return {
      items: await this.toEntities(items),
      total,
      page: query.page ?? 1,
      limit: query.limit ?? 24,
    };
  }

  async get(id: number): Promise<WigglypopListingEntity> {
    const listing = await this.listingsRepository.findById(id);
    if (!listing) throw new NotFoundException(`Listing ${id} not found`);
    await this.listingsRepository.incrementViews(id);
    return this.toEntity(listing);
  }

  // ─── Mutations ──────────────────────────────────────────────────────────────

  async create(dto: CreateListingDto): Promise<WigglypopListingEntity> {
    const format = dto.format ?? 'fixed';

    // The sell flow sends a singular `mon` / `item`; the bundle form sends `mons` / `items`.
    // Both are accepted and collapse to the same thing here.
    const monInputs = dto.mons?.length ? dto.mons : dto.mon ? [dto.mon] : [];
    const itemInputs = dto.items?.length
      ? dto.items
      : dto.item
        ? [dto.item]
        : [];

    if (dto.kind === 'mon' && monInputs.length !== 1) {
      throw new BadRequestException(
        'A `mon` listing must carry exactly one Pokémon',
      );
    }
    if (isItemsKind(dto.kind) && itemInputs.length === 0) {
      throw new BadRequestException('An item listing must carry an item');
    }
    if (
      dto.kind === 'bundle' &&
      monInputs.length === 0 &&
      itemInputs.length === 0
    ) {
      throw new BadRequestException('A `bundle` listing cannot be empty');
    }

    // An auction's end is computed HERE, from durationDays, and never taken from a client
    // clock — a skewed or hostile browser must not be able to decide when bidding closes.
    let endsAt: Date | null = null;
    if (format === 'auction') {
      if (dto.durationDays) {
        endsAt = new Date(Date.now() + dto.durationDays * 24 * 60 * 60 * 1000);
      } else if (dto.endsAt) {
        endsAt = new Date(dto.endsAt);
        if (endsAt <= new Date()) {
          throw new BadRequestException('An auction cannot end in the past');
        }
      } else {
        throw new BadRequestException(
          'An auction needs a `durationDays` (1-7) or an explicit `endsAt`',
        );
      }
    }

    // Every mon is verified against the seller's LIVE PC before the listing exists. A mon they
    // do not hold never reaches the market. Items cannot be verified — see snapshotItems().
    const verified: VerifiedMon[] = [];
    for (const mon of monInputs) {
      verified.push(await this.verifyMonInPc(dto.sellerUuid, mon));
    }

    const mons = verified.map((v) => this.snapshotMon(v));
    const items = itemInputs.length ? await this.snapshotItems(itemInputs) : [];

    // The listing's tasación is the sum of what is inside it — the asking price is whatever
    // the seller chose, and the two are shown side by side.
    const value =
      mons.reduce((acc, m) => acc + m.value, 0) +
      this.valuation.valuateItems(
        items.map((i) => ({ qty: i.qty, refPrice: i.unitPrice })),
      ).value;

    const title =
      dto.title?.trim() ||
      mons[0]?.species ||
      items[0]?.itemName ||
      'Lote Wigglypop';

    const listing = await this.listingsRepository.create(
      {
        code: generateWpCode('LST'),
        sellerUuid: dto.sellerUuid,
        // Stored exactly as sent, so a listing reads back with the `kind` it was created with.
        kind: dto.kind,
        format,
        title,
        note: dto.note ?? null,
        price: dto.price,
        value,
        escrow: dto.escrow,
        endsAt,
        minIncrement: dto.minIncrement,
        buyNow: dto.buyNow ?? null,
        wants: dto.wants ?? null,
        tradePlus: dto.tradePlus,
      },
      mons as any,
      items as any,
    );

    return this.toEntity(listing);
  }

  async update(
    id: number,
    dto: UpdateListingDto,
  ): Promise<WigglypopListingEntity> {
    const listing = await this.listingsRepository.findById(id);
    if (!listing) throw new NotFoundException(`Listing ${id} not found`);
    this.assertSeller(listing, dto.actorUuid);

    if (listing.status === 'vendido') {
      throw new BadRequestException('A sold listing can no longer be edited');
    }
    if (listing.status === 'reservado') {
      throw new BadRequestException(
        'This listing has a pending order against it and cannot be edited',
      );
    }
    if (
      dto.price !== undefined &&
      listing.format === 'auction' &&
      listing.bids > 0
    ) {
      throw new BadRequestException(
        'An auction that already has bids cannot be repriced',
      );
    }

    const updated = await this.listingsRepository.update(id, {
      price: dto.price,
      note: dto.note,
      status: dto.status,
    });
    return this.toEntity(updated as ListingWithContents);
  }

  async remove(id: number, actorUuid?: string): Promise<{ success: boolean }> {
    const listing = await this.listingsRepository.findById(id);
    if (!listing) throw new NotFoundException(`Listing ${id} not found`);
    this.assertSeller(listing, actorUuid);

    if (listing.status === 'reservado') {
      throw new BadRequestException(
        'This listing has a pending order against it and cannot be deleted',
      );
    }
    // A sold listing is a receipt — the order lines point at it. Deleting it would cascade the
    // sale out of existence, so it is soft-cancelled instead.
    if (listing.status === 'vendido') {
      throw new BadRequestException(
        'A sold listing cannot be deleted — it is part of an order',
      );
    }

    await this.listingsRepository.delete(id);
    return { success: true };
  }

  private assertSeller(listing: ListingWithContents, actorUuid?: string): void {
    // actorUuid is optional on the DTO because these routes are @Public() and the client is
    // trusted to send it, like the rest of SmartRotom. When it IS sent, it must match.
    if (actorUuid && actorUuid !== listing.sellerUuid) {
      throw new ForbiddenException('Only the seller can modify this listing');
    }
  }

  // ─── Valuation ──────────────────────────────────────────────────────────────

  async valuate(dto: ValuateDto): Promise<WigglypopValuationEntity> {
    if (dto.items?.length) {
      const snapshot = await this.snapshotItems(dto.items);
      return this.valuation.valuateItems(
        snapshot.map((i) => ({ qty: i.qty, refPrice: i.unitPrice })),
      );
    }
    return this.valuation.valuateMon({
      level: dto.level,
      ivs: dto.ivs,
      shiny: dto.shiny,
      legendary: dto.legendary,
      heldItem: dto.heldItem,
    });
  }

  /**
   * What people have ACTUALLY paid for this species, oldest first.
   *
   * Derived from completed order lines — there is no price-history table and there must not be
   * one. Fewer than two real sales returns [], because a one-point "trend" is not a trend and a
   * fabricated curve would be worse than an empty chart.
   */
  async priceHistory(dex: number): Promise<number[]> {
    const prices = await this.listingsRepository.findSalePricesByDex(dex);
    return prices.length < 2 ? [] : prices;
  }

  // ─── Watchlist ──────────────────────────────────────────────────────────────

  async getWatchlist(uuid: string): Promise<WigglypopWatchlistEntity> {
    const ids = await this.tradingRepository.findWatchedListingIds(uuid);
    const listings = await this.listingsRepository.findManyByIds(ids);
    return {
      items: await this.toEntities(listings),
      total: listings.length,
    };
  }

  async setWatching(
    userUuid: string,
    listingId: number,
    watching: boolean,
  ): Promise<{ watching: boolean }> {
    const listing = await this.listingsRepository.findById(listingId);
    if (!listing) throw new NotFoundException(`Listing ${listingId} not found`);
    const result = await this.tradingRepository.setWatching(
      userUuid,
      listingId,
      watching,
    );
    return { watching: result };
  }

  // ─── Sellers ────────────────────────────────────────────────────────────────

  /**
   * A seller's public reputation. Every number is derived from real rows: `sales` counts
   * confirmed order lines, `rating` averages real reviews. A seller nobody has bought from has
   * sales: 0 and rating: null — the API never invents a rating for a newcomer.
   */
  async getSeller(uuid: string): Promise<WigglypopSellerEntity> {
    const [username, { rating, count }, sales, activeListings, reviews] =
      await Promise.all([
        this.listingsRepository.findSellerUsername(uuid),
        this.tradingRepository.sellerRating(uuid),
        this.ordersRepository.countCompletedSales(uuid),
        this.listingsRepository.countActiveBySeller(uuid),
        this.tradingRepository.findReviewsForSeller(uuid),
      ]);

    const reviewerNames = await this.listingsRepository.findUsernamesByUuids([
      ...new Set(reviews.map((r) => r.reviewerUuid)),
    ]);

    return {
      seller: { uuid, username },
      rating,
      sales,
      reviewCount: count,
      activeListings,
      reviews: reviews.map((r) => ({
        id: r.id,
        orderId: r.orderId,
        reviewer: {
          uuid: r.reviewerUuid,
          username: reviewerNames.get(r.reviewerUuid) ?? null,
        },
        rating: r.rating,
        body: r.body,
        createdAt: r.createdAt,
      })),
    };
  }
}
