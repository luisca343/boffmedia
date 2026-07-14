import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { StarbankController } from './starbank.controller';
import { StarbankFacadeService } from './starbank.facade.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { GameOrUserAuthGuard } from '@api/_utils/guards/game-or-user-auth.guard';
import { Reflector } from '@nestjs/core';

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockFacade = {
  getAllAccounts: jest.fn(),
  getAccounts: jest.fn(),
  getBalance: jest.fn(),
  createAccount: jest.fn(),
  createMainAccount: jest.fn(),
  transfer: jest.fn(),
  transferFromMain: jest.fn(),
  shop: jest.fn(),
  trainerDefeat: jest.fn(),
  getTransactions: jest.fn(),
  getTransactionsByUUID: jest.fn(),
  getTransfers: jest.fn(),
  getTransfersByUUID: jest.fn(),
};

describe('StarbankController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [StarbankController],
      providers: [
        { provide: StarbankFacadeService, useValue: mockFacade },
        { provide: Logger, useValue: mockLogger },
        ResponseInterceptor,
        Reflector,
      ],
    })
      // The transfer routes are guarded by GameOrUserAuthGuard (JWT/server-key);
      // this suite exercises validation + envelope, so let the guard through.
      .overrideGuard(GameOrUserAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

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

  describe('POST /smartrotom/starbank/transfer — CreateTransferDto validation', () => {
    const validBody = { from: 1, to: 2, amount: 100, concept: 'payment' };

    it('returns 400 when body is empty', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/starbank/transfer')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        statusCode: 400,
        error: expect.any(String),
        message: expect.any(String),
        timestamp: expect.any(String),
        path: '/smartrotom/starbank/transfer',
      });
    });

    it('returns 400 when amount is 0 (Min(1) violated)', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/starbank/transfer')
        .send({ ...validBody, amount: 0 });

      expect(res.status).toBe(400);
      expect(res.body.statusCode).toBe(400);
    });

    it('returns 400 when amount is negative', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/starbank/transfer')
        .send({ ...validBody, amount: -50 });

      expect(res.status).toBe(400);
    });

    it('returns 400 when from is missing', async () => {
      const { from: _from, ...body } = validBody;
      const res = await request(app.getHttpServer())
        .post('/smartrotom/starbank/transfer')
        .send(body);

      expect(res.status).toBe(400);
    });

    it('returns 400 when concept is empty string', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/starbank/transfer')
        .send({ ...validBody, concept: '' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when unknown field is present (forbidNonWhitelisted)', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/starbank/transfer')
        .send({ ...validBody, hackerField: 'x' });

      expect(res.status).toBe(400);
    });

    it('calls facade.transfer when body is valid', async () => {
      mockFacade.transfer.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/starbank/transfer')
        .send(validBody);

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.transfer).toHaveBeenCalledWith(1, 2, 100, 'payment', {
        mcUuid: undefined,
        serverAuthed: false,
      });
    });
  });

  describe('GET /smartrotom/starbank/balance/:uuid', () => {
    it('returns balance from facade', async () => {
      mockFacade.getBalance.mockResolvedValue({ balance: 1500 });

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/starbank/balance/67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getBalance).toHaveBeenCalledWith(
        '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
      );
    });
  });

  // ── GET /smartrotom/starbank/accounts ────────────────────────────────────

  describe('GET /smartrotom/starbank/accounts', () => {
    it('returns 200 and delegates to facade.getAllAccounts', async () => {
      mockFacade.getAllAccounts.mockResolvedValue([
        { id: 1, uuid: 'test', balance: 100 },
      ]);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/starbank/accounts',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getAllAccounts).toHaveBeenCalledTimes(1);
    });
  });

  // ── GET /smartrotom/starbank/accounts/:uuid ───────────────────────────────

  describe('GET /smartrotom/starbank/accounts/:uuid', () => {
    it('returns 200 and passes uuid to facade.getAccounts', async () => {
      const VALID_UUID = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4';
      mockFacade.getAccounts.mockResolvedValue([
        { id: 1, uuid: VALID_UUID, balance: 500 },
      ]);

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/starbank/accounts/${VALID_UUID}`,
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getAccounts).toHaveBeenCalledWith(VALID_UUID);
    });
  });

  // ── POST /smartrotom/starbank/transfer/from-main — TransferFromMainDto ────

  describe('POST /smartrotom/starbank/transfer/from-main — TransferFromMainDto validation', () => {
    const VALID_UUID = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4';
    const validBody = {
      uuid: VALID_UUID,
      to: 2,
      amount: 100,
      concept: 'payment',
    };

    it('returns 400 when uuid is missing', async () => {
      const { uuid: _uuid, ...body } = validBody;
      const res = await request(app.getHttpServer())
        .post('/smartrotom/starbank/transfer/from-main')
        .send(body);

      expect(res.status).toBe(400);
    });

    it('returns 400 when uuid is not a valid UUID', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/starbank/transfer/from-main')
        .send({ ...validBody, uuid: 'not-a-uuid' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when amount is 0 (Min(1) violated)', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/starbank/transfer/from-main')
        .send({ ...validBody, amount: 0 });

      expect(res.status).toBe(400);
    });

    it('returns 400 when concept is empty', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/starbank/transfer/from-main')
        .send({ ...validBody, concept: '' });

      expect(res.status).toBe(400);
    });

    it('calls facade.transferFromMain when body is valid', async () => {
      mockFacade.transferFromMain.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/starbank/transfer/from-main')
        .send(validBody);

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.transferFromMain).toHaveBeenCalledWith(
        VALID_UUID,
        2,
        100,
        'payment',
        { mcUuid: undefined, serverAuthed: false },
      );
    });
  });

  // ── POST /smartrotom/starbank/shop — CreateShopTransactionDto ────────────

  describe('POST /smartrotom/starbank/shop — CreateShopTransactionDto validation', () => {
    const validBody = {
      uuid: 'player-uuid',
      npcName: 'ShopKeeper',
      itemName: 'Potion',
      operation: 'buy',
      unitPrice: 50,
      count: 3,
    };

    it('returns 400 when uuid is missing', async () => {
      const { uuid: _uuid, ...body } = validBody;
      const res = await request(app.getHttpServer())
        .post('/smartrotom/starbank/shop')
        .send(body);

      expect(res.status).toBe(400);
    });

    it('returns 400 when unitPrice is missing', async () => {
      const { unitPrice: _p, ...body } = validBody;
      const res = await request(app.getHttpServer())
        .post('/smartrotom/starbank/shop')
        .send(body);

      expect(res.status).toBe(400);
    });

    it('returns 400 when count is missing', async () => {
      const { count: _c, ...body } = validBody;
      const res = await request(app.getHttpServer())
        .post('/smartrotom/starbank/shop')
        .send(body);

      expect(res.status).toBe(400);
    });

    it('calls facade.shop when body is valid', async () => {
      mockFacade.shop.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/starbank/shop')
        .send(validBody);

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.shop).toHaveBeenCalledWith(
        expect.objectContaining({
          uuid: 'player-uuid',
          itemName: 'Potion',
          count: 3,
        }),
      );
    });
  });

  // ── POST /smartrotom/starbank/trainerdefeat — TrainerDefeatMoneyDto ───────

  describe('POST /smartrotom/starbank/trainerdefeat — TrainerDefeatMoneyDto validation', () => {
    const VALID_UUID = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4';
    const validBody = { uuid: VALID_UUID, money: 500 };

    it('returns 400 when uuid is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/starbank/trainerdefeat')
        .send({ money: 500 });

      expect(res.status).toBe(400);
    });

    it('returns 400 when uuid is not a valid UUID', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/starbank/trainerdefeat')
        .send({ uuid: 'invalid', money: 500 });

      expect(res.status).toBe(400);
    });

    it('returns 400 when money is 0 (Min(1) violated)', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/starbank/trainerdefeat')
        .send({ ...validBody, money: 0 });

      expect(res.status).toBe(400);
    });

    it('calls facade.trainerDefeat when body is valid', async () => {
      mockFacade.trainerDefeat.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/starbank/trainerdefeat')
        .send(validBody);

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.trainerDefeat).toHaveBeenCalledWith(500, VALID_UUID);
    });
  });

  // ── GET /smartrotom/starbank/transactions/:account ────────────────────────

  describe('GET /smartrotom/starbank/transactions/:account', () => {
    it('returns 200 and delegates to facade.getTransactions with default limit', async () => {
      mockFacade.getTransactions.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/starbank/transactions/1',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getTransactions).toHaveBeenCalledWith(1, 50);
    });

    it('passes custom limit query param to facade', async () => {
      mockFacade.getTransactions.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/starbank/transactions/1?limit=10',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getTransactions).toHaveBeenCalledWith(1, 10);
    });
  });

  // ── GET /smartrotom/starbank/transactions/user/:uuid ─────────────────────

  describe('GET /smartrotom/starbank/transactions/user/:uuid', () => {
    it('returns 200 and delegates to facade.getTransactionsByUUID', async () => {
      const VALID_UUID = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4';
      mockFacade.getTransactionsByUUID.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/starbank/transactions/user/${VALID_UUID}`,
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getTransactionsByUUID).toHaveBeenCalledWith(
        VALID_UUID,
        50,
      );
    });
  });

  // ── GET /smartrotom/starbank/transfers/:account ───────────────────────────

  describe('GET /smartrotom/starbank/transfers/:account', () => {
    it('returns 200 and delegates to facade.getTransfers', async () => {
      mockFacade.getTransfers.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/starbank/transfers/5',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getTransfers).toHaveBeenCalledWith(5);
    });
  });

  // ── GET /smartrotom/starbank/transfers/user/:uuid ─────────────────────────

  describe('GET /smartrotom/starbank/transfers/user/:uuid', () => {
    it('returns 200 and delegates to facade.getTransfersByUUID', async () => {
      const VALID_UUID = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4';
      mockFacade.getTransfersByUUID.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/starbank/transfers/user/${VALID_UUID}`,
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getTransfersByUUID).toHaveBeenCalledWith(VALID_UUID);
    });
  });

  describe('GlobalExceptionFilter — error shape contract', () => {
    it('all error responses include statusCode, error, message, timestamp, path', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/starbank/transfer')
        .send({});

      expect(res.body).toHaveProperty('statusCode', 400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('path');
    });
  });
});
