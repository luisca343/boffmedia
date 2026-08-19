import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  gobiernoDenuncias,
  gobiernoBuscados,
  gobiernoPatrullas,
  gobiernoPatrullaOficiales,
  gobiernoBitacora,
  GobiernoDenuncia,
  GobiernoBuscado,
  GobiernoPatrulla,
} from '@/_db/schema/SmartRotomGobierno';
import { generateGobCode } from '../_shared/code.util';
import {
  CreateDenunciaDto,
  CreateBuscadoDto,
  CreatePatrullaDto,
} from './dto/seguridad.dto';

@Injectable()
export class SeguridadRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== DENUNCIAS ====================

  async listDenuncias(
    page: number,
    limit: number,
    filters: {
      status?: string;
      category?: string;
      town?: string;
      accused?: string;
      reporter?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const conditions = [
      filters.status ? eq(gobiernoDenuncias.status, filters.status) : undefined,
      filters.category
        ? eq(gobiernoDenuncias.category, filters.category)
        : undefined,
      filters.town ? eq(gobiernoDenuncias.town, filters.town) : undefined,
      filters.accused
        ? eq(gobiernoDenuncias.accusedUuid, filters.accused)
        : undefined,
      filters.reporter
        ? eq(gobiernoDenuncias.reporterUuid, filters.reporter)
        : undefined,
      filters.dateFrom
        ? gte(gobiernoDenuncias.createdAt, new Date(filters.dateFrom))
        : undefined,
      filters.dateTo
        ? lte(gobiernoDenuncias.createdAt, new Date(filters.dateTo))
        : undefined,
    ].filter((c) => c !== undefined);
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalRows] = await Promise.all([
      this.db
        .select()
        .from(gobiernoDenuncias)
        .where(where)
        .orderBy(desc(gobiernoDenuncias.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      this.db
        .select({ total: sql<number>`count(*)` })
        .from(gobiernoDenuncias)
        .where(where),
    ]);
    return { items, total: Number(totalRows[0]?.total ?? 0) };
  }

  async findDenuncia(id: number): Promise<GobiernoDenuncia | null> {
    const rows = await this.db
      .select()
      .from(gobiernoDenuncias)
      .where(eq(gobiernoDenuncias.id, id));
    return rows[0] ?? null;
  }

  async createDenuncia(data: CreateDenunciaDto): Promise<GobiernoDenuncia> {
    const code = generateGobCode('DEN');
    const result = await this.db.insert(gobiernoDenuncias).values({
      code,
      town: data.town,
      plotNumber: data.plotNumber,
      accusedUuid: data.accusedUuid,
      reporterUuid: data.reporterUuid,
      category: data.category,
      description: data.description,
    });
    return (await this.findDenuncia(result[0].insertId)) as GobiernoDenuncia;
  }

  async updateDenuncia(
    id: number,
    data: Partial<{
      town: string;
      plotNumber: number;
      accusedUuid: string;
      category: string;
      description: string;
      status: string;
    }>,
  ): Promise<GobiernoDenuncia | null> {
    if (Object.keys(data).length > 0) {
      await this.db
        .update(gobiernoDenuncias)
        .set(data)
        .where(eq(gobiernoDenuncias.id, id));
    }
    return this.findDenuncia(id);
  }

  async resolveDenuncia(
    id: number,
    status: 'resolved' | 'dismissed',
    resolution: string,
    resolvedByUuid: string,
  ): Promise<GobiernoDenuncia> {
    await this.db
      .update(gobiernoDenuncias)
      .set({ status, resolution, resolvedByUuid, resolvedAt: new Date() })
      .where(eq(gobiernoDenuncias.id, id));
    return (await this.findDenuncia(id)) as GobiernoDenuncia;
  }

  async deleteDenuncia(id: number): Promise<boolean> {
    const result = await this.db
      .delete(gobiernoDenuncias)
      .where(eq(gobiernoDenuncias.id, id));
    return result[0].affectedRows > 0;
  }

  // ==================== BUSCADOS ====================

  async listBuscados(
    page: number,
    limit: number,
    filters: { status?: string; severity?: string; player?: string },
  ) {
    const conditions = [
      filters.status ? eq(gobiernoBuscados.status, filters.status) : undefined,
      filters.severity
        ? eq(gobiernoBuscados.severity, filters.severity)
        : undefined,
      filters.player
        ? eq(gobiernoBuscados.playerUuid, filters.player)
        : undefined,
    ].filter((c) => c !== undefined);
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalRows] = await Promise.all([
      this.db
        .select()
        .from(gobiernoBuscados)
        .where(where)
        .orderBy(desc(gobiernoBuscados.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      this.db
        .select({ total: sql<number>`count(*)` })
        .from(gobiernoBuscados)
        .where(where),
    ]);
    return { items, total: Number(totalRows[0]?.total ?? 0) };
  }

  async findBuscado(id: number): Promise<GobiernoBuscado | null> {
    const rows = await this.db
      .select()
      .from(gobiernoBuscados)
      .where(eq(gobiernoBuscados.id, id));
    return rows[0] ?? null;
  }

  async createBuscado(data: CreateBuscadoDto): Promise<GobiernoBuscado> {
    const code = generateGobCode('BUS');
    const result = await this.db.insert(gobiernoBuscados).values({
      code,
      playerUuid: data.playerUuid,
      severity: data.severity,
      bounty: data.bounty ?? 0,
      offense: data.offense,
      reportedByUuid: data.reportedBy,
      lastSeen: data.lastSeen,
      notes: data.notes,
    });
    return (await this.findBuscado(result[0].insertId)) as GobiernoBuscado;
  }

  async updateBuscado(
    id: number,
    data: Partial<{
      severity: string;
      bounty: number;
      offense: string;
      lastSeen: string;
      notes: string;
      status: string;
    }>,
  ): Promise<GobiernoBuscado | null> {
    if (Object.keys(data).length > 0) {
      await this.db
        .update(gobiernoBuscados)
        .set(data)
        .where(eq(gobiernoBuscados.id, id));
    }
    return this.findBuscado(id);
  }

  async deleteBuscado(id: number): Promise<boolean> {
    const result = await this.db
      .delete(gobiernoBuscados)
      .where(eq(gobiernoBuscados.id, id));
    return result[0].affectedRows > 0;
  }

  async captureBuscado(
    id: number,
    capturedByUuid: string,
    payoutTxId: number | null,
  ): Promise<GobiernoBuscado> {
    await this.db
      .update(gobiernoBuscados)
      .set({
        status: 'captured',
        capturedByUuid,
        capturedAt: new Date(),
        payoutTxId,
      })
      .where(eq(gobiernoBuscados.id, id));
    return (await this.findBuscado(id)) as GobiernoBuscado;
  }

  // ==================== PATRULLAS ====================

  async listPatrullas(status?: string): Promise<GobiernoPatrulla[]> {
    const where = status ? eq(gobiernoPatrullas.status, status) : undefined;
    return this.db
      .select()
      .from(gobiernoPatrullas)
      .where(where)
      .orderBy(desc(gobiernoPatrullas.createdAt));
  }

  async findPatrulla(id: number): Promise<GobiernoPatrulla | null> {
    const rows = await this.db
      .select()
      .from(gobiernoPatrullas)
      .where(eq(gobiernoPatrullas.id, id));
    return rows[0] ?? null;
  }

  async listOfficers(patrullaId: number): Promise<string[]> {
    const rows = await this.db
      .select({ uuid: gobiernoPatrullaOficiales.uuid })
      .from(gobiernoPatrullaOficiales)
      .where(eq(gobiernoPatrullaOficiales.patrullaId, patrullaId));
    return rows.map((r) => r.uuid);
  }

  async listOfficersForMany(
    patrullaIds: number[],
  ): Promise<Map<number, string[]>> {
    if (patrullaIds.length === 0) return new Map();
    const rows = await this.db.select().from(gobiernoPatrullaOficiales);
    const map = new Map<number, string[]>();
    for (const row of rows) {
      if (!patrullaIds.includes(row.patrullaId)) continue;
      const list = map.get(row.patrullaId) ?? [];
      list.push(row.uuid);
      map.set(row.patrullaId, list);
    }
    return map;
  }

  private async setOfficers(
    patrullaId: number,
    officers: string[],
  ): Promise<void> {
    await this.db
      .delete(gobiernoPatrullaOficiales)
      .where(eq(gobiernoPatrullaOficiales.patrullaId, patrullaId));
    if (officers.length > 0) {
      await this.db
        .insert(gobiernoPatrullaOficiales)
        .values(officers.map((uuid) => ({ patrullaId, uuid })));
    }
  }

  async createPatrulla(data: CreatePatrullaDto): Promise<GobiernoPatrulla> {
    const result = await this.db.insert(gobiernoPatrullas).values({
      label: data.label,
      fromTime: data.fromTime,
      toTime: data.toTime,
      zone: data.zone,
      status: data.status ?? 'rest',
    });
    const id = result[0].insertId;
    if (data.officers && data.officers.length > 0) {
      await this.setOfficers(id, data.officers);
    }
    return (await this.findPatrulla(id)) as GobiernoPatrulla;
  }

  async updatePatrulla(
    id: number,
    data: Partial<{
      label: string;
      fromTime: string;
      toTime: string;
      zone: string;
      status: string;
    }>,
    officers?: string[],
  ): Promise<GobiernoPatrulla | null> {
    if (Object.keys(data).length > 0) {
      await this.db
        .update(gobiernoPatrullas)
        .set(data)
        .where(eq(gobiernoPatrullas.id, id));
    }
    if (officers) {
      await this.setOfficers(id, officers);
    }
    return this.findPatrulla(id);
  }

  async deletePatrulla(id: number): Promise<boolean> {
    const result = await this.db
      .delete(gobiernoPatrullas)
      .where(eq(gobiernoPatrullas.id, id));
    return result[0].affectedRows > 0;
  }

  // ==================== BITACORA ====================

  async listBitacora(filters: {
    patrullaId?: number;
    tone?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const conditions = [
      filters.patrullaId !== undefined
        ? eq(gobiernoBitacora.patrullaId, filters.patrullaId)
        : undefined,
      filters.tone ? eq(gobiernoBitacora.tone, filters.tone) : undefined,
      filters.dateFrom
        ? gte(gobiernoBitacora.createdAt, new Date(filters.dateFrom))
        : undefined,
      filters.dateTo
        ? lte(gobiernoBitacora.createdAt, new Date(filters.dateTo))
        : undefined,
    ].filter((c) => c !== undefined);
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    return this.db
      .select()
      .from(gobiernoBitacora)
      .where(where)
      .orderBy(desc(gobiernoBitacora.createdAt))
      .limit(200);
  }

  async appendBitacora(data: {
    patrullaId?: number;
    uuid: string;
    text: string;
    tone?: string;
  }) {
    await this.db.insert(gobiernoBitacora).values({
      patrullaId: data.patrullaId,
      uuid: data.uuid,
      text: data.text,
      tone: data.tone ?? 'info',
    });
    return this.listBitacora({ patrullaId: data.patrullaId });
  }
}
