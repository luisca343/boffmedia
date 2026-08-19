import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, desc, eq, or, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  gobiernoMultas,
  gobiernoTasas,
  GobiernoMulta,
  GobiernoTasa,
} from '@/_db/schema/SmartRotomGobierno';
import {
  starBankTransactions,
  StarBankTransaction,
} from '@/_db/schema/SmartRotomStarBank';
import { generateGobCode } from '../_shared/code.util';
import { CreateMultaDto, CreateTasaDto } from './dto/hacienda.dto';

@Injectable()
export class HaciendaRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== MULTAS ====================

  async listMultas(
    page: number,
    limit: number,
    filters: { status?: string; player?: string },
  ) {
    const conditions = [
      filters.status ? eq(gobiernoMultas.status, filters.status) : undefined,
      filters.player
        ? eq(gobiernoMultas.playerUuid, filters.player)
        : undefined,
    ].filter((c) => c !== undefined);
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalRows] = await Promise.all([
      this.db
        .select()
        .from(gobiernoMultas)
        .where(where)
        .orderBy(desc(gobiernoMultas.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      this.db
        .select({ total: sql<number>`count(*)` })
        .from(gobiernoMultas)
        .where(where),
    ]);
    return { items, total: Number(totalRows[0]?.total ?? 0) };
  }

  async findMulta(id: number): Promise<GobiernoMulta | null> {
    const rows = await this.db
      .select()
      .from(gobiernoMultas)
      .where(eq(gobiernoMultas.id, id));
    return rows[0] ?? null;
  }

  async createMulta(data: CreateMultaDto): Promise<GobiernoMulta> {
    const code = generateGobCode('MUL');
    const result = await this.db.insert(gobiernoMultas).values({
      code,
      playerUuid: data.playerUuid,
      amount: data.amount,
      reason: data.reason,
      issuedByUuid: data.issuedBy,
      denunciaId: data.denunciaId,
    });
    return (await this.findMulta(result[0].insertId)) as GobiernoMulta;
  }

  async updateMulta(
    id: number,
    data: Partial<{ amount: number; reason: string; denunciaId: number }>,
  ): Promise<GobiernoMulta | null> {
    if (Object.keys(data).length > 0) {
      await this.db
        .update(gobiernoMultas)
        .set(data)
        .where(eq(gobiernoMultas.id, id));
    }
    return this.findMulta(id);
  }

  async deleteMulta(id: number): Promise<boolean> {
    const result = await this.db
      .delete(gobiernoMultas)
      .where(eq(gobiernoMultas.id, id));
    return result[0].affectedRows > 0;
  }

  async payMulta(id: number, paidTxId: number): Promise<GobiernoMulta> {
    await this.db
      .update(gobiernoMultas)
      .set({ status: 'paid', paidTxId, paidAt: new Date() })
      .where(eq(gobiernoMultas.id, id));
    return (await this.findMulta(id)) as GobiernoMulta;
  }

  // Shared by both the direct hacienda "cancel" endpoint and JusticiaService, which calls this
  // when an appeal against an already-paid fine is overturned (after it refunds the payer out
  // of the treasury — that refund's tx id lives on the apelacion row, not here).
  async cancelMulta(id: number): Promise<GobiernoMulta> {
    await this.db
      .update(gobiernoMultas)
      .set({ status: 'cancelled' })
      .where(eq(gobiernoMultas.id, id));
    return (await this.findMulta(id)) as GobiernoMulta;
  }

  // ==================== TASAS ====================

  async listTasas(filters: {
    kind?: string;
    active?: boolean;
  }): Promise<GobiernoTasa[]> {
    const conditions = [
      filters.kind ? eq(gobiernoTasas.kind, filters.kind) : undefined,
      filters.active !== undefined
        ? eq(gobiernoTasas.active, filters.active)
        : undefined,
    ].filter((c) => c !== undefined);
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    return this.db
      .select()
      .from(gobiernoTasas)
      .where(where)
      .orderBy(desc(gobiernoTasas.createdAt));
  }

  async findTasa(id: number): Promise<GobiernoTasa | null> {
    const rows = await this.db
      .select()
      .from(gobiernoTasas)
      .where(eq(gobiernoTasas.id, id));
    return rows[0] ?? null;
  }

  async createTasa(data: CreateTasaDto): Promise<GobiernoTasa> {
    const code = generateGobCode('TAS');
    const result = await this.db.insert(gobiernoTasas).values({
      code,
      concept: data.concept,
      kind: data.kind,
      rate: data.rate,
      amount: data.amount ?? 0,
    });
    return (await this.findTasa(result[0].insertId)) as GobiernoTasa;
  }

  async updateTasa(
    id: number,
    data: Partial<{
      concept: string;
      kind: string;
      rate: string;
      amount: number;
      active: boolean;
    }>,
  ): Promise<GobiernoTasa | null> {
    if (Object.keys(data).length > 0) {
      await this.db
        .update(gobiernoTasas)
        .set(data)
        .where(eq(gobiernoTasas.id, id));
    }
    return this.findTasa(id);
  }

  async deleteTasa(id: number): Promise<boolean> {
    const result = await this.db
      .delete(gobiernoTasas)
      .where(eq(gobiernoTasas.id, id));
    return result[0].affectedRows > 0;
  }

  // ==================== TESORERIA ====================

  async getTreasuryTransactions(
    treasuryId: number,
  ): Promise<StarBankTransaction[]> {
    return this.db
      .select()
      .from(starBankTransactions)
      .where(
        or(
          eq(starBankTransactions.fromAccountId, treasuryId),
          eq(starBankTransactions.toAccountId, treasuryId),
        ),
      );
  }
}
