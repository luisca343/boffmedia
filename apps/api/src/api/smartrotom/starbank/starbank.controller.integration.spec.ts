import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { StarbankController } from './starbank.controller';
import { StarbankFacadeService } from './starbank.facade.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { Reflector } from '@nestjs/core';

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

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
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter(mockLogger as any));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
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
      expect(mockFacade.transfer).toHaveBeenCalledWith(1, 2, 100, 'payment');
    });
  });

  describe('GET /smartrotom/starbank/balance/:uuid', () => {
    it('returns balance from facade', async () => {
      mockFacade.getBalance.mockResolvedValue({ balance: 1500 });

      const res = await request(app.getHttpServer())
        .get('/smartrotom/starbank/balance/67d9b543-5ac9-41e1-a8a5-20d7689e24a4');

      expect(res.status).toBe(200);
      expect(mockFacade.getBalance).toHaveBeenCalledWith(
        '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
      );
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
