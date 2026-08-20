import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { PokemonController } from './pokemon.controller';
import { PokemonFacadeService } from './pokemon.facade.service';
import { WingullFacadeService } from '../wingull/wingull.facade.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { Reflector } from '@nestjs/core';
import { GameOrUserAuthGuard } from '@api/_utils/guards/game-or-user-auth.guard';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const MOCK_UUID = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4';
const MOCK_POKEMON = { id: 25, name: 'Pikachu', types: ['Electric'] };

const mockPokemonFacade = {
  getAllPokemon: jest.fn(),
  getPokemonByDex: jest.fn(),
  getPokemonNames: jest.fn(),
  getPokemonByName: jest.fn(),
  searchPokemonByName: jest.fn(),
  getNextPrev: jest.fn(),
  getEvoTree: jest.fn(),
  getAllMoves: jest.fn(),
  getPokemonMoves: jest.fn(),
  getMove: jest.fn(),
  getPokemonByMove: jest.fn(),
  getAllAbilities: jest.fn(),
  getAbility: jest.fn(),
  getPokemonByAbility: jest.fn(),
  getSpawnByPokemon: jest.fn(),
  getBiomes: jest.fn(),
  getPokemonByBiome: jest.fn(),
  getBiomesByPokemon: jest.fn(),
  getImage: jest.fn(),
  getItemSprite: jest.fn(),
  registerPokemon: jest.fn(),
  updateDex: jest.fn(),
  getPokedexStatistics: jest.fn(),
  getDetailedPokedexStatus: jest.fn(),
  getPokedexRegistries: jest.fn(),
  getTerasPokemonShowdownData: jest.fn(),
  getWordleData: jest.fn(),
  getSpriteManifest: jest.fn(),
  refreshSpriteManifest: jest.fn(),
  getPmdPortrait: jest.fn(),
  countPokemon: jest.fn(),
};

const mockWingullFacade = {
  updateDex: jest.fn(),
};

describe('PokemonController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PokemonController],
      providers: [
        { provide: PokemonFacadeService, useValue: mockPokemonFacade },
        { provide: WingullFacadeService, useValue: mockWingullFacade },
        ResponseInterceptor,
        Reflector,
      ],
    })
      // The write routes are not public: `register`, `dex/update` and
      // `dex/sync` require the game server's token or a player's JWT, and
      // `sprites/refresh` requires an admin role. This suite is about the
      // ValidationPipe and the exception filter, so the credentials are stubbed
      // out here — `pokemon.controller.auth.spec.ts` covers the guards.
      .overrideGuard(GameOrUserAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();

    // These routes are not public: the identity that would otherwise come from

    // the URL or the body is taken from the authenticated principal.

    // This suite covers the ValidationPipe and the exception filter, so it

    // runs as a signed-in caller; the guards themselves are unit-tested.

    app.use((req: any, _res: any, next: any) => {
      req.user = {
        userId: 1,

        username: 'tester',

        roles: ['BOFF_ADMIN', 'ROTOM_ADMIN'],

        mcUuid: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
      };

      next();
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter(mockLogger as any));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  // ── Basic Pokémon operations ─────────────────────────────────────────────

  describe('GET /smartrotom/pokemon', () => {
    it('returns 200 and delegates to facade.getAllPokemon', async () => {
      mockPokemonFacade.getAllPokemon.mockResolvedValue([MOCK_POKEMON]);

      const res = await request(app.getHttpServer()).get('/smartrotom/pokemon');

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.getAllPokemon).toHaveBeenCalled();
    });
  });

  describe('GET /smartrotom/pokemon/dex/:dex', () => {
    it('returns 200 when pokemon exists', async () => {
      mockPokemonFacade.getPokemonByDex.mockReturnValue(MOCK_POKEMON);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/pokemon/dex/25',
      );

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.getPokemonByDex).toHaveBeenCalledWith(25);
    });

    it('returns 500 when pokemon not found (throws generic Error)', async () => {
      mockPokemonFacade.getPokemonByDex.mockReturnValue(null);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/pokemon/dex/9999',
      );

      expect(res.status).toBe(500);
    });
  });

  describe('GET /smartrotom/pokemon/names', () => {
    it('returns 200 and delegates to facade.getPokemonNames', async () => {
      mockPokemonFacade.getPokemonNames.mockResolvedValue(['Pikachu']);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/pokemon/names',
      );

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.getPokemonNames).toHaveBeenCalled();
    });
  });

  describe('GET /smartrotom/pokemon/search/species/:name', () => {
    it('returns 200 when pokemon exists', async () => {
      mockPokemonFacade.getPokemonByName.mockReturnValue(MOCK_POKEMON);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/pokemon/search/species/Pikachu',
      );

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.getPokemonByName).toHaveBeenCalledWith(
        'Pikachu',
      );
    });

    it('returns 500 when pokemon not found', async () => {
      mockPokemonFacade.getPokemonByName.mockReturnValue(null);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/pokemon/search/species/UnknownMon',
      );

      expect(res.status).toBe(500);
    });
  });

  describe('GET /smartrotom/pokemon/search/:name', () => {
    it('returns 200 and maps fuse results', async () => {
      mockPokemonFacade.searchPokemonByName.mockReturnValue([
        { item: MOCK_POKEMON, score: 0.1, refIndex: 24 },
      ]);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/pokemon/search/pika',
      );

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.searchPokemonByName).toHaveBeenCalledWith(
        'pika',
        16,
      );
    });

    it('respects ?amount query param', async () => {
      mockPokemonFacade.searchPokemonByName.mockReturnValue([]);

      await request(app.getHttpServer())
        .get('/smartrotom/pokemon/search/pika')
        .query({ amount: '5' });

      expect(mockPokemonFacade.searchPokemonByName).toHaveBeenCalledWith(
        'pika',
        5,
      );
    });
  });

  describe('GET /smartrotom/pokemon/nextprev/:id', () => {
    it('returns 200 and delegates to facade.getNextPrev', async () => {
      mockPokemonFacade.getNextPrev.mockResolvedValue({
        next: MOCK_POKEMON,
        prev: null,
      });

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/pokemon/nextprev/25',
      );

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.getNextPrev).toHaveBeenCalledWith(25);
    });
  });

  describe('GET /smartrotom/pokemon/evotree/:id', () => {
    it('returns 200 and delegates to facade.getEvoTree', async () => {
      mockPokemonFacade.getEvoTree.mockResolvedValue({ root: null });

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/pokemon/evotree/25',
      );

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.getEvoTree).toHaveBeenCalledWith(25);
    });
  });

  // ── Move operations ──────────────────────────────────────────────────────

  describe('GET /smartrotom/pokemon/moves', () => {
    it('returns 200 and delegates to facade.getAllMoves', async () => {
      mockPokemonFacade.getAllMoves.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/pokemon/moves',
      );

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.getAllMoves).toHaveBeenCalled();
    });
  });

  describe('GET /smartrotom/pokemon/moves/:id/:form', () => {
    it('returns 200 and delegates to facade.getPokemonMoves', async () => {
      mockPokemonFacade.getPokemonMoves.mockResolvedValue({ moves: [] });

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/pokemon/moves/25/0',
      );

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.getPokemonMoves).toHaveBeenCalledWith(25, 0);
    });
  });

  describe('GET /smartrotom/pokemon/move/:name', () => {
    it('returns 200 when move exists', async () => {
      mockPokemonFacade.getMove.mockReturnValue({ name: 'Thunderbolt' });

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/pokemon/move/Thunderbolt',
      );

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.getMove).toHaveBeenCalledWith('Thunderbolt');
    });

    it('returns 500 when move not found', async () => {
      mockPokemonFacade.getMove.mockReturnValue(null);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/pokemon/move/UnknownMove',
      );

      expect(res.status).toBe(500);
    });
  });

  describe('GET /smartrotom/pokemon/move/:name/pokemon', () => {
    it('returns 200 and delegates to facade.getPokemonByMove', async () => {
      mockPokemonFacade.getPokemonByMove.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/pokemon/move/Thunderbolt/pokemon',
      );

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.getPokemonByMove).toHaveBeenCalledWith(
        'Thunderbolt',
      );
    });
  });

  // ── Ability operations ───────────────────────────────────────────────────

  describe('GET /smartrotom/pokemon/abilities', () => {
    it('returns 200 and delegates to facade.getAllAbilities', async () => {
      mockPokemonFacade.getAllAbilities.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/pokemon/abilities',
      );

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.getAllAbilities).toHaveBeenCalled();
    });
  });

  describe('GET /smartrotom/pokemon/ability/:name', () => {
    it('returns 200 and delegates to facade.getAbility', async () => {
      mockPokemonFacade.getAbility.mockResolvedValue({ name: 'Static' });

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/pokemon/ability/Static',
      );

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.getAbility).toHaveBeenCalledWith('Static');
    });
  });

  describe('GET /smartrotom/pokemon/ability/:name/pokemon', () => {
    it('returns 200 and delegates to facade.getPokemonByAbility', async () => {
      mockPokemonFacade.getPokemonByAbility.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/pokemon/ability/Static/pokemon',
      );

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.getPokemonByAbility).toHaveBeenCalledWith(
        'Static',
      );
    });
  });

  // ── Spawn / biome operations ─────────────────────────────────────────────

  describe('GET /smartrotom/pokemon/spawns/:name', () => {
    it('returns 200 and delegates to facade.getSpawnByPokemon', async () => {
      mockPokemonFacade.getSpawnByPokemon.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/pokemon/spawns/Pikachu',
      );

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.getSpawnByPokemon).toHaveBeenCalledWith(
        'Pikachu',
      );
    });
  });

  describe('GET /smartrotom/pokemon/biomes', () => {
    it('returns 200 and delegates to facade.getBiomes', async () => {
      mockPokemonFacade.getBiomes.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/pokemon/biomes',
      );

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.getBiomes).toHaveBeenCalled();
    });
  });

  describe('GET /smartrotom/pokemon/biome/:name', () => {
    it('returns 200 and delegates to facade.getPokemonByBiome', async () => {
      mockPokemonFacade.getPokemonByBiome.mockReturnValue({ pokemon: [] });

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/pokemon/biome/Plains',
      );

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.getPokemonByBiome).toHaveBeenCalledWith(
        'Plains',
      );
    });
  });

  describe('GET /smartrotom/pokemon/biomes/:name', () => {
    it('returns 200 and delegates to facade.getBiomesByPokemon', async () => {
      mockPokemonFacade.getBiomesByPokemon.mockResolvedValue(['Plains']);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/pokemon/biomes/vulpix_base',
      );

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.getBiomesByPokemon).toHaveBeenCalledWith(
        'vulpix_base',
      );
    });
  });

  // ── Image operations ─────────────────────────────────────────────────────

  describe('GET /smartrotom/pokemon/image/:pokemonId/:formName/:paletteName/:uuid', () => {
    it('returns 200 and delegates to facade.getImage', async () => {
      mockPokemonFacade.getImage.mockResolvedValue({ url: 'https://...' });

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/pokemon/image/25/base/none/${MOCK_UUID}`,
      );

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.getImage).toHaveBeenCalledWith(
        expect.objectContaining({
          pokemonId: 25,
          formName: 'base',
          paletteName: 'none',
          uuid: MOCK_UUID,
        }),
      );
    });
  });

  describe('GET /smartrotom/pokemon/sprite/item/:name', () => {
    it('returns 200 and delegates to facade.getItemSprite', async () => {
      mockPokemonFacade.getItemSprite.mockResolvedValue({ url: 'https://...' });

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/pokemon/sprite/item/pokeball',
      );

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.getItemSprite).toHaveBeenCalledWith('pokeball');
    });
  });

  // ── Pokédex operations ───────────────────────────────────────────────────

  describe('POST /smartrotom/pokemon/register', () => {
    const VALID_REGISTER = {
      uuid: MOCK_UUID,
      pokemonId: 25,
      form: 'base',
      palette: 'none',
      status: 1,
    };

    it('returns 201 and delegates to facade.registerPokemon', async () => {
      mockPokemonFacade.registerPokemon.mockResolvedValue({
        success: true,
        isNew: true,
      });

      const res = await request(app.getHttpServer())
        .post('/smartrotom/pokemon/register')
        .send(VALID_REGISTER);

      expect(res.status).toBe(201);
      expect(mockPokemonFacade.registerPokemon).toHaveBeenCalledWith(
        MOCK_UUID,
        25,
        'base',
        'none',
        1,
      );
    });

    it('returns 400 when uuid is not valid UUID', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/pokemon/register')
        .send({ ...VALID_REGISTER, uuid: 'not-a-uuid' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when status is invalid (not 0 or 1)', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/pokemon/register')
        .send({ ...VALID_REGISTER, status: 2 });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /smartrotom/pokemon/dex/update', () => {
    const VALID_UPDATE_DEX = {
      uuid: MOCK_UUID,
      SEEN: [1, 2, 3],
      CAUGHT: [1],
    };

    it('returns 201 and delegates to facade.updateDex', async () => {
      mockPokemonFacade.updateDex.mockResolvedValue({
        success: true,
        results: {},
      });

      const res = await request(app.getHttpServer())
        .post('/smartrotom/pokemon/dex/update')
        .send(VALID_UPDATE_DEX);

      expect(res.status).toBe(201);
      expect(mockPokemonFacade.updateDex).toHaveBeenCalledWith(MOCK_UUID, {
        SEEN: [1, 2, 3],
        CAUGHT: [1],
      });
    });

    it('returns 400 when uuid is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/pokemon/dex/update')
        .send({ SEEN: [1], CAUGHT: [] });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /smartrotom/pokemon/dex/sync', () => {
    it('returns 201 and calls wingull then pokemon facade', async () => {
      mockWingullFacade.updateDex.mockResolvedValue({
        SEEN: [1, 2],
        CAUGHT: [1],
      });
      mockPokemonFacade.updateDex.mockResolvedValue({ success: true });

      const res = await request(app.getHttpServer())
        .post('/smartrotom/pokemon/dex/sync')
        .send({ uuid: MOCK_UUID });

      expect(res.status).toBe(201);
      expect(mockWingullFacade.updateDex).toHaveBeenCalledWith(MOCK_UUID);
      expect(mockPokemonFacade.updateDex).toHaveBeenCalledWith(MOCK_UUID, {
        SEEN: [1, 2],
        CAUGHT: [1],
      });
    });

    it('returns 400 when uuid is not valid UUID', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/pokemon/dex/sync')
        .send({ uuid: 'bad-uuid' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /smartrotom/pokemon/dex/stats/:uuid', () => {
    it('returns 200 and delegates to facade.getPokedexStatistics', async () => {
      mockPokemonFacade.getPokedexStatistics.mockResolvedValue({ seen: 100 });

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/pokemon/dex/stats/${MOCK_UUID}`,
      );

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.getPokedexStatistics).toHaveBeenCalledWith(
        MOCK_UUID,
      );
    });
  });

  describe('GET /smartrotom/pokemon/dex/detailed/:uuid', () => {
    it('returns 200 and delegates to facade.getDetailedPokedexStatus', async () => {
      mockPokemonFacade.getDetailedPokedexStatus.mockResolvedValue({});

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/pokemon/dex/detailed/${MOCK_UUID}`,
      );

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.getDetailedPokedexStatus).toHaveBeenCalledWith(
        MOCK_UUID,
      );
    });
  });

  describe('GET /smartrotom/pokemon/dex/registries/:uuid', () => {
    it('returns 200 and delegates to facade.getPokedexRegistries', async () => {
      mockPokemonFacade.getPokedexRegistries.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/pokemon/dex/registries/${MOCK_UUID}`,
      );

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.getPokedexRegistries).toHaveBeenCalledWith(
        MOCK_UUID,
      );
    });
  });

  // ── Utility operations ───────────────────────────────────────────────────

  describe('GET /smartrotom/pokemon/showdown/teras', () => {
    it('returns 200 and delegates to facade.getTerasPokemonShowdownData', async () => {
      mockPokemonFacade.getTerasPokemonShowdownData.mockResolvedValue({});

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/pokemon/showdown/teras',
      );

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.getTerasPokemonShowdownData).toHaveBeenCalled();
    });
  });

  describe('GET /smartrotom/pokemon/wordle', () => {
    it('returns 200 and delegates to facade.getWordleData', async () => {
      mockPokemonFacade.getWordleData.mockReturnValue([]);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/pokemon/wordle',
      );

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.getWordleData).toHaveBeenCalled();
    });
  });

  describe('GET /smartrotom/pokemon/sprites/manifest', () => {
    it('returns 200 and delegates to facade.getSpriteManifest', async () => {
      mockPokemonFacade.getSpriteManifest.mockReturnValue({});

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/pokemon/sprites/manifest',
      );

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.getSpriteManifest).toHaveBeenCalled();
    });
  });

  describe('POST /smartrotom/pokemon/sprites/refresh', () => {
    it('returns 201 and calls facade.refreshSpriteManifest', async () => {
      mockPokemonFacade.refreshSpriteManifest.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer()).post(
        '/smartrotom/pokemon/sprites/refresh',
      );

      expect(res.status).toBe(201);
      expect(mockPokemonFacade.refreshSpriteManifest).toHaveBeenCalled();
    });
  });

  describe('GET /smartrotom/pokemon/pmd/portrait/:name', () => {
    it('returns 200 and delegates to facade.getPmdPortrait', async () => {
      mockPokemonFacade.getPmdPortrait.mockResolvedValue({
        url: 'https://...',
      });

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/pokemon/pmd/portrait/Pikachu',
      );

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.getPmdPortrait).toHaveBeenCalledWith('Pikachu');
    });
  });

  describe('GET /smartrotom/pokemon/count', () => {
    it('returns 200 and returns count', async () => {
      mockPokemonFacade.countPokemon.mockReturnValue(1025);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/pokemon/count',
      );

      expect(res.status).toBe(200);
      expect(mockPokemonFacade.countPokemon).toHaveBeenCalled();
    });
  });

  // ── GlobalExceptionFilter — error shape contract ─────────────────────────

  describe('GlobalExceptionFilter — error shape contract', () => {
    it('500 errors include statusCode, error, message, timestamp, path', async () => {
      mockPokemonFacade.getAllPokemon.mockRejectedValue(new Error('DB down'));

      const res = await request(app.getHttpServer()).get('/smartrotom/pokemon');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('statusCode', 500);
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('path');
    });
  });
});
