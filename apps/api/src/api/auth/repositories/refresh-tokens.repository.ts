import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  boffMediaRefreshTokens,
  type RefreshTokenRow,
} from '@/_db/schema/BoffMediaAuth';

export type { RefreshTokenRow };

/**
 * The ledger behind refresh-token rotation (see the table comment in
 * `_db/schema/BoffMediaAuth.ts`).
 *
 * Every method here is deliberately small: the interesting logic — what counts
 * as reuse, what a family revocation means — belongs to `AuthService`, and the
 * one thing that CANNOT live there is the atomic claim in `claimRotation()`.
 */
@Injectable()
export class RefreshTokensRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  async issue(row: {
    jti: string;
    familyId: string;
    userId: number;
    expiresAt: Date;
  }): Promise<void> {
    await this.db.insert(boffMediaRefreshTokens).values(row);
  }

  async findByJti(jti: string): Promise<RefreshTokenRow | null> {
    const [row] = await this.db
      .select()
      .from(boffMediaRefreshTokens)
      .where(eq(boffMediaRefreshTokens.jti, jti))
      .limit(1);
    return row ?? null;
  }

  /**
   * Spend a refresh token, exactly once.
   *
   * `WHERE jti = ? AND rotated_at IS NULL` is the whole single-use guarantee:
   * MySQL serialises the two updates, so of two requests presenting the same
   * token one reports a changed row and the other reports zero. Reading the row
   * first and then updating it would leave a window between the two in which
   * both callers still see `rotated_at IS NULL` — and a race would then look
   * exactly like the theft it is supposed to detect.
   *
   * @returns true if THIS call was the one that spent the token.
   */
  async claimRotation(jti: string, now: Date): Promise<boolean> {
    const result = await this.db
      .update(boffMediaRefreshTokens)
      .set({ rotatedAt: now })
      .where(
        and(
          eq(boffMediaRefreshTokens.jti, jti),
          isNull(boffMediaRefreshTokens.rotatedAt),
          isNull(boffMediaRefreshTokens.revokedAt),
        ),
      );
    // drizzle-mysql2 returns [ResultSetHeader, FieldPacket[]].
    const header = (Array.isArray(result) ? result[0] : result) as {
      affectedRows?: number;
    };
    return (header?.affectedRows ?? 0) > 0;
  }

  /** Kill every token descended from one sign-in. The response to a detected
   *  reuse, and nothing else calls it. */
  async revokeFamily(familyId: string, now: Date): Promise<void> {
    await this.db
      .update(boffMediaRefreshTokens)
      .set({ revokedAt: now })
      .where(
        and(
          eq(boffMediaRefreshTokens.familyId, familyId),
          isNull(boffMediaRefreshTokens.revokedAt),
        ),
      );
  }
}
