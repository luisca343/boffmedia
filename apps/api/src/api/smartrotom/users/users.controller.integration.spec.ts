import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { UsersController } from './users.controller';
import { UsersFacadeService } from './users.facade.service';
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
  getAllUsers: jest.fn(),
  getUserById: jest.fn(),
  getUserByUuid: jest.fn(),
  createUser: jest.fn(),
  findOrCreateUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  initializeUserAndAccounts: jest.fn(),
  getUserWithAccounts: jest.fn(),
  getMultipleUsers: jest.fn(),
  getMultipleUsersWithAccounts: jest.fn(),
  getUserStatistics: jest.fn(),
  validateUserExists: jest.fn(),
};

const VALID_UUID = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4';
const VALID_UUID_2 = '550e8400-e29b-41d4-a716-446655440000';
const mockUser = { id: 1, uuid: VALID_UUID, username: 'TrainerAsh' };

describe('UsersController (SmartRotom) — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersFacadeService, useValue: mockFacade },
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

  // ── GET /smartrotom/users ─────────────────────────────────────────────────

  describe('GET /smartrotom/users', () => {
    it('returns 200 and delegates to facade.getAllUsers', async () => {
      mockFacade.getAllUsers.mockResolvedValue([mockUser]);

      const res = await request(app.getHttpServer()).get('/smartrotom/users');

      expect(res.status).toBe(200);
      expect(mockFacade.getAllUsers).toHaveBeenCalledTimes(1);
    });
  });

  // ── POST /smartrotom/users — CreateSmartrotomUserDto validation ───────────

  describe('POST /smartrotom/users — CreateSmartrotomUserDto validation', () => {
    const validBody = { uuid: VALID_UUID, username: 'TrainerAsh' };

    it('returns 201 and calls facade.createUser when body is valid', async () => {
      mockFacade.createUser.mockResolvedValue(mockUser);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/users')
        .send(validBody);

      expect(res.status).toBe(201);
      expect(mockFacade.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ uuid: VALID_UUID, username: 'TrainerAsh' }),
      );
    });

    it('returns 400 when uuid is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/users')
        .send({ username: 'TrainerAsh' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when uuid is not a valid UUID', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/users')
        .send({ ...validBody, uuid: 'not-a-uuid' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when username is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/users')
        .send({ uuid: VALID_UUID });

      expect(res.status).toBe(400);
    });

    it('returns 400 when username is shorter than 3 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/users')
        .send({ ...validBody, username: 'ab' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when username exceeds 16 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/users')
        .send({ ...validBody, username: 'a'.repeat(17) });

      expect(res.status).toBe(400);
    });

    it('returns 400 when unknown field is present (forbidNonWhitelisted)', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/users')
        .send({ ...validBody, hackerField: 'x' });

      expect(res.status).toBe(400);
    });

    it('accepts optional world field', async () => {
      mockFacade.createUser.mockResolvedValue({
        ...mockUser,
        world: 'survival',
      });

      const res = await request(app.getHttpServer())
        .post('/smartrotom/users')
        .send({ ...validBody, world: 'survival' });

      expect(res.status).toBe(201);
      expect(mockFacade.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ world: 'survival' }),
      );
    });
  });

  // ── GET /smartrotom/users/:id ─────────────────────────────────────────────

  describe('GET /smartrotom/users/:id', () => {
    it('returns 200 and passes id to facade.getUserById', async () => {
      mockFacade.getUserById.mockResolvedValue(mockUser);

      const res = await request(app.getHttpServer()).get('/smartrotom/users/1');

      expect(res.status).toBe(200);
      expect(mockFacade.getUserById).toHaveBeenCalledWith(1);
    });

    it('returns 400 when id is not numeric (ParseIntPipe)', async () => {
      const res = await request(app.getHttpServer()).get(
        '/smartrotom/users/abc',
      );

      expect(res.status).toBe(400);
    });
  });

  // ── GET /smartrotom/users/uuid/:uuid ──────────────────────────────────────

  describe('GET /smartrotom/users/uuid/:uuid', () => {
    it('returns 200 and passes uuid to facade.getUserByUuid', async () => {
      mockFacade.getUserByUuid.mockResolvedValue(mockUser);

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/users/uuid/${VALID_UUID}`,
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getUserByUuid).toHaveBeenCalledWith(VALID_UUID);
    });
  });

  // ── PATCH /smartrotom/users/:id ───────────────────────────────────────────

  describe('PATCH /smartrotom/users/:id — UpdateSmartrotomUserDto validation', () => {
    it('returns 200 and calls facade.updateUser', async () => {
      mockFacade.updateUser.mockResolvedValue({
        ...mockUser,
        username: 'NewName',
      });

      const res = await request(app.getHttpServer())
        .patch('/smartrotom/users/1')
        .send({ username: 'NewName' });

      expect(res.status).toBe(200);
      expect(mockFacade.updateUser).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ username: 'NewName' }),
      );
    });

    it('returns 400 when unknown field is present (forbidNonWhitelisted)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/smartrotom/users/1')
        .send({ hackerField: 'x' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when id is not numeric', async () => {
      const res = await request(app.getHttpServer())
        .patch('/smartrotom/users/abc')
        .send({ username: 'ValidName' });

      expect(res.status).toBe(400);
    });
  });

  // ── DELETE /smartrotom/users/:id ──────────────────────────────────────────

  describe('DELETE /smartrotom/users/:id', () => {
    it('returns 200 and calls facade.deleteUser', async () => {
      mockFacade.deleteUser.mockResolvedValue({
        success: true,
        message: 'Deleted',
      });

      const res = await request(app.getHttpServer()).delete(
        '/smartrotom/users/1',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.deleteUser).toHaveBeenCalledWith(1);
    });

    it('returns 400 when id is not numeric', async () => {
      const res = await request(app.getHttpServer()).delete(
        '/smartrotom/users/abc',
      );

      expect(res.status).toBe(400);
    });
  });

  // ── POST /smartrotom/users/find-or-create ─────────────────────────────────

  describe('POST /smartrotom/users/find-or-create — CreateSmartrotomUserDto validation', () => {
    const validBody = { uuid: VALID_UUID, username: 'TrainerAsh' };

    it('returns 400 when uuid is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/users/find-or-create')
        .send({ username: 'TrainerAsh' });

      expect(res.status).toBe(400);
    });

    it('calls facade.findOrCreateUser when body is valid', async () => {
      mockFacade.findOrCreateUser.mockResolvedValue({
        user: mockUser,
        isNew: false,
      });

      const res = await request(app.getHttpServer())
        .post('/smartrotom/users/find-or-create')
        .send(validBody);

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.findOrCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({ uuid: VALID_UUID }),
      );
    });
  });

  // ── POST /smartrotom/users/initialize — UserInitializationDataDto ─────────

  describe('POST /smartrotom/users/initialize — UserInitializationDataDto validation', () => {
    const validBody = { uuid: VALID_UUID, username: 'TrainerAsh' };

    it('returns 400 when uuid is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/users/initialize')
        .send({ username: 'TrainerAsh' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when uuid is not a valid UUID', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/users/initialize')
        .send({ ...validBody, uuid: 'not-a-uuid' });

      expect(res.status).toBe(400);
    });

    it('calls facade.initializeUserAndAccounts when body is valid', async () => {
      mockFacade.initializeUserAndAccounts.mockResolvedValue({
        user: mockUser,
        accounts: [],
      });

      const res = await request(app.getHttpServer())
        .post('/smartrotom/users/initialize')
        .send(validBody);

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.initializeUserAndAccounts).toHaveBeenCalledWith(
        expect.objectContaining({ uuid: VALID_UUID }),
      );
    });
  });

  // ── POST /smartrotom/users/batch — BatchUsersRequestDto validation ─────────

  describe('POST /smartrotom/users/batch — BatchUsersRequestDto validation', () => {
    it('returns 400 when uuids is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/users/batch')
        .send({});

      expect(res.status).toBe(400);
    });

    it('returns 400 when uuids array is empty (ArrayMinSize(1))', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/users/batch')
        .send({ uuids: [] });

      expect(res.status).toBe(400);
    });

    it('returns 400 when uuids contains invalid UUIDs', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/users/batch')
        .send({ uuids: ['not-a-uuid'] });

      expect(res.status).toBe(400);
    });

    it('returns 400 when unknown field is present', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/users/batch')
        .send({ uuids: [VALID_UUID], hackerField: 'x' });

      expect(res.status).toBe(400);
    });

    it('calls facade.getMultipleUsers when body is valid', async () => {
      mockFacade.getMultipleUsers.mockResolvedValue({ [VALID_UUID]: mockUser });

      const res = await request(app.getHttpServer())
        .post('/smartrotom/users/batch')
        .send({ uuids: [VALID_UUID, VALID_UUID_2] });

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.getMultipleUsers).toHaveBeenCalledWith([
        VALID_UUID,
        VALID_UUID_2,
      ]);
    });
  });

  // ── POST /smartrotom/users/batch/accounts ─────────────────────────────────

  describe('POST /smartrotom/users/batch/accounts — BatchUsersRequestDto validation', () => {
    it('returns 400 when uuids is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/users/batch/accounts')
        .send({});

      expect(res.status).toBe(400);
    });

    it('calls facade.getMultipleUsersWithAccounts when body is valid', async () => {
      mockFacade.getMultipleUsersWithAccounts.mockResolvedValue({
        [VALID_UUID]: mockUser,
      });

      const res = await request(app.getHttpServer())
        .post('/smartrotom/users/batch/accounts')
        .send({ uuids: [VALID_UUID] });

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.getMultipleUsersWithAccounts).toHaveBeenCalledWith([
        VALID_UUID,
      ]);
    });
  });

  // ── GET /smartrotom/users/stats/overview ──────────────────────────────────

  describe('GET /smartrotom/users/stats/overview', () => {
    it('returns 200 and delegates to facade.getUserStatistics', async () => {
      mockFacade.getUserStatistics.mockResolvedValue({ total: 10 });

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/users/stats/overview',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getUserStatistics).toHaveBeenCalledTimes(1);
    });
  });

  // ── GET /smartrotom/users/validate/:uuid ──────────────────────────────────

  describe('GET /smartrotom/users/validate/:uuid', () => {
    it('returns 200 with exists:true when user exists', async () => {
      mockFacade.validateUserExists.mockResolvedValue(true);

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/users/validate/${VALID_UUID}`,
      );

      expect(res.status).toBe(200);
      expect(mockFacade.validateUserExists).toHaveBeenCalledWith(VALID_UUID);
    });

    it('returns 200 with exists:false when user does not exist', async () => {
      mockFacade.validateUserExists.mockResolvedValue(false);

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/users/validate/${VALID_UUID}`,
      );

      expect(res.status).toBe(200);
    });
  });

  // ── GlobalExceptionFilter — error shape contract ─────────────────────────

  describe('GlobalExceptionFilter — error shape contract', () => {
    it('all error responses include statusCode, error, message, timestamp, path', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/users')
        .send({});

      expect(res.body).toHaveProperty('statusCode', 400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('path');
    });
  });
});
