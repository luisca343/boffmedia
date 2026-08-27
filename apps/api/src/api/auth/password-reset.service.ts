import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, isNull } from 'drizzle-orm';
import * as crypto from 'crypto';
import { Logger } from 'nestjs-pino';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { boffMediaPasswordResetTokens } from '@/_db/schema/BoffMediaAuth';
import { BoffMediaUsersRepository } from '@api/boffmedia/users/repositories/users.repository';
import { PasswordService } from './password.service';
import { MailService } from '@api/mail/mail.service';
import { OutboxRepository } from '@api/outbox/repositories/outbox.repository';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// LEGACY_DIRECT_DB: pre-dates the repository rule; extract a repository when next touched
@Injectable()
export class PasswordResetService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
    private readonly usersRepository: BoffMediaUsersRepository,
    private readonly passwordService: PasswordService,
    private readonly mail: MailService,
    private readonly outbox: OutboxRepository,
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
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await this.db.transaction(async (tx) => {
      // Invalidate the user's prior unused tokens, then store the new hash.
      await tx
        .update(boffMediaPasswordResetTokens)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(boffMediaPasswordResetTokens.userId, user.id),
            isNull(boffMediaPasswordResetTokens.usedAt),
          ),
        );
      await tx.insert(boffMediaPasswordResetTokens).values({
        userId: user.id,
        tokenHash: this.hash(token),
        expiresAt,
      });

      // Enqueue mail inside the transaction so a rolled-back token creation
      // doesn't leave orphaned mail. Use a dedupeKey so a retried requestReset() call
      // doesn't queue duplicate mails.
      await this.outbox.enqueueTx(
        tx,
        'mail:send-password-reset',
        { to: user.email, token, locale: user.locale ?? undefined },
        `reset:${user.id}:${user.email}`,
      );
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
    const [row] = await this.db
      .select()
      .from(boffMediaPasswordResetTokens)
      .where(eq(boffMediaPasswordResetTokens.tokenHash, this.hash(token)))
      .limit(1);

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
    await this.db
      .update(boffMediaPasswordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(boffMediaPasswordResetTokens.id, row.id));

    const user = await this.usersRepository.findUserById(row.userId);
    return { success: true, username: user?.username ?? '' };
  }
}
