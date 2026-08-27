import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { boffMediaPasswordResetTokens } from '@/_db/schema/BoffMediaAuth';
import { OutboxRepository } from '@api/outbox/repositories/outbox.repository';
import type { QueuedMail } from './email-verifications.repository';

export type PasswordResetTokenRow =
  typeof boffMediaPasswordResetTokens.$inferSelect;

@Injectable()
export class PasswordResetTokensRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
    private readonly outbox: OutboxRepository,
  ) {}

/**
 * Why the outbox enqueue lives in here rather than in the service.
 *
 * The token write and the mail enqueue have to share one transaction: a
 * rolled-back token must not leave a queued email promising a link that will
 * never work. Keeping that transaction in the repository is what lets the
 * service stay free of both drizzle and the transaction handle — the
 * alternative, handing a `tx` back to the caller, moves the atomicity guarantee
 * into whichever service remembers to honour it.
 */
  async replaceActiveToken(
    userId: number,
    tokenHash: string,
    expiresAt: Date,
    mail: QueuedMail,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      // Invalidate the user's prior unused tokens, then store the new hash.
      await tx
        .update(boffMediaPasswordResetTokens)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(boffMediaPasswordResetTokens.userId, userId),
            isNull(boffMediaPasswordResetTokens.usedAt),
          ),
        );
      await tx.insert(boffMediaPasswordResetTokens).values({
        userId,
        tokenHash,
        expiresAt,
      });

      await this.outbox.enqueueTx(
        tx,
        mail.topic,
        mail.payload,
        mail.dedupeKey,
      );
    });
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<PasswordResetTokenRow | null> {
    const [row] = await this.db
      .select()
      .from(boffMediaPasswordResetTokens)
      .where(eq(boffMediaPasswordResetTokens.tokenHash, tokenHash))
      .limit(1);
    return row ?? null;
  }

  async markUsed(id: number): Promise<void> {
    await this.db
      .update(boffMediaPasswordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(boffMediaPasswordResetTokens.id, id));
  }
}
