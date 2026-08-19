import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  gobiernoZonas,
  gobiernoParcelas,
  gobiernoParcelaHistorial,
  gobiernoSubastas,
  gobiernoPujas,
  GobiernoZona,
  GobiernoParcela,
  GobiernoSubasta,
} from '@/_db/schema/SmartRotomGobierno';
import {
  CreateZonaDto,
  UpdateZonaDto,
  CreateParcelaHistorialDto,
} from './dto/urbanismo.dto';

@Injectable()
export class UrbanismoRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== ZONAS ====================

  async listZonas(town?: string): Promise<GobiernoZona[]> {
    const where = town ? eq(gobiernoZonas.town, town) : undefined;
    return this.db
      .select()
      .from(gobiernoZonas)
      .where(where)
      .orderBy(desc(gobiernoZonas.createdAt));
  }

  async findZona(id: number): Promise<GobiernoZona | null> {
    const rows = await this.db
      .select()
      .from(gobiernoZonas)
      .where(eq(gobiernoZonas.id, id));
    return rows[0] ?? null;
  }

  async createZona(data: CreateZonaDto): Promise<GobiernoZona> {
    const result = await this.db.insert(gobiernoZonas).values({
      town: data.town,
      name: data.name,
      kind: data.kind,
      description: data.description,
    });
    return (await this.findZona(result[0].insertId)) as GobiernoZona;
  }

  async updateZona(
    id: number,
    data: UpdateZonaDto,
  ): Promise<GobiernoZona | null> {
    const set: Record<string, unknown> = {};
    if (data.town !== undefined) set.town = data.town;
    if (data.name !== undefined) set.name = data.name;
    if (data.kind !== undefined) set.kind = data.kind;
    if (data.description !== undefined) set.description = data.description;
    if (Object.keys(set).length > 0) {
      await this.db
        .update(gobiernoZonas)
        .set(set)
        .where(eq(gobiernoZonas.id, id));
    }
    return this.findZona(id);
  }

  async deleteZona(id: number): Promise<boolean> {
    const result = await this.db
      .delete(gobiernoZonas)
      .where(eq(gobiernoZonas.id, id));
    return result[0].affectedRows > 0;
  }

  // ==================== PARCELAS (metadata only — real plot truth lives in WorldGuard) ====

  async findParcelaByRegion(regionId: string): Promise<GobiernoParcela | null> {
    const rows = await this.db
      .select()
      .from(gobiernoParcelas)
      .where(eq(gobiernoParcelas.regionId, regionId));
    return rows[0] ?? null;
  }

  async findParcelasByRegions(regionIds: string[]): Promise<GobiernoParcela[]> {
    if (regionIds.length === 0) return [];
    return this.db
      .select()
      .from(gobiernoParcelas)
      .where(inArray(gobiernoParcelas.regionId, regionIds));
  }

  async upsertParcela(data: {
    regionId: string;
    town: string;
    number: number;
    zonaId?: number | null;
    status?: string;
    taxAmount?: number;
    taxDueAt?: string;
    notes?: string;
  }): Promise<GobiernoParcela> {
    const existing = await this.findParcelaByRegion(data.regionId);
    if (existing) {
      await this.db
        .update(gobiernoParcelas)
        .set({
          town: data.town,
          number: data.number,
          zonaId: data.zonaId,
          status: data.status,
          taxAmount: data.taxAmount,
          taxDueAt: data.taxDueAt ? new Date(data.taxDueAt) : undefined,
          notes: data.notes,
        })
        .where(eq(gobiernoParcelas.regionId, data.regionId));
      return (await this.findParcelaByRegion(data.regionId)) as GobiernoParcela;
    }

    await this.db.insert(gobiernoParcelas).values({
      regionId: data.regionId,
      town: data.town,
      number: data.number,
      zonaId: data.zonaId,
      status: data.status ?? 'ocupada',
      taxAmount: data.taxAmount ?? 500,
      taxDueAt: data.taxDueAt ? new Date(data.taxDueAt) : undefined,
      notes: data.notes,
    });
    return (await this.findParcelaByRegion(data.regionId)) as GobiernoParcela;
  }

  async updateParcela(
    regionId: string,
    data: Partial<{
      zonaId: number | null;
      status: string;
      taxAmount: number;
      taxDueAt: string;
      notes: string;
    }>,
  ): Promise<GobiernoParcela | null> {
    const set: Record<string, unknown> = { ...data };
    if ('taxDueAt' in data) {
      set.taxDueAt = data.taxDueAt ? new Date(data.taxDueAt) : null;
    }
    if (Object.keys(set).length > 0) {
      await this.db
        .update(gobiernoParcelas)
        .set(set)
        .where(eq(gobiernoParcelas.regionId, regionId));
    }
    return this.findParcelaByRegion(regionId);
  }

  async listAllParcelaMetadata(): Promise<GobiernoParcela[]> {
    return this.db.select().from(gobiernoParcelas);
  }

  // ==================== PARCELA HISTORIAL ====================

  async listHistorial(regionId: string) {
    return this.db
      .select()
      .from(gobiernoParcelaHistorial)
      .where(eq(gobiernoParcelaHistorial.regionId, regionId))
      .orderBy(desc(gobiernoParcelaHistorial.changedAt));
  }

  // The Historial screen: the aggregate ownership-change register across every plot in Teras,
  // not scoped to one region.
  async listAllHistorial(
    page: number,
    limit: number,
    filters: {
      town?: string;
      regionId?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const conditions = [
      filters.town
        ? eq(gobiernoParcelaHistorial.town, filters.town)
        : undefined,
      filters.regionId
        ? eq(gobiernoParcelaHistorial.regionId, filters.regionId)
        : undefined,
      filters.dateFrom
        ? gte(gobiernoParcelaHistorial.changedAt, new Date(filters.dateFrom))
        : undefined,
      filters.dateTo
        ? lte(gobiernoParcelaHistorial.changedAt, new Date(filters.dateTo))
        : undefined,
    ].filter((c) => c !== undefined);
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalRows] = await Promise.all([
      this.db
        .select()
        .from(gobiernoParcelaHistorial)
        .where(where)
        .orderBy(desc(gobiernoParcelaHistorial.changedAt))
        .limit(limit)
        .offset((page - 1) * limit),
      this.db
        .select({ total: sql<number>`count(*)` })
        .from(gobiernoParcelaHistorial)
        .where(where),
    ]);
    return { items, total: Number(totalRows[0]?.total ?? 0) };
  }

  async appendHistorial(regionId: string, data: CreateParcelaHistorialDto) {
    await this.db.insert(gobiernoParcelaHistorial).values({
      regionId,
      town: data.town,
      number: data.number,
      previousOwnerUuid: data.previousOwnerUuid,
      newOwnerUuid: data.newOwnerUuid,
      reason: data.reason,
    });
    return this.listHistorial(regionId);
  }

  // ==================== SUBASTAS ====================

  async listSubastas(
    page: number,
    limit: number,
    status?: string,
    town?: string,
  ) {
    const conditions = [
      status ? eq(gobiernoSubastas.status, status) : undefined,
      town ? eq(gobiernoSubastas.town, town) : undefined,
    ].filter((c) => c !== undefined);
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalRows] = await Promise.all([
      this.db
        .select()
        .from(gobiernoSubastas)
        .where(where)
        .orderBy(desc(gobiernoSubastas.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      this.db
        .select({ total: sql<number>`count(*)` })
        .from(gobiernoSubastas)
        .where(where),
    ]);
    return { items, total: Number(totalRows[0]?.total ?? 0) };
  }

  async findSubasta(id: number): Promise<GobiernoSubasta | null> {
    const rows = await this.db
      .select()
      .from(gobiernoSubastas)
      .where(eq(gobiernoSubastas.id, id));
    return rows[0] ?? null;
  }

  async createSubasta(data: {
    code: string;
    regionId: string;
    town: string;
    number: number;
    startBid: number;
    reason?: string;
    endsAt: string;
    createdByUuid: string;
  }): Promise<GobiernoSubasta> {
    const result = await this.db.insert(gobiernoSubastas).values({
      code: data.code,
      regionId: data.regionId,
      town: data.town,
      number: data.number,
      startBid: data.startBid,
      currentBid: data.startBid,
      reason: data.reason,
      status: 'live',
      endsAt: new Date(data.endsAt),
      createdByUuid: data.createdByUuid,
    });
    return (await this.findSubasta(result[0].insertId)) as GobiernoSubasta;
  }

  async updateSubasta(
    id: number,
    data: Partial<{
      startBid: number;
      reason: string;
      endsAt: string;
      status: string;
    }>,
  ): Promise<GobiernoSubasta | null> {
    const set: Record<string, unknown> = { ...data };
    if (data.endsAt) set.endsAt = new Date(data.endsAt);
    if (Object.keys(set).length > 0) {
      await this.db
        .update(gobiernoSubastas)
        .set(set)
        .where(eq(gobiernoSubastas.id, id));
    }
    return this.findSubasta(id);
  }

  async deleteSubasta(id: number): Promise<boolean> {
    const result = await this.db
      .delete(gobiernoSubastas)
      .where(eq(gobiernoSubastas.id, id));
    return result[0].affectedRows > 0;
  }

  async placeBid(
    id: number,
    uuid: string,
    amount: number,
  ): Promise<GobiernoSubasta> {
    await this.db.insert(gobiernoPujas).values({ subastaId: id, uuid, amount });
    await this.db
      .update(gobiernoSubastas)
      .set({
        currentBid: amount,
        bidderUuid: uuid,
        bids: sql`${gobiernoSubastas.bids} + 1`,
      })
      .where(eq(gobiernoSubastas.id, id));
    return (await this.findSubasta(id)) as GobiernoSubasta;
  }

  async listPujas(subastaId: number) {
    return this.db
      .select()
      .from(gobiernoPujas)
      .where(eq(gobiernoPujas.subastaId, subastaId))
      .orderBy(desc(gobiernoPujas.createdAt));
  }

  async closeSubasta(
    id: number,
    settledTxId: number | null,
  ): Promise<GobiernoSubasta> {
    await this.db
      .update(gobiernoSubastas)
      .set({ status: 'closed', settledTxId })
      .where(eq(gobiernoSubastas.id, id));
    return (await this.findSubasta(id)) as GobiernoSubasta;
  }
}
