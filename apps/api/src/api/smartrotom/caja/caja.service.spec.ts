import { Test } from '@nestjs/testing';
import { CajaService } from './caja.service';
import { CajaRepository } from './repositories/caja.repository';

describe('CajaService', () => {
  let service: CajaService;
  const spend = jest.fn();
  const spendByIds = jest.fn();
  const reserve = jest.fn();
  const reserveByIds = jest.fn();
  const confirm = jest.fn();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CajaService,
        {
          provide: CajaRepository,
          useValue: { spend, spendByIds, reserve, reserveByIds, confirm },
        },
      ],
    }).compile();
    service = module.get(CajaService);
    spend.mockReset();
    spendByIds.mockReset();
    reserve.mockReset();
    reserveByIds.mockReset();
    confirm.mockReset();
  });

  it('splits spent rows into chested items and party Pokémon', async () => {
    spend.mockResolvedValue([
      {
        id: 1,
        itemId: 'minecraft:diamond',
        itemType: 'item',
        itemData: null,
        granted: 5,
      },
      {
        id: 2,
        itemId: 'Incineroar de Wolfey',
        itemType: 'pokemon',
        itemData: 'Incineroar lvl:50',
        granted: 1,
      },
    ]);

    const res = await service.claim('u', 'arcade');

    expect(res.objetos).toEqual([{ id: 'minecraft:diamond', cantidad: 5 }]);
    expect(res.pokemon).toEqual([{ spec: 'Incineroar lvl:50', cantidad: 1 }]);
  });

  it('falls back to itemId when a Pokémon row has no spec', async () => {
    spend.mockResolvedValue([
      {
        id: 3,
        itemId: 'pikachu',
        itemType: 'pokemon',
        itemData: null,
        granted: 1,
      },
    ]);
    const res = await service.claim('u', 'arcade');
    expect(res.pokemon).toEqual([{ spec: 'pikachu', cantidad: 1 }]);
  });

  it('uses the id selector when ids are given, else spends the whole source', async () => {
    spendByIds.mockResolvedValue([]);
    await service.claim('u', 'arcade', [7, 8]);
    expect(spendByIds).toHaveBeenCalledWith('u', [7, 8]);
    expect(spend).not.toHaveBeenCalled();

    spend.mockResolvedValue([]);
    await service.claim('u', 'mine');
    expect(spend).toHaveBeenCalledWith('u', 'mine');
  });

  it('returns two empty channels when nothing is owed', async () => {
    spend.mockResolvedValue([]);
    const res = await service.claim('u', 'mine');
    expect(res).toEqual({ objetos: [], pokemon: [] });
  });

  describe('reserve', () => {
    it('returns the reservationId alongside the same split grant', async () => {
      reserve.mockResolvedValue({
        reservationId: 'r-1',
        rows: [
          {
            id: 1,
            itemId: 'minecraft:diamond',
            itemType: 'item',
            itemData: null,
            granted: 5,
          },
          {
            id: 2,
            itemId: 'x',
            itemType: 'pokemon',
            itemData: 'Incineroar lvl:50',
            granted: 1,
          },
        ],
      });

      const res = await service.reserve('u', 'arcade');

      expect(res.reservationId).toBe('r-1');
      expect(res.objetos).toEqual([{ id: 'minecraft:diamond', cantidad: 5 }]);
      expect(res.pokemon).toEqual([{ spec: 'Incineroar lvl:50', cantidad: 1 }]);
    });

    it('uses the id selector when ids are given, else reserves the whole source', async () => {
      reserveByIds.mockResolvedValue({ reservationId: null, rows: [] });
      await service.reserve('u', 'arcade', [7, 8]);
      expect(reserveByIds).toHaveBeenCalledWith('u', [7, 8]);
      expect(reserve).not.toHaveBeenCalled();

      reserve.mockResolvedValue({ reservationId: null, rows: [] });
      await service.reserve('u', 'mine');
      expect(reserve).toHaveBeenCalledWith('u', 'mine');
    });

    it('carries a null reservationId and empty channels when nothing is owed', async () => {
      reserve.mockResolvedValue({ reservationId: null, rows: [] });
      const res = await service.reserve('u', 'mine');
      expect(res).toEqual({ reservationId: null, objetos: [], pokemon: [] });
    });
  });

  describe('confirm', () => {
    it('reports how many rows the repository spent', async () => {
      confirm.mockResolvedValue(2);
      const res = await service.confirm('u', 'r-1');
      expect(confirm).toHaveBeenCalledWith('u', 'r-1');
      expect(res).toEqual({ confirmed: 2 });
    });

    it('reports 0 for a replayed or expired reservation', async () => {
      confirm.mockResolvedValue(0);
      const res = await service.confirm('u', 'r-gone');
      expect(res).toEqual({ confirmed: 0 });
    });
  });
});
