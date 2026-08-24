import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { ServiceUnavailableException } from '@nestjs/common';
import { WingullRepository } from './wingull.repository';
import { WingullSQL2Service } from '@/_utils/WingullSQL2Service';

describe('WingullRepository', () => {
  let repository: WingullRepository;
  let sql: jest.Mocked<Pick<WingullSQL2Service, 'query'>>;

  /** Captures the SQL and params the repository actually sent. */
  const lastCall = () => sql.query.mock.calls[sql.query.mock.calls.length - 1];

  beforeEach(async () => {
    sql = { query: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WingullRepository,
        { provide: WingullSQL2Service, useValue: sql },
        {
          provide: Logger,
          useValue: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
        },
      ],
    }).compile();
    repository = module.get(WingullRepository);
  });

  describe('getAllPlots', () => {
    it('reads Teras tables, never WorldGuard ones', async () => {
      sql.query.mockResolvedValue([[], []] as any);
      await repository.getAllPlots();

      const [query] = lastCall();
      expect(query).toContain('teras_region');
      expect(query).toContain('teras_plot');
      expect(query).not.toContain('worldguard');
    });

    it('narrows to ownable types in SQL, so a null owner means one thing', async () => {
      sql.query.mockResolvedValue([[], []] as any);
      await repository.getAllPlots();

      const [query, params] = lastCall();
      expect(query).toMatch(/WHERE\s+r\.type IN \(\?, \?\)/);
      // Parameterised rather than interpolated: these reach SQL as bound values.
      expect(params).toEqual(['parcela', 'tienda']);
    });

    it('keeps unowned plots, with no owner rather than a fabricated one', async () => {
      sql.query.mockResolvedValue([
        [
          {
            regionId: 'pueblo_mizu__parcela_1',
            type: 'parcela',
            ownerUuid: null,
            ownedSince: null,
          },
        ],
        [],
      ] as any);

      // A LEFT JOIN result: the parcela exists, nobody bought it. Dropping it here would make
      // urbanismo lose every plot still for sale.
      await expect(repository.getAllPlots()).resolves.toEqual([
        {
          regionId: 'pueblo_mizu__parcela_1',
          type: 'parcela',
          ownerUuid: undefined,
          ownedSince: undefined,
        },
      ]);
    });

    it('does not parse the region name — the id is passed through whole', async () => {
      // The old implementation split on '__' and dropped anything that did not match, silently.
      // A region id that does not follow the convention must now survive intact.
      sql.query.mockResolvedValue([
        [
          {
            regionId: 'arena_evento',
            type: 'parcela',
            ownerUuid: 'uuid-1',
            ownedSince: 1700000000,
          },
        ],
        [],
      ] as any);

      const plots = await repository.getAllPlots();
      expect(plots).toHaveLength(1);
      expect(plots[0].regionId).toBe('arena_evento');
      expect(plots[0].ownerUuid).toBe('uuid-1');
    });

    it('reports an unreachable database as 503, not as an empty world', async () => {
      // Answering [] would tell the census that nobody owns any land.
      sql.query.mockRejectedValue(
        Object.assign(new Error('connect ETIMEDOUT'), { code: 'ETIMEDOUT' }),
      );
      await expect(repository.getAllPlots()).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });
  });

  describe('getPlayersOwnedRegions', () => {
    it('binds the uuid as a parameter', async () => {
      sql.query.mockResolvedValue([[], []] as any);
      await repository.getPlayersOwnedRegions('uuid-1');

      const [query, params] = lastCall();
      expect(query).toContain('teras_plot');
      expect(query).toContain('WHERE p.owner_uuid = ?');
      expect(params).toEqual(['uuid-1']);
    });

    it('returns the regions, not the player it was asked about', async () => {
      sql.query.mockResolvedValue([
        [
          {
            regionId: 'pueblo_mizu__parcela_1',
            type: 'parcela',
            dimension: 'minecraft:overworld',
            ownedSince: 1700000000,
          },
        ],
        [],
      ] as any);

      await expect(
        repository.getPlayersOwnedRegions('uuid-1'),
      ).resolves.toEqual([
        {
          regionId: 'pueblo_mizu__parcela_1',
          type: 'parcela',
          dimension: 'minecraft:overworld',
          ownedSince: 1700000000,
        },
      ]);
    });

    it('reports an unreachable database as 503', async () => {
      sql.query.mockRejectedValue(
        Object.assign(new Error('connect ECONNREFUSED'), {
          code: 'ECONNREFUSED',
        }),
      );
      await expect(
        repository.getPlayersOwnedRegions('uuid-1'),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });
  });
});
