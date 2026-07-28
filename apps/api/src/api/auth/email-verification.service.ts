import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, isNull } from 'drizzle-orm';
import * as crypto from 'crypto';
import { Logger } from 'nestjs-pino';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { boffMediaEmailVerifications } from '@/_db/schema/BoffMediaAuth';
import { BoffMediaUsersRepository } from '@api/boffmedia/users/repositories/users.repository';
import { MailService } from '@api/mail/mail.service';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// LEGACY_DIRECT_DB: pre-dates the repository rule; extract a repository when next touched
@Injectable()
export class EmailVerificationService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
    private readonly usersRepository: BoffMediaUsersRepository,
    private readonly mail: MailService,
    private readonly logger: Logger,
  ) {}

  private hash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Issue + email a verification token for the account with this email. Silent
   * when the address is unknown or already verified. Used by both the "resend"
   * endpoint and the post-registration hook, so it can't leak account state.
   */
  async sendVerification(email: string): Promise<void> {
    let user: Awaited<ReturnType<BoffMediaUsersRepository['findUserByEmail']>>;
    try {
      user = await this.usersRepository.findUserByEmail(email.trim());
    } catch (error) {
      this.logger.error('[EmailVerification] lookup failed', error as Error);
      return;
    }
    if (!user || user.emailVerified) return;
    await this.issue(user.id, user.email, user.locale);
  }

  /**
   * Create + email a token for a known user (no existence/verified checks).
   * `locale` is the user's stored preference; omitting it sends Spanish.
   */
  async issue(
    userId: number,
    email: string,
    locale?: string | null,
  ): Promise<void> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await this.db
      .update(boffMediaEmailVerifications)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(boffMediaEmailVerifications.userId, userId),
          isNull(boffMediaEmailVerifications.usedAt),
        ),
      );
    await this.db.insert(boffMediaEmailVerifications).values({
      userId,
      email,
      tokenHash: this.hash(token),
      expiresAt,
    });

    await this.mail.sendEmailVerification(email, token, locale);
  }

  /** Consume a verification token and mark the user's email verified. */
  async verify(token: string): Promise<{ success: boolean }> {
    const [row] = await this.db
      .select()
      .from(boffMediaEmailVerifications)
      .where(eq(boffMediaEmailVerifications.tokenHash, this.hash(token)))
      .limit(1);

    if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.usersRepository.updateUser(row.userId, { emailVerified: true });
    await this.db
      .update(boffMediaEmailVerifications)
      .set({ usedAt: new Date() })
      .where(eq(boffMediaEmailVerifications.id, row.id));

    return { success: true };
  }
}
