import { randomBytes, createHash } from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { sharexTokens, type SharexToken } from '@/_db/schema/Sharex';
import { MySQL2Service } from '@/_utils/MySQL2Service';

/** 32 random bytes as hex. Long enough that guessing is not a threat model. */
const TOKEN_BYTES = 32;

/** What an admin sees. The plaintext is deliberately absent. */
export interface SharexTokenSummary {
  id: number;
  label: string;
  createdBy: number | null;
  createdAt: Date;
  usedAt: Date | null;
  revoked: boolean;
}

@Injectable()
export class SharexTokensService {
  constructor(private db: MySQL2Service) {}

  /** SHA-256 hex. The only form of a token that touches the database. */
  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private toSummary(row: SharexToken): SharexTokenSummary {
    return {
      id: row.id,
      label: row.label,
      createdBy: row.createdBy ?? null,
      createdAt: row.createdAt,
      usedAt: row.usedAt ?? null,
      revoked: row.deletedAt !== null,
    };
  }

  /**
   * Issue a token. The plaintext is returned HERE AND NOWHERE ELSE — only its
   * hash is stored, so a lost token is reissued, never recovered.
   */
  async create(
    label: string,
    createdBy: number | null,
  ): Promise<{ token: string; summary: SharexTokenSummary }> {
    const token = randomBytes(TOKEN_BYTES).toString('hex');

    const [result] = await this.db
      .getDrizzle()
      .insert(sharexTokens)
      .values({ label, tokenHash: this.hash(token), createdBy })
      .execute();

    const row = await this.findById(result.insertId);
    return { token, summary: this.toSummary(row) };
  }

  async list(): Promise<SharexTokenSummary[]> {
    const rows = await this.db
      .getDrizzle()
      .select()
      .from(sharexTokens)
      .orderBy(desc(sharexTokens.createdAt));

    return rows.map((r) => this.toSummary(r));
  }

  /** Revoke by soft delete, so images already uploaded keep pointing at it. */
  async revoke(id: number): Promise<SharexTokenSummary> {
    const row = await this.findById(id);
    if (row.deletedAt === null) {
      await this.db
        .getDrizzle()
        .update(sharexTokens)
        .set({ deletedAt: new Date() })
        .where(eq(sharexTokens.id, id))
        .execute();
    }
    return this.toSummary(await this.findById(id));
  }

  /**
   * Resolve a presented token to its owner, or null.
   *
   * Looked up by hash rather than compared row-by-row: the index does the work,
   * and a revoked token is excluded by the query itself so it can never be
   * accepted by a caller that forgets to check `deletedAt`.
   */
  async resolve(token: string): Promise<SharexToken | null> {
    if (!token) return null;

    const rows = await this.db
      .getDrizzle()
      .select()
      .from(sharexTokens)
      .where(
        and(
          eq(sharexTokens.tokenHash, this.hash(token)),
          isNull(sharexTokens.deletedAt),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  /** Stamp the last successful upload. Best-effort: never fails an upload. */
  async touch(id: number): Promise<void> {
    await this.db
      .getDrizzle()
      .update(sharexTokens)
      .set({ usedAt: new Date() })
      .where(eq(sharexTokens.id, id))
      .execute();
  }

  private async findById(id: number): Promise<SharexToken> {
    const rows = await this.db
      .getDrizzle()
      .select()
      .from(sharexTokens)
      .where(eq(sharexTokens.id, id))
      .limit(1);

    if (!rows[0]) throw new NotFoundException(`ShareX token ${id} not found`);
    return rows[0];
  }
}
