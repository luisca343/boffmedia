import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { WingullController } from './wingull.controller';
import { WingullFacadeService } from './wingull.facade.service';
import { WingullWorldService } from './services/wingull-world.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { Reflector } from '@nestjs/core';

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockFacade = {
  updateBalance: jest.fn(),
  getCurrentBalance: jest.fn(),
  getMoney: jest.fn(),
  getStats: jest.fn(),
  getTeam: jest.fn(),
  getPC: jest.fn(),
  movePokemon: jest.fn(),
  getBattleTeams: jest.fn(),
  updateBattleTeam: jest.fn(),
  getTaxiStops: jest.fn(),
  updateDex: jest.fn(),
  getQuests: jest.fn(),
  sendMessage: jest.fn(),
  globalchat: jest.fn(),
  givePokemon: jest.fn(),
  getPerformance: jest.fn(),
  getRegions: jest.fn(),
  getWeather: jest.fn(),
  updateNPCs: jest.fn(),
  getWorldGuardWorlds: jest.fn(),
  getPlayersOwnedRegions: jest.fn(),
  getAllPlots: jest.fn(),
};

const mockWorldService = {
  getAllTowns: jest.fn(),
  getTownInfo: jest.fn(),
};

const VALID_UUID = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4';

describe('WingullController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [WingullController],
      providers: [
        { provide: WingullFacadeService, useValue: mockFacade },
        { provide: WingullWorldService, useValue: mockWorldService },
        { provide: Logger, useValue: mockLogger },
        ResponseInterceptor,
        Reflector,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
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

  // ── POST /wingull/updateBalance — WingullBalanceDto ──────────────────────

  describe('POST /wingull/updateBalance — WingullBalanceDto validation', () => {
    const VALID_BALANCE = { balance: 1000, type: 'money', uuid: VALID_UUID };

    it('returns 201 and calls facade.updateBalance when body is valid', async () => {
      mockFacade.updateBalance.mockResolvedValue({ success: true });

      const res = await request(app.getHttpServer())
        .post('/wingull/updateBalance')
        .send(VALID_BALANCE);

      expect(res.status).toBe(201);
      expect(mockFacade.updateBalance).toHaveBeenCalledWith(
        expect.objectContaining({
          balance: 1000,
          type: 'money',
          uuid: VALID_UUID,
        }),
      );
    });

    it('returns 400 when uuid is missing', async () => {
      const { uuid: _u, ...body } = VALID_BALANCE;
      const res = await request(app.getHttpServer())
        .post('/wingull/updateBalance')
        .send(body);
      expect(res.status).toBe(400);
    });

    it('returns 400 when uuid is not a valid UUID', async () => {
      const res = await request(app.getHttpServer())
        .post('/wingull/updateBalance')
        .send({ ...VALID_BALANCE, uuid: 'not-a-uuid' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when balance is missing', async () => {
      const { balance: _b, ...body } = VALID_BALANCE;
      const res = await request(app.getHttpServer())
        .post('/wingull/updateBalance')
        .send(body);
      expect(res.status).toBe(400);
    });
  });

  // ── POST /wingull/getCurrentBalance — GetBalanceDto ──────────────────────

  describe('POST /wingull/getCurrentBalance — GetBalanceDto validation', () => {
    it('returns 201 and calls facade.getCurrentBalance when body is valid', async () => {
      mockFacade.getCurrentBalance.mockResolvedValue(5000);

      const res = await request(app.getHttpServer())
        .post('/wingull/getCurrentBalance')
        .send({ uuid: VALID_UUID });

      expect(res.status).toBe(201);
      expect(mockFacade.getCurrentBalance).toHaveBeenCalledWith(
        VALID_UUID,
        undefined,
      );
    });

    it('returns 400 when uuid is not a valid UUID', async () => {
      const res = await request(app.getHttpServer())
        .post('/wingull/getCurrentBalance')
        .send({ uuid: 'bad' });
      expect(res.status).toBe(400);
    });
  });

  // ── POST /wingull/money — UuidDto ────────────────────────────────────────

  describe('POST /wingull/money — UuidDto validation', () => {
    it('returns 201 and calls facade.getMoney', async () => {
      mockFacade.getMoney.mockResolvedValue(3000);

      const res = await request(app.getHttpServer())
        .post('/wingull/money')
        .send({ uuid: VALID_UUID });

      expect(res.status).toBe(201);
      expect(mockFacade.getMoney).toHaveBeenCalledWith(VALID_UUID);
    });

    it('returns 400 when uuid is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/wingull/money')
        .send({});
      expect(res.status).toBe(400);
    });
  });

  // ── POST /wingull/stats — UuidDto ────────────────────────────────────────

  describe('POST /wingull/stats — UuidDto validation', () => {
    it('returns 201 and calls facade.getStats', async () => {
      mockFacade.getStats.mockResolvedValue({ level: 10 });

      const res = await request(app.getHttpServer())
        .post('/wingull/stats')
        .send({ uuid: VALID_UUID });

      expect(res.status).toBe(201);
      expect(mockFacade.getStats).toHaveBeenCalledWith(VALID_UUID);
    });

    it('returns 400 when uuid is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/wingull/stats')
        .send({ uuid: 'bad-uuid' });
      expect(res.status).toBe(400);
    });
  });

  // ── POST /wingull/team — UuidDto ─────────────────────────────────────────

  describe('POST /wingull/team', () => {
    it('returns 201 and calls facade.getTeam', async () => {
      mockFacade.getTeam.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .post('/wingull/team')
        .send({ uuid: VALID_UUID });

      expect(res.status).toBe(201);
      expect(mockFacade.getTeam).toHaveBeenCalledWith(VALID_UUID);
    });
  });

  // ── POST /wingull/pc — UuidDto ───────────────────────────────────────────

  describe('POST /wingull/pc', () => {
    it('returns 201 and calls facade.getPC', async () => {
      mockFacade.getPC.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .post('/wingull/pc')
        .send({ uuid: VALID_UUID });

      expect(res.status).toBe(201);
      expect(mockFacade.getPC).toHaveBeenCalledWith(VALID_UUID);
    });
  });

  // ── POST /wingull/pc/move — MovePokemonDto ───────────────────────────────

  describe('POST /wingull/pc/move', () => {
    it('returns 201 and delegates to facade.movePokemon', async () => {
      mockFacade.movePokemon.mockResolvedValue({ success: true });

      const res = await request(app.getHttpServer())
        .post('/wingull/pc/move')
        .send({
          uuid: VALID_UUID,
          sourceBox: 1,
          sourceIndex: 0,
          destinationBox: -1,
          destinationIndex: 1,
        });

      expect(res.status).toBe(201);
      expect(mockFacade.movePokemon).toHaveBeenCalledTimes(1);
    });
  });

  // ── POST /wingull/battleteams — UuidDto ──────────────────────────────────

  describe('POST /wingull/battleteams', () => {
    it('returns 201 and calls facade.getBattleTeams', async () => {
      mockFacade.getBattleTeams.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .post('/wingull/battleteams')
        .send({ uuid: VALID_UUID });

      expect(res.status).toBe(201);
      expect(mockFacade.getBattleTeams).toHaveBeenCalledWith(VALID_UUID);
    });
  });

  // ── POST /wingull/battleteams/update — UpdateBattleTeamDto ───────────────

  describe('POST /wingull/battleteams/update — UpdateBattleTeamDto validation', () => {
    const VALID_UPDATE = { uuid: VALID_UUID, teamSlot: 0 };

    it('returns 201 and calls facade.updateBattleTeam when body is valid', async () => {
      mockFacade.updateBattleTeam.mockResolvedValue({ success: true });

      const res = await request(app.getHttpServer())
        .post('/wingull/battleteams/update')
        .send(VALID_UPDATE);

      expect(res.status).toBe(201);
      expect(mockFacade.updateBattleTeam).toHaveBeenCalledWith(
        expect.objectContaining({ teamSlot: 0 }),
      );
    });

    it('returns 400 when teamSlot is missing', async () => {
      const { teamSlot: _t, ...body } = VALID_UPDATE;
      const res = await request(app.getHttpServer())
        .post('/wingull/battleteams/update')
        .send(body);
      expect(res.status).toBe(400);
    });

    it('returns 400 when teamSlot exceeds maximum (Max 5)', async () => {
      const res = await request(app.getHttpServer())
        .post('/wingull/battleteams/update')
        .send({ ...VALID_UPDATE, teamSlot: 6 });
      expect(res.status).toBe(400);
    });
  });

  // ── GET /wingull/taxi/stops ───────────────────────────────────────────────

  describe('GET /wingull/taxi/stops', () => {
    it('returns 200 and delegates to facade.getTaxiStops', async () => {
      mockFacade.getTaxiStops.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get('/wingull/taxi/stops');

      expect(res.status).toBe(200);
      expect(mockFacade.getTaxiStops).toHaveBeenCalledTimes(1);
    });
  });

  // ── POST /wingull/updateDex — UuidDto ────────────────────────────────────

  describe('POST /wingull/updateDex', () => {
    it('returns 201 and calls facade.updateDex', async () => {
      mockFacade.updateDex.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .post('/wingull/updateDex')
        .send({ uuid: VALID_UUID });

      expect(res.status).toBe(201);
      expect(mockFacade.updateDex).toHaveBeenCalledWith(VALID_UUID);
    });
  });

  // ── POST /wingull/quests — UuidDto ───────────────────────────────────────

  describe('POST /wingull/quests', () => {
    it('returns 201 and calls facade.getQuests', async () => {
      mockFacade.getQuests.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .post('/wingull/quests')
        .send({ uuid: VALID_UUID });

      expect(res.status).toBe(201);
      expect(mockFacade.getQuests).toHaveBeenCalledWith(VALID_UUID);
    });
  });

  // ── POST /wingull/message — MessageRequestDto ─────────────────────────────

  describe('POST /wingull/message — MessageRequestDto validation', () => {
    const VALID_MSG = { uuid: VALID_UUID, message: 'Hello, trainer!' };

    it('returns 201 and calls facade.sendMessage when body is valid', async () => {
      mockFacade.sendMessage.mockResolvedValue({ success: true });

      const res = await request(app.getHttpServer())
        .post('/wingull/message')
        .send(VALID_MSG);

      expect(res.status).toBe(201);
      expect(mockFacade.sendMessage).toHaveBeenCalledWith(
        VALID_UUID,
        'Hello, trainer!',
      );
    });

    it('returns 400 when message is missing', async () => {
      const { message: _m, ...body } = VALID_MSG;
      const res = await request(app.getHttpServer())
        .post('/wingull/message')
        .send(body);
      expect(res.status).toBe(400);
    });
  });

  // ── POST /wingull/globalchat — MessageRequestDto ──────────────────────────

  describe('POST /wingull/globalchat', () => {
    it('returns 201 and calls facade.globalchat', async () => {
      mockFacade.globalchat.mockResolvedValue({ success: true });

      const res = await request(app.getHttpServer())
        .post('/wingull/globalchat')
        .send({ uuid: VALID_UUID, message: 'Global message!' });

      expect(res.status).toBe(201);
      expect(mockFacade.globalchat).toHaveBeenCalledWith(
        VALID_UUID,
        'Global message!',
      );
    });
  });

  // ── POST /wingull/givePokemon — PokemonGiveRequestDto ────────────────────

  describe('POST /wingull/givePokemon — PokemonGiveRequestDto validation', () => {
    const VALID_GIVE = { uuid: VALID_UUID, pokespec: 'pikachu shiny' };

    it('returns 201 and calls facade.givePokemon when body is valid', async () => {
      mockFacade.givePokemon.mockResolvedValue({ success: true });

      const res = await request(app.getHttpServer())
        .post('/wingull/givePokemon')
        .send(VALID_GIVE);

      expect(res.status).toBe(201);
      expect(mockFacade.givePokemon).toHaveBeenCalledWith(
        VALID_UUID,
        'pikachu shiny',
        true,
      );
    });

    it('returns 400 when pokespec is missing', async () => {
      const { pokespec: _p, ...body } = VALID_GIVE;
      const res = await request(app.getHttpServer())
        .post('/wingull/givePokemon')
        .send(body);
      expect(res.status).toBe(400);
    });

    it('accepts optional sendMessage flag', async () => {
      mockFacade.givePokemon.mockResolvedValue({ success: true });

      const res = await request(app.getHttpServer())
        .post('/wingull/givePokemon')
        .send({ ...VALID_GIVE, sendMessage: false });

      expect(res.status).toBe(201);
      expect(mockFacade.givePokemon).toHaveBeenCalledWith(
        VALID_UUID,
        'pikachu shiny',
        false,
      );
    });
  });

  // ── GET /wingull/performance ─────────────────────────────────────────────

  describe('GET /wingull/performance', () => {
    it('returns 200 and delegates to facade.getPerformance', async () => {
      mockFacade.getPerformance.mockResolvedValue({ tps: 20 });

      const res = await request(app.getHttpServer()).get(
        '/wingull/performance',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getPerformance).toHaveBeenCalledTimes(1);
    });
  });

  // ── GET /wingull/regions ─────────────────────────────────────────────────

  describe('GET /wingull/regions', () => {
    it('returns 200 and delegates to facade.getRegions', async () => {
      mockFacade.getRegions.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get('/wingull/regions');

      expect(res.status).toBe(200);
      expect(mockFacade.getRegions).toHaveBeenCalledTimes(1);
    });
  });

  // ── GET /wingull/weather ─────────────────────────────────────────────────

  describe('GET /wingull/weather', () => {
    it('returns 200 and delegates to facade.getWeather', async () => {
      const mockWeather = { condition: 'SUNNY', temperature: 28 };
      mockFacade.getWeather.mockResolvedValue(mockWeather);

      const res = await request(app.getHttpServer()).get('/wingull/weather');

      expect(res.status).toBe(200);
      expect(mockFacade.getWeather).toHaveBeenCalled();
    });
  });

  // ── POST /wingull/updateNPCs — untyped body ───────────────────────────────

  describe('POST /wingull/updateNPCs', () => {
    it('returns 201 and delegates to facade.updateNPCs', async () => {
      mockFacade.updateNPCs.mockResolvedValue({ success: true });

      const res = await request(app.getHttpServer())
        .post('/wingull/updateNPCs')
        .send({ npcs: [{ id: 1, name: 'Oak' }] });

      expect(res.status).toBe(201);
      expect(mockFacade.updateNPCs).toHaveBeenCalledTimes(1);
    });
  });

  // ── GET /wingull/worldguard-worlds ───────────────────────────────────────

  describe('GET /wingull/worldguard-worlds', () => {
    it('returns 200 and delegates to facade.getWorldGuardWorlds', async () => {
      mockFacade.getWorldGuardWorlds.mockResolvedValue([
        'world',
        'world_nether',
      ]);

      const res = await request(app.getHttpServer()).get(
        '/wingull/worldguard-worlds',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getWorldGuardWorlds).toHaveBeenCalledTimes(1);
    });
  });

  // ── GET /wingull/owned-regions/:uuid ─────────────────────────────────────

  describe('GET /wingull/owned-regions/:uuid', () => {
    it('returns 200 and passes uuid string to facade', async () => {
      mockFacade.getPlayersOwnedRegions.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        `/wingull/owned-regions/${VALID_UUID}`,
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getPlayersOwnedRegions).toHaveBeenCalledWith(
        VALID_UUID,
      );
    });
  });

  // ── GET /wingull/plots ────────────────────────────────────────────────────

  describe('GET /wingull/plots', () => {
    it('returns 200 and delegates to facade.getAllPlots', async () => {
      mockFacade.getAllPlots.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get('/wingull/plots');

      expect(res.status).toBe(200);
      expect(mockFacade.getAllPlots).toHaveBeenCalledTimes(1);
    });
  });

  // ── GET /wingull/towns ────────────────────────────────────────────────────

  describe('GET /wingull/towns', () => {
    it('returns 200 and delegates to wingullWorldService.getAllTowns', async () => {
      mockWorldService.getAllTowns.mockResolvedValue([
        'ARRECIFE_WINGULL',
        'PUERTO_WINGULL',
      ]);

      const res = await request(app.getHttpServer()).get('/wingull/towns');

      expect(res.status).toBe(200);
      expect(mockWorldService.getAllTowns).toHaveBeenCalledTimes(1);
    });
  });

  // ── GET /wingull/towns/:townName ─────────────────────────────────────────

  describe('GET /wingull/towns/:townName', () => {
    it('returns 200 and passes townName to wingullWorldService.getTownInfo', async () => {
      const mockTown = {
        name: 'ARRECIFE_WINGULL',
        fill: 0x5500bfff,
        border: 0x00bfff,
      };
      mockWorldService.getTownInfo.mockResolvedValue(mockTown);

      const res = await request(app.getHttpServer()).get(
        '/wingull/towns/ARRECIFE_WINGULL',
      );

      expect(res.status).toBe(200);
      expect(mockWorldService.getTownInfo).toHaveBeenCalledWith(
        'ARRECIFE_WINGULL',
      );
    });
  });

  // ── GlobalExceptionFilter — error shape contract ─────────────────────────

  describe('GlobalExceptionFilter — error shape contract', () => {
    it('all error responses include statusCode, error, message, timestamp, path', async () => {
      const res = await request(app.getHttpServer())
        .post('/wingull/updateBalance')
        .send({});

      expect(res.body).toHaveProperty('statusCode', 400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('path');
    });
  });
});
