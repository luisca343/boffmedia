import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { WigglypopListingsService } from './wigglypop-listings.service';
import { WigglypopValuationService } from './wigglypop-valuation.service';
import { WigglypopListingsRepository } from '../repositories/wigglypop-listings.repository';
import { WigglypopTradingRepository } from '../repositories/wigglypop-trading.repository';
import { WigglypopOrdersRepository } from '../repositories/wigglypop-orders.repository';
import { WingullFacadeService } from '../../wingull/wingull.facade.service';
import { pokemonKey } from '../_shared/pokemon-key.util';

const SELLER = 'seller-uuid';

// A real mon sitting in box 2, slot 7 of the seller's live PC.
const LIVE_MON = {
  dex: 445,
  species: 'Garchomp',
  name: 'Garchomp',
  palette: 'none',
  nature: 'Jolly',
  ability: 'Rough Skin',
  level: 100,
  item: 'pixelmon:leftovers',
  ivs: [31, 31, 31, 31, 31, 31],
  evs: [0, 252, 0, 0, 4, 252],
  stats: [341, 359, 226, 176, 206, 333],
  moves: ['Earthquake', 'Dragon Claw', null, null],
};

const LIVE_KEY = pokemonKey({
  dex: LIVE_MON.dex,
  palette: LIVE_MON.palette,
  nature: LIVE_MON.nature,
  ability: LIVE_MON.ability,
  ivs: LIVE_MON.ivs,
});

const PC = {
  boxes: [
    { boxNumber: 0, pokemon: [] },
    { boxNumber: 1, pokemon: [] },
    { boxNumber: 2, pokemon: [{ pokemon: LIVE_MON, box: 2, index: 7 }] },
  ],
};

describe('WigglypopListingsService', () => {
  let service: WigglypopListingsService;

  const listingsRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findSellerUsername: jest.fn(),
    findCatalogEntries: jest.fn(),
    listCatalog: jest.fn(),
    findSalePricesByDex: jest.fn(),
  };
  const tradingRepository = {};
  const ordersRepository = {};
  const wingull = { getPC: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    wingull.getPC.mockResolvedValue(PC);
    listingsRepository.findSellerUsername.mockResolvedValue('Luisca');
    listingsRepository.findCatalogEntries.mockResolvedValue([]);
    listingsRepository.create.mockImplementation(async (listing) => ({
      id: 1,
      ...listing,
      status: 'activo',
      views: 0,
      currentBid: 0,
      bids: 0,
      minIncrement: 50,
      escrow: listing.escrow ?? true,
      startsAt: null,
      soldAt: null,
      soldFor: null,
      soldOrderId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      mons: [],
      items: [],
      watchers: 0,
      offers: 0,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WigglypopListingsService,
        WigglypopValuationService,
        { provide: Logger, useValue: { log: jest.fn(), error: jest.fn() } },
        { provide: WigglypopListingsRepository, useValue: listingsRepository },
        { provide: WigglypopTradingRepository, useValue: tradingRepository },
        { provide: WigglypopOrdersRepository, useValue: ordersRepository },
        { provide: WingullFacadeService, useValue: wingull },
      ],
    }).compile();

    service = module.get(WigglypopListingsService);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // The "Propiedad verificada (PC)" badge means exactly this and nothing else.
  describe('PC ownership verification (kind: mon)', () => {
    it('accepts a mon that really is at the given slot with the given hash', async () => {
      await service.create({
        sellerUuid: SELLER,
        kind: 'mon',
        format: 'fixed',
        price: 15000,
        mon: { pokemonKey: LIVE_KEY, sourceBox: 2, sourceIndex: 7 },
      } as any);

      expect(wingull.getPC).toHaveBeenCalledWith(SELLER);
      expect(listingsRepository.create).toHaveBeenCalled();
    });

    it('rejects a mon whose hash does not match the slot — it was moved or swapped', async () => {
      await expect(
        service.create({
          sellerUuid: SELLER,
          kind: 'mon',
          format: 'fixed',
          price: 15000,
          mon: {
            pokemonKey: 'not-the-real-hash',
            sourceBox: 2,
            sourceIndex: 7,
          },
        } as any),
      ).rejects.toThrow(/is not the one you selected/);

      expect(listingsRepository.create).not.toHaveBeenCalled();
    });

    it('rejects a slot that holds no Pokémon at all', async () => {
      await expect(
        service.create({
          sellerUuid: SELLER,
          kind: 'mon',
          format: 'fixed',
          price: 15000,
          mon: { pokemonKey: LIVE_KEY, sourceBox: 0, sourceIndex: 3 },
        } as any),
      ).rejects.toThrow(/no Pokémon in box 0, slot 3/);
    });

    it('rebuilds the snapshot from the LIVE PC, ignoring what the client claimed', async () => {
      await service.create({
        sellerUuid: SELLER,
        kind: 'mon',
        format: 'fixed',
        price: 15000,
        // A hostile client claiming a level-1 0IV mon, hoping to be believed.
        mon: {
          pokemonKey: LIVE_KEY,
          sourceBox: 2,
          sourceIndex: 7,
          level: 1,
          ivs: [0, 0, 0, 0, 0, 0],
          species: 'Magikarp',
        },
      } as any);

      const [, mons] = listingsRepository.create.mock.calls[0];
      // The stored snapshot is the REAL mon, not the claimed one.
      expect(mons[0].species).toBe('Garchomp');
      expect(mons[0].level).toBe(100);
      expect(mons[0].ivs).toEqual([31, 31, 31, 31, 31, 31]);
      expect(mons[0].rarity).toBe('epico');
    });

    it('accepts the box/index spelling as well as sourceBox/sourceIndex', async () => {
      await service.create({
        sellerUuid: SELLER,
        kind: 'mon',
        format: 'fixed',
        price: 15000,
        mon: { pokemonKey: LIVE_KEY, box: 2, index: 7 },
      } as any);

      const [, mons] = listingsRepository.create.mock.calls[0];
      expect(mons[0].sourceBox).toBe(2);
      expect(mons[0].sourceIndex).toBe(7);
    });

    it('needs a slot at all', async () => {
      await expect(
        service.create({
          sellerUuid: SELLER,
          kind: 'mon',
          format: 'fixed',
          price: 15000,
          mon: { pokemonKey: LIVE_KEY },
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('item listings (kind: item)', () => {
    it('records a declared item WITHOUT any ownership check — there is no bag API', async () => {
      await service.create({
        sellerUuid: SELLER,
        kind: 'item',
        format: 'fixed',
        title: 'Master Ball',
        price: 30000,
        item: {
          itemId: 'pixelmon:master_ball',
          itemName: 'Master Ball',
          category: 'pokeballs',
          qty: 1,
          unitPrice: 30000,
        },
      } as any);

      // The PC is never even read for an item listing.
      expect(wingull.getPC).not.toHaveBeenCalled();

      const [, , items] = listingsRepository.create.mock.calls[0];
      expect(items[0]).toMatchObject({
        itemId: 'pixelmon:master_ball',
        itemName: 'Master Ball',
        qty: 1,
        unitPrice: 30000,
      });
    });

    it('records an item that is not in the catalogue rather than rejecting it', async () => {
      listingsRepository.findCatalogEntries.mockResolvedValue([]);

      await service.create({
        sellerUuid: SELLER,
        kind: 'item',
        format: 'fixed',
        price: 500,
        item: { itemId: 'pixelmon:mystery', qty: 2, unitPrice: 250 },
      } as any);

      const [, , items] = listingsRepository.create.mock.calls[0];
      expect(items[0].itemId).toBe('pixelmon:mystery');
    });

    it('falls back to the catalogue for anything the client did not send', async () => {
      listingsRepository.findCatalogEntries.mockResolvedValue([
        {
          id: 'pixelmon:rare_candy',
          name: 'Rare Candy',
          category: 'consumibles',
          refPrice: 800,
          sprite: null,
        },
      ]);

      await service.create({
        sellerUuid: SELLER,
        kind: 'item',
        format: 'fixed',
        price: 1600,
        item: { itemId: 'pixelmon:rare_candy', qty: 2 },
      } as any);

      const [, , items] = listingsRepository.create.mock.calls[0];
      expect(items[0]).toMatchObject({
        itemName: 'Rare Candy',
        category: 'consumibles',
        unitPrice: 800,
      });
    });

    it('rejects an item listing with no item', async () => {
      await expect(
        service.create({
          sellerUuid: SELLER,
          kind: 'item',
          format: 'fixed',
          price: 100,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('auction duration', () => {
    it('converts durationDays into an ends_at on the SERVER clock', async () => {
      const before = Date.now();

      await service.create({
        sellerUuid: SELLER,
        kind: 'mon',
        format: 'auction',
        price: 5000,
        durationDays: 3,
        mon: { pokemonKey: LIVE_KEY, sourceBox: 2, sourceIndex: 7 },
      } as any);

      const [listing] = listingsRepository.create.mock.calls[0];
      const expected = before + 3 * 24 * 60 * 60 * 1000;

      expect(listing.endsAt).toBeInstanceOf(Date);
      // Within a second of "now + 3 days" — the client sent no timestamp at all.
      expect(Math.abs(listing.endsAt.getTime() - expected)).toBeLessThan(1000);
    });

    it('refuses an auction with neither a duration nor an end', async () => {
      await expect(
        service.create({
          sellerUuid: SELLER,
          kind: 'mon',
          format: 'auction',
          price: 5000,
          mon: { pokemonKey: LIVE_KEY, sourceBox: 2, sourceIndex: 7 },
        } as any),
      ).rejects.toThrow(/durationDays/);
    });

    it('refuses an explicit end date in the past', async () => {
      await expect(
        service.create({
          sellerUuid: SELLER,
          kind: 'mon',
          format: 'auction',
          price: 5000,
          endsAt: new Date(Date.now() - 1000).toISOString(),
          mon: { pokemonKey: LIVE_KEY, sourceBox: 2, sourceIndex: 7 },
        } as any),
      ).rejects.toThrow(/in the past/);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('price history', () => {
    it('returns [] on a single sale — one point is not a trend, and inventing one is worse', async () => {
      listingsRepository.findSalePricesByDex.mockResolvedValue([12000]);
      expect(await service.priceHistory(445)).toEqual([]);
    });

    it('returns the real series once there are two or more sales', async () => {
      listingsRepository.findSalePricesByDex.mockResolvedValue([12000, 15000]);
      expect(await service.priceHistory(445)).toEqual([12000, 15000]);
    });

    it('returns [] when nobody has ever sold one', async () => {
      listingsRepository.findSalePricesByDex.mockResolvedValue([]);
      expect(await service.priceHistory(445)).toEqual([]);
    });
  });
});
