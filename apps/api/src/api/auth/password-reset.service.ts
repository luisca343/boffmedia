import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, isNull } from 'drizzle-orm';
import * as crypto from 'crypto';
import { Logger } from 'nestjs-pino';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { boffMediaPasswordResetTokens } from '@/_db/schema/Auth';
import { BoffMediaUsersRepository } from '@api/boffmedia/users/repositories/users.repository';
import { PasswordService } from './password.service';
import { MailService } from '@api/mail/mail.service';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class PasswordResetService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
    private readonly usersRepository: BoffMediaUsersRepository,
    private readonly passwordService: PasswordService,
    private readonly mail: MailService,
    private readonly logger: Logger,
  ) {}

  private hash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Issue a single-use reset token and email it. Resolves silently whether or
   * not the address exists — the caller returns a generic 200 so the endpoint
   * can't be used to enumerate registered emails.
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

    // Invalidate the user's prior unused tokens, then store the new hash.
    await this.db
      .update(boffMediaPasswordResetTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(boffMediaPasswordResetTokens.userId, user.id),
          isNull(boffMediaPasswordResetTokens.usedAt),
        ),
      );
    await this.db.insert(boffMediaPasswordResetTokens).values({
      userId: user.id,
      tokenHash: this.hash(token),
      expiresAt,
    });

    await this.mail.sendPasswordReset(user.email, token);
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
    await this.db
      .update(boffMediaPasswordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(boffMediaPasswordResetTokens.id, row.id));

    const user = await this.usersRepository.findUserById(row.userId);
    return { success: true, username: user?.username ?? '' };
  }
}
