import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { boffMediaEmailVerifications } from '@/_db/schema/BoffMediaAuth';
import { OutboxRepository } from '@api/outbox/repositories/outbox.repository';

export type EmailVerificationRow =
  typeof boffMediaEmailVerifications.$inferSelect;

export interface QueuedMail {
  topic: string;
  payload: Record<string, unknown>;
  dedupeKey: string;
}

@Injectable()
export class EmailVerificationsRepository {
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
    email: string,
    tokenHash: string,
    expiresAt: Date,
    mail: QueuedMail,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(boffMediaEmailVerifications)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(boffMediaEmailVerifications.userId, userId),
            isNull(boffMediaEmailVerifications.usedAt),
          ),
        );
      await tx.insert(boffMediaEmailVerifications).values({
        userId,
        email,
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
  ): Promise<EmailVerificationRow | null> {
    const [row] = await this.db
      .select()
      .from(boffMediaEmailVerifications)
      .where(eq(boffMediaEmailVerifications.tokenHash, tokenHash))
      .limit(1);
    return row ?? null;
  }

  async markUsed(id: number): Promise<void> {
    await this.db
      .update(boffMediaEmailVerifications)
      .set({ usedAt: new Date() })
      .where(eq(boffMediaEmailVerifications.id, id));
  }
}
