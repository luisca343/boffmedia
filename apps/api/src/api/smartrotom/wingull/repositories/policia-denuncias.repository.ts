import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  policiaDenuncias,
  PoliciaDenuncia,
  NewPoliciaDenuncia,
} from '@/_db/schema/PoliciaDeuncias';
import { CreateDenunciaDto, DenunciaStatus, UpdateDenunciaStatusDto } from '../dto/denuncia.dto';

@Injectable()
export class PoliciaDenunciasRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  async create(dto: CreateDenunciaDto): Promise<PoliciaDenuncia> {
    const values: NewPoliciaDenuncia = {
      reporterUuid: dto.reporterUuid,
      reporterUsername: dto.reporterUsername,
      accusedUuid: dto.accusedUuid ?? null,
      accusedUsername: dto.accusedUsername ?? null,
      town: dto.town,
      plotNumber: dto.plotNumber ?? null,
      category: dto.category,
      description: dto.description,
      status: 'pending',
    };
    const result = await this.db.insert(policiaDenuncias).values(values);
    return this.findById(result[0].insertId) as Promise<PoliciaDenuncia>;
  }

  async findAll(filters?: {
    town?: string;
    status?: DenunciaStatus;
    accusedUuid?: string;
  }): Promise<PoliciaDenuncia[]> {
    const conditions = [];
    if (filters?.town) conditions.push(eq(policiaDenuncias.town, filters.town));
    if (filters?.status) conditions.push(eq(policiaDenuncias.status, filters.status));
    if (filters?.accusedUuid) conditions.push(eq(policiaDenuncias.accusedUuid, filters.accusedUuid));

    const query = this.db.select().from(policiaDenuncias);
    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    return query;
  }

  async findById(id: number): Promise<PoliciaDenuncia | null> {
    const rows = await this.db
      .select()
      .from(policiaDenuncias)
      .where(eq(policiaDenuncias.id, id));
    return rows[0] ?? null;
  }

  async updateStatus(id: number, dto: UpdateDenunciaStatusDto): Promise<PoliciaDenuncia | null> {
    const updates: Partial<PoliciaDenuncia> & { updatedAt?: Date; resolvedAt?: Date } = {
      status: dto.status,
      updatedAt: new Date(),
    };
    if (dto.resolvedBy) updates.resolvedBy = dto.resolvedBy;
    if (dto.notes) updates.notes = dto.notes;
    if (dto.status === 'resolved') updates.resolvedAt = new Date();

    await this.db
      .update(policiaDenuncias)
      .set(updates as any)
      .where(eq(policiaDenuncias.id, id));
    return this.findById(id);
  }
}
