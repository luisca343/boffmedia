import { BadRequestException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { Logger } from 'nestjs-pino';
import { BoffMediaUsersRepository } from '@api/boffmedia/users/repositories/users.repository';
import { PasswordService } from './password.service';
import { MailService } from '@api/mail/mail.service';
import { PasswordResetTokensRepository } from './repositories/password-reset-tokens.repository';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly tokens: PasswordResetTokensRepository,
    private readonly usersRepository: BoffMediaUsersRepository,
    private readonly passwordService: PasswordService,
    private readonly mail: MailService,
    private readonly logger: Logger,
  ) {}

  private hash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Issue a single-use reset token and enqueue a reset email. Resolves silently
   * whether or not the address exists — the caller returns a generic 200 so the
   * endpoint can't be used to enumerate registered emails.
   *
   * The reset token is stored and the mail is enqueued atomically, so a
   * rolled-back transaction leaves no orphaned mail task. The dispatcher will
   * send the password-reset email and retry on failure.
   */
  async requestReset(email: string): Promise<void> {
    let user: Awaited<ReturnType<BoffMediaUsersRepository['findUserByEmail']>>;
    try {
      user = await this.usersRepository.findUserByEmail(email.trim());
    } catch (error) {
      this.logger.error('[PasswordReset] lookup failed', error as Error);
      return;
    }
    if (!user) return;

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hash(token);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    // The repository invalidates prior tokens, stores the new hash and enqueues
    // the mail in one transaction, so a rolled-back token leaves no mail behind.
    //
    // Keyed on the token hash rather than the account, for the reason spelled
    // out in EmailVerificationService.issue(): `outbox_dedupe_uq` is unique over
    // every row regardless of status, so an account-stable key let each user
    // request exactly one password reset EVER — every later attempt died on
    // ER_DUP_ENTRY inside the transaction.
    await this.tokens.replaceActiveToken(user.id, tokenHash, expiresAt, {
      topic: 'mail:send-password-reset',
      payload: { to: user.email, token, locale: user.locale ?? undefined },
      dedupeKey: `reset:${user.id}:${tokenHash}`,
    });
  }

  /**
   * Consume a reset token and set the user's new password. Returns the account
   * username so the web can auto-sign-in after a successful reset. The strong-
   * password policy is enforced here (and mirrored client-side for live
   * feedback); the thrown message is a `;`-joined list of the failed rules.
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ success: boolean; username: string }> {
    const row = await this.tokens.findByTokenHash(this.hash(token));

    if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const validation = this.passwordService.validatePassword(newPassword);
    if (!validation.isValid) {
      throw new BadRequestException(validation.errors.join('; '));
    }

    const hashed = await this.passwordService.hashPassword(newPassword);
    await this.usersRepository.updateUser(row.userId, { password: hashed });
    // Invalidate all outstanding web sessions: password reset signs the user out everywhere.
    await this.usersRepository.bumpSessionVersion(row.userId);
    await this.tokens.markUsed(row.id);

    const user = await this.usersRepository.findUserById(row.userId);
    return { success: true, username: user?.username ?? '' };
  }
}
