import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { authenticator } from 'otplib';

// A real 32-byte key: the point of these tests is that the secret is sealed on
// the way in and opened on the way out, which a stubbed cipher would not prove.
jest.mock('@/config/env', () => ({
  env: {
    SECRET_ENCRYPTION_KEY:
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  },
}));

import { TwoFactorService, hashBackupCode } from './two-factor.service';
import { TwoFactorRepository } from './two-factor.repository';
import { openSecret, resetSecretBoxKeyCache } from '@api/_utils/crypto/secret-box';

describe('TwoFactorService', () => {
  let service: TwoFactorService;
  let repo: jest.Mocked<
    Pick<
      TwoFactorRepository,
      | 'find'
      | 'isEnrolled'
      | 'putPendingSecret'
      | 'confirmEnrolment'
      | 'claimStep'
      | 'listUnusedBackupCodes'
      | 'consumeBackupCode'
      | 'countUnusedBackupCodes'
      | 'replaceBackupCodes'
    >
  >;

  /** A live enrolment: the secret sealed exactly as the DB would hold it. */
  const enrolled = (secret: string) => ({
    userId: 1,
    secret: sealFor(secret),
    pendingSecret: null,
    confirmedAt: new Date(),
    lastStep: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    resetSecretBoxKeyCache();
    const mockRepo = {
      find: jest.fn(),
      isEnrolled: jest.fn().mockResolvedValue(false),
      putPendingSecret: jest.fn().mockResolvedValue(undefined),
      confirmEnrolment: jest.fn().mockResolvedValue(undefined),
      claimStep: jest.fn().mockResolvedValue(true),
      listUnusedBackupCodes: jest.fn().mockResolvedValue([]),
      consumeBackupCode: jest.fn().mockResolvedValue(true),
      countUnusedBackupCodes: jest.fn().mockResolvedValue(0),
      replaceBackupCodes: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwoFactorService,
        { provide: TwoFactorRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get(TwoFactorService);
    repo = module.get(TwoFactorRepository);
  });

  describe('startEnrolment()', () => {
    it('hands out a provisioning URI and a QR, and stores the secret ENCRYPTED', async () => {
      const result = await service.startEnrolment(1, 'TrainerAsh');

      expect(result.otpauth_url).toMatch(/^otpauth:\/\/totp\//);
      // Case matters: this is the brand name the authenticator app prints above
      // the code, and toContain is case-sensitive, so this assertion is what
      // catches a casing drift in TOTP_ISSUER.
      expect(result.otpauth_url).toContain('BoffMedia');
      expect(result.qr_svg).toContain('<svg');

      const [, sealed] = repo.putPendingSecret.mock.calls[0];
      // The plaintext secret must not be recoverable from a table dump.
      expect(sealed).not.toContain(result.secret);
      expect(sealed.startsWith('v1.')).toBe(true);
      expect(openSecret(sealed)).toBe(result.secret);
    });

    it('refuses to replace a factor that is already live', async () => {
      // Silently overwriting a working authenticator is how an account gets
      // locked out by a stray click.
      repo.isEnrolled.mockResolvedValue(true);

      await expect(service.startEnrolment(1, 'TrainerAsh')).rejects.toThrow(
        ConflictException,
      );
      expect(repo.putPendingSecret).not.toHaveBeenCalled();
    });
  });

  describe('confirmEnrolment()', () => {
    it('activates the pending secret and returns single-use backup codes', async () => {
      const secret = authenticator.generateSecret();
      repo.find.mockResolvedValue({
        userId: 1,
        secret: null,
        pendingSecret: sealFor(secret),
        confirmedAt: null,
        lastStep: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const codes = await service.confirmEnrolment(
        1,
        authenticator.generate(secret),
      );

      expect(codes).toHaveLength(10);
      const [, , step, hashes] = repo.confirmEnrolment.mock.calls[0];
      expect(step).toEqual(expect.any(Number));
      // Only hashes are stored — a code cannot be read back out later.
      expect(hashes).toEqual(codes.map(hashBackupCode));
      expect(hashes).not.toEqual(expect.arrayContaining(codes));
    });

    it('rejects a wrong code without activating anything', async () => {
      repo.find.mockResolvedValue({
        userId: 1,
        secret: null,
        pendingSecret: sealFor(authenticator.generateSecret()),
        confirmedAt: null,
        lastStep: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.confirmEnrolment(1, '000000')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(repo.confirmEnrolment).not.toHaveBeenCalled();
    });

    it('rejects when no enrolment is in progress', async () => {
      repo.find.mockResolvedValue(null);

      await expect(service.confirmEnrolment(1, '123456')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('assertSecondFactor()', () => {
    it('accepts a current TOTP code and claims its step', async () => {
      const secret = authenticator.generateSecret();
      repo.find.mockResolvedValue(enrolled(secret));

      await expect(
        service.assertSecondFactor(1, { code: authenticator.generate(secret) }),
      ).resolves.toBeUndefined();

      expect(repo.claimStep).toHaveBeenCalledWith(1, expect.any(Number));
    });

    it('rejects a REPLAYED code even though it is still arithmetically valid', async () => {
      // The six digits stay valid for the rest of their 30-second window, so
      // without the step latch a shoulder-surfed code works twice.
      const secret = authenticator.generateSecret();
      repo.find.mockResolvedValue(enrolled(secret));
      repo.claimStep.mockResolvedValue(false);

      await expect(
        service.assertSecondFactor(1, { code: authenticator.generate(secret) }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a code from the wrong secret', async () => {
      repo.find.mockResolvedValue(enrolled(authenticator.generateSecret()));

      await expect(
        service.assertSecondFactor(1, {
          code: authenticator.generate(authenticator.generateSecret()),
        }),
      ).rejects.toThrow(UnauthorizedException);
      expect(repo.claimStep).not.toHaveBeenCalled();
    });

    it('rejects anything that is not six digits before touching the secret', async () => {
      repo.find.mockResolvedValue(enrolled(authenticator.generateSecret()));

      await expect(
        service.assertSecondFactor(1, { code: 'abcdef' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('accepts a backup code and spends it', async () => {
      repo.find.mockResolvedValue(enrolled(authenticator.generateSecret()));
      repo.listUnusedBackupCodes.mockResolvedValue([
        { id: 7, codeHash: hashBackupCode('K7M2P9QRTV') },
      ]);

      await expect(
        service.assertSecondFactor(1, { backupCode: 'k7m2-p9qr-tv' }),
      ).resolves.toBeUndefined();

      expect(repo.consumeBackupCode).toHaveBeenCalledWith(7);
    });

    it('rejects a backup code that lost the race to be consumed', async () => {
      repo.find.mockResolvedValue(enrolled(authenticator.generateSecret()));
      repo.listUnusedBackupCodes.mockResolvedValue([
        { id: 7, codeHash: hashBackupCode('K7M2P9QRTV') },
      ]);
      repo.consumeBackupCode.mockResolvedValue(false);

      await expect(
        service.assertSecondFactor(1, { backupCode: 'K7M2P9QRTV' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an unknown backup code', async () => {
      repo.find.mockResolvedValue(enrolled(authenticator.generateSecret()));
      repo.listUnusedBackupCodes.mockResolvedValue([]);

      await expect(
        service.assertSecondFactor(1, { backupCode: 'NOTACODE99' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects when the account has no confirmed factor', async () => {
      repo.find.mockResolvedValue({
        userId: 1,
        secret: null,
        pendingSecret: 'v1.pending',
        confirmedAt: null,
        lastStep: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.assertSecondFactor(1, { code: '123456' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('without SECRET_ENCRYPTION_KEY', () => {
    it('refuses enrolment rather than storing the secret in the clear', async () => {
      const env = jest.requireMock('@/config/env').env as {
        SECRET_ENCRYPTION_KEY?: string;
      };
      const saved = env.SECRET_ENCRYPTION_KEY;
      env.SECRET_ENCRYPTION_KEY = undefined;
      resetSecretBoxKeyCache();

      try {
        await expect(service.startEnrolment(1, 'TrainerAsh')).rejects.toThrow(
          ServiceUnavailableException,
        );
        expect(repo.putPendingSecret).not.toHaveBeenCalled();
      } finally {
        env.SECRET_ENCRYPTION_KEY = saved;
        resetSecretBoxKeyCache();
      }
    });
  });
});

/** Seal a secret the way the enrolment path would, so the fixtures match what
 *  the database actually holds. */
function sealFor(secret: string): string {
  // Imported lazily so the env mock above is in place first.

  const { sealSecret } = require('@api/_utils/crypto/secret-box');
  return sealSecret(secret);
}
