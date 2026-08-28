import { Test } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { BoffMediaUsersRepository } from '@api/boffmedia/users/repositories/users.repository';
import { MailService } from '@api/mail/mail.service';
import { EmailVerificationService } from './email-verification.service';
import { EmailVerificationsRepository } from './repositories/email-verifications.repository';
import { PasswordResetService } from './password-reset.service';
import { PasswordResetTokensRepository } from './repositories/password-reset-tokens.repository';
import { PasswordService } from './password.service';

/**
 * `outbox_dedupe_uq` is UNIQUE over every row whatever its status, so a mail
 * dedupe key that is constant per account lets an account send that mail
 * exactly once — ever. The second attempt raises ER_DUP_ENTRY inside the
 * transaction that also writes the token, so it rolls back and the endpoint
 * 500s with no mail queued.
 *
 * That is not a hypothetical: it is what a "resend verification email" button
 * and a second "forgot password" both hit in dev. These tests pin the shape
 * that fixes it — the key names the token, so it differs on every issue.
 */
describe('transactional mail dedupe keys', () => {
  const logger = { error: jest.fn(), log: jest.fn(), warn: jest.fn() };

  describe('EmailVerificationService.issue()', () => {
    let service: EmailVerificationService;
    let verifications: { replaceActiveToken: jest.Mock };

    beforeEach(async () => {
      verifications = { replaceActiveToken: jest.fn().mockResolvedValue(undefined) };
      const module = await Test.createTestingModule({
        providers: [
          EmailVerificationService,
          { provide: EmailVerificationsRepository, useValue: verifications },
          { provide: BoffMediaUsersRepository, useValue: {} },
          { provide: MailService, useValue: {} },
          { provide: Logger, useValue: logger },
        ],
      }).compile();
      service = module.get(EmailVerificationService);
    });

    it('gives each issue a distinct dedupe key, so a resend is not a duplicate', async () => {
      await service.issue(1, 'player@example.com');
      await service.issue(1, 'player@example.com');

      const [first, second] = verifications.replaceActiveToken.mock.calls;
      expect(first[4].dedupeKey).not.toEqual(second[4].dedupeKey);
    });

    it('keys the mail on the token hash it stores, not on the address', async () => {
      await service.issue(7, 'player@example.com');

      const [, , tokenHash, , mail] = verifications.replaceActiveToken.mock.calls[0];
      expect(mail.dedupeKey).toBe(`verify:7:${tokenHash}`);
      // The address must not appear: that is precisely what made the key
      // constant across calls.
      expect(mail.dedupeKey).not.toContain('player@example.com');
    });
  });

  describe('PasswordResetService.requestReset()', () => {
    let service: PasswordResetService;
    let tokens: { replaceActiveToken: jest.Mock };

    beforeEach(async () => {
      tokens = { replaceActiveToken: jest.fn().mockResolvedValue(undefined) };
      const module = await Test.createTestingModule({
        providers: [
          PasswordResetService,
          { provide: PasswordResetTokensRepository, useValue: tokens },
          {
            provide: BoffMediaUsersRepository,
            useValue: {
              findUserByEmail: jest
                .fn()
                .mockResolvedValue({ id: 3, email: 'player@example.com', locale: 'es' }),
            },
          },
          { provide: PasswordService, useValue: {} },
          { provide: MailService, useValue: {} },
          { provide: Logger, useValue: logger },
        ],
      }).compile();
      service = module.get(PasswordResetService);
    });

    it('lets the same account request a reset more than once', async () => {
      await service.requestReset('player@example.com');
      await service.requestReset('player@example.com');

      const [first, second] = tokens.replaceActiveToken.mock.calls;
      expect(first[3].dedupeKey).not.toEqual(second[3].dedupeKey);
    });

    it('keys the mail on the token hash it stores', async () => {
      await service.requestReset('player@example.com');

      const [, tokenHash, , mail] = tokens.replaceActiveToken.mock.calls[0];
      expect(mail.dedupeKey).toBe(`reset:3:${tokenHash}`);
    });
  });
});
