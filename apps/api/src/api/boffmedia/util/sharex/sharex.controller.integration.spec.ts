import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

const VALID_TOKEN = 'a'.repeat(64);
const TOKEN_ROW = { id: 7, label: 'Tester', deletedAt: null };

const mockEnv: Record<string, unknown> = {
  PUBLIC_DIR: 'https://cdn.example.test',
};
jest.mock('@/config/env', () => ({
  get env() {
    return mockEnv;
  },
}));

// The handler writes to disk on the success path. Stub fs so the suite never
// touches `public/`.
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { SharexController } from './sharex.controller';
import { SharexService } from './sharex.service';
import { SharexTokensService } from './sharex-tokens.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { GameOrUserAuthGuard } from '@api/_utils/guards/game-or-user-auth.guard';

const mockService: jest.Mocked<Partial<SharexService>> = {
  createImage: jest.fn(),
};

const mockTokens: jest.Mocked<Partial<SharexTokensService>> = {
  resolve: jest.fn(),
  touch: jest.fn(),
};

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

describe('SharexController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SharexController],
      providers: [
        { provide: SharexService, useValue: mockService },
        { provide: SharexTokensService, useValue: mockTokens },
      ],
    })
      // Guards are stubbed: this suite is about validation and error shape, not
      // about who may call the route. The upload route's real gate is the token,
      // which is exercised directly below.
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GameOrUserAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
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

  afterAll(() => app.close());

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: the presented token resolves to a live row.
    (mockTokens.resolve as jest.Mock).mockResolvedValue(TOKEN_ROW);
    (mockTokens.touch as jest.Mock).mockResolvedValue(undefined);
  });

  const upload = (filename = 'myapp-1234567890.png', key = VALID_TOKEN) =>
    request(app.getHttpServer())
      .post('/sharex')
      .attach('file', Buffer.from('fake image'), filename)
      .field('key', key);

  describe('POST /sharex', () => {
    it('returns 400 when no file is uploaded', async () => {
      const res = await request(app.getHttpServer())
        .post('/sharex')
        .field('key', VALID_TOKEN);

      expect(res.status).toBe(400);
      expect(mockService.createImage).not.toHaveBeenCalled();
    });

    it('returns 400 when key is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/sharex')
        .attach('file', Buffer.from('fake image'), 'screenshot-1234567890.png');

      expect(res.status).toBe(400);
      expect(mockService.createImage).not.toHaveBeenCalled();
    });

    it('returns 201 and attributes the upload to the resolved token', async () => {
      const res = await upload();

      expect(res.status).toBe(201);
      expect(mockTokens.resolve).toHaveBeenCalledWith(VALID_TOKEN);
      // The token id is stored, so an upload can be traced to a person.
      expect(mockService.createImage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'png',
        TOKEN_ROW.id,
      );
      expect(res.body.file).toBeDefined();
    });

    it('stamps the token as used on success', async () => {
      await upload();
      expect(mockTokens.touch).toHaveBeenCalledWith(TOKEN_ROW.id);
    });

    // ── authentication ──────────────────────────────────────────────────────

    it('returns 401 when the token does not resolve, and never reaches the disk', async () => {
      (mockTokens.resolve as jest.Mock).mockResolvedValue(null);

      const res = await upload('myapp-1234567890.png', 'b'.repeat(64));

      expect(res.status).toBe(401);
      expect(mockService.createImage).not.toHaveBeenCalled();
      expect(mockTokens.touch).not.toHaveBeenCalled();
    });

    // resolve() filters revoked tokens in the query, so revocation takes effect
    // on the next request rather than whenever a cache expires.
    it('returns 401 for a revoked token', async () => {
      (mockTokens.resolve as jest.Mock).mockResolvedValue(null);

      const res = await upload();

      expect(res.status).toBe(401);
      expect(mockService.createImage).not.toHaveBeenCalled();
    });

    // ── extension allow-list ────────────────────────────────────────────────

    // Files land under `public/` and are served from this origin, so honouring
    // the caller's extension would be stored XSS.
    it.each([
      'evil-1234567890.html',
      'evil-1234567890.svg',
      'evil-1234567890.js',
    ])('rejects %s even with a valid token', async (filename) => {
      const res = await upload(filename);

      expect(res.status).toBe(400);
      expect(mockService.createImage).not.toHaveBeenCalled();
    });

    it('stores the allow-listed extension rather than the caller-supplied case', async () => {
      const res = await upload('myapp-1234567890.PNG');

      expect(res.status).toBe(201);
      const [, , extension] = (mockService.createImage as jest.Mock).mock
        .calls[0];
      expect(extension).toBe('png');
    });
  });
});
