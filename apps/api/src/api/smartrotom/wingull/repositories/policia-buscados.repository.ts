import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { policiaBuscados, PoliciaBuscado, NewPoliciaBuscado } from '@/_db/schema/PoliciaBuscados';
import { BuscadoSeverity, BuscadoStatus, CreateBuscadoDto, UpdateBuscadoStatusDto } from '../dto/buscado.dto';

@Injectable()
export class PoliciaBuscadosRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  async create(dto: CreateBuscadoDto): Promise<PoliciaBuscado> {
    const values: NewPoliciaBuscado = {
      playerUuid: dto.playerUuid,
      playerUsername: dto.playerUsername,
      offense: dto.offense,
      severity: dto.severity,
      reportedBy: dto.reportedBy,
      status: 'active',
      notes: dto.notes ?? null,
    };
    const result = await this.db.insert(policiaBuscados).values(values);
    return this.findById(result[0].insertId) as Promise<PoliciaBuscado>;
  }

  async findAll(filters?: { status?: BuscadoStatus; severity?: BuscadoSeverity }): Promise<PoliciaBuscado[]> {
    const conditions = [];
    if (filters?.status) conditions.push(eq(policiaBuscados.status, filters.status));
    if (filters?.severity) conditions.push(eq(policiaBuscados.severity, filters.severity));

    const query = this.db.select().from(policiaBuscados);
    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    return query;
  }

  async findById(id: number): Promise<PoliciaBuscado | null> {
    const rows = await this.db.select().from(policiaBuscados).where(eq(policiaBuscados.id, id));
    return rows[0] ?? null;
  }

  async updateStatus(id: number, dto: UpdateBuscadoStatusDto): Promise<PoliciaBuscado | null> {
    const updates: Partial<PoliciaBuscado> = { status: dto.status };
    if (dto.notes) updates.notes = dto.notes;

    await this.db.update(policiaBuscados).set(updates as any).where(eq(policiaBuscados.id, id));
    return this.findById(id);
  }
}
