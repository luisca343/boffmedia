import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, isNull, lt, or } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  boffMediaUserBackupCodes,
  boffMediaUserTotp,
  type UserTotp,
} from '@/_db/schema/BoffMediaAuth';

export type { UserTotp };

/**
 * Storage for the second factor. Everything that decides POLICY — who needs a
 * factor, what a wrong code costs — lives in `TwoFactorService`; this file only
 * knows rows.
 *
 * The secrets travelling through here are already sealed by the caller
 * (`_utils/crypto/secret-box.ts`). The repository never sees plaintext, which
 * is what keeps "did we remember to encrypt it?" a question with one answer
 * rather than one per call site.
 */
@Injectable()
export class TwoFactorRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  async find(userId: number): Promise<UserTotp | null> {
    const [row] = await this.db
      .select()
      .from(boffMediaUserTotp)
      .where(eq(boffMediaUserTotp.userId, userId))
      .limit(1);
    return row ?? null;
  }

  /** True only for a CONFIRMED factor — a half-finished enrolment must not make
   *  the login screen ask for a code nobody can produce. */
  async isEnrolled(userId: number): Promise<boolean> {
    const row = await this.find(userId);
    return Boolean(row?.secret && row.confirmedAt);
  }

  /** Start (or restart) an enrolment. Any previous pending secret is replaced;
   *  a confirmed one is left alone, so restarting cannot lock the account out. */
  async putPendingSecret(userId: number, sealed: string): Promise<void> {
    await this.db
      .insert(boffMediaUserTotp)
      .values({ userId, pendingSecret: sealed })
      .onDuplicateKeyUpdate({ set: { pendingSecret: sealed } });
  }

  /** Promote the pending secret to the live one and replace the backup codes,
   *  in one transaction: an admin who ends up enrolled with no way back in, or
   *  with codes for a secret that was never activated, is worse off than one who
   *  has to start over. */
  async confirmEnrolment(
    userId: number,
    sealed: string,
    step: number,
    codeHashes: string[],
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(boffMediaUserTotp)
        .set({
          secret: sealed,
          pendingSecret: null,
          confirmedAt: new Date(),
          lastStep: step,
        })
        .where(eq(boffMediaUserTotp.userId, userId));

      await tx
        .delete(boffMediaUserBackupCodes)
        .where(eq(boffMediaUserBackupCodes.userId, userId));
      if (codeHashes.length > 0) {
        await tx
          .insert(boffMediaUserBackupCodes)
          .values(codeHashes.map((codeHash) => ({ userId, codeHash })));
      }
    });
  }

  /**
   * Record the TOTP step a code was accepted at, but only if it moves FORWARD.
   * `> lastStep` in the WHERE is the replay guard: two requests carrying the
   * same six digits race, one wins, and the loser sees zero rows changed and is
   * told the code is spent.
   *
   * @returns true if this call claimed the step.
   */
  async claimStep(userId: number, step: number): Promise<boolean> {
    const result = await this.db
      .update(boffMediaUserTotp)
      .set({ lastStep: step })
      .where(
        and(
          eq(boffMediaUserTotp.userId, userId),
          // NULL only between the row being created and the first accepted
          // code. `lastStep < step` alone would silently drop that row — SQL
          // comparisons against NULL are never true — and the very first login
          // after enrolment would fail.
          or(
            isNull(boffMediaUserTotp.lastStep),
            lt(boffMediaUserTotp.lastStep, step),
          ),
        ),
      );
    const header = (Array.isArray(result) ? result[0] : result) as {
      affectedRows?: number;
    };
    return (header?.affectedRows ?? 0) > 0;
  }

  async listUnusedBackupCodes(
    userId: number,
  ): Promise<{ id: number; codeHash: string }[]> {
    return this.db
      .select({
        id: boffMediaUserBackupCodes.id,
        codeHash: boffMediaUserBackupCodes.codeHash,
      })
      .from(boffMediaUserBackupCodes)
      .where(
        and(
          eq(boffMediaUserBackupCodes.userId, userId),
          isNull(boffMediaUserBackupCodes.usedAt),
        ),
      );
  }

  /** Spend one backup code. Conditional on it still being unused for the same
   *  reason `claimRotation` is: a replayed code must lose the race, not win it
   *  twice. */
  async consumeBackupCode(id: number): Promise<boolean> {
    const result = await this.db
      .update(boffMediaUserBackupCodes)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(boffMediaUserBackupCodes.id, id),
          isNull(boffMediaUserBackupCodes.usedAt),
        ),
      );
    const header = (Array.isArray(result) ? result[0] : result) as {
      affectedRows?: number;
    };
    return (header?.affectedRows ?? 0) > 0;
  }

  async countUnusedBackupCodes(userId: number): Promise<number> {
    const rows = await this.listUnusedBackupCodes(userId);
    return rows.length;
  }

  async replaceBackupCodes(
    userId: number,
    codeHashes: string[],
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .delete(boffMediaUserBackupCodes)
        .where(eq(boffMediaUserBackupCodes.userId, userId));
      if (codeHashes.length > 0) {
        await tx
          .insert(boffMediaUserBackupCodes)
          .values(codeHashes.map((codeHash) => ({ userId, codeHash })));
      }
    });
  }
}
