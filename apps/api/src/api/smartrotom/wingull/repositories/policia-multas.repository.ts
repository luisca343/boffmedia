import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { policiaMultas, PoliciaMulta, NewPoliciaMulta } from '@/_db/schema/PoliciaMultas';
import { CreateMultaDto, MultaStatus, UpdateMultaStatusDto } from '../dto/multa.dto';

@Injectable()
export class PoliciaMultasRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  async create(dto: CreateMultaDto): Promise<PoliciaMulta> {
    const values: NewPoliciaMulta = {
      playerUuid: dto.playerUuid,
      playerUsername: dto.playerUsername,
      amount: String(dto.amount),
      reason: dto.reason,
      issuedBy: dto.issuedBy,
      status: 'pending',
    };
    const result = await this.db.insert(policiaMultas).values(values);
    return this.findById(result[0].insertId) as Promise<PoliciaMulta>;
  }

  async findAll(filters?: { playerUuid?: string; status?: MultaStatus }): Promise<PoliciaMulta[]> {
    const conditions = [];
    if (filters?.playerUuid) conditions.push(eq(policiaMultas.playerUuid, filters.playerUuid));
    if (filters?.status) conditions.push(eq(policiaMultas.status, filters.status));

    const query = this.db.select().from(policiaMultas);
    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    return query;
  }

  async findById(id: number): Promise<PoliciaMulta | null> {
    const rows = await this.db.select().from(policiaMultas).where(eq(policiaMultas.id, id));
    return rows[0] ?? null;
  }

  async updateStatus(id: number, dto: UpdateMultaStatusDto): Promise<PoliciaMulta | null> {
    const updates: Partial<PoliciaMulta> & { paidAt?: Date } = { status: dto.status };
    if (dto.status === 'paid') updates.paidAt = new Date();

    await this.db.update(policiaMultas).set(updates as any).where(eq(policiaMultas.id, id));
    return this.findById(id);
  }
}
