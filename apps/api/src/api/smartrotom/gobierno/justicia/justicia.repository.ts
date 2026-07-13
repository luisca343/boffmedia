import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, desc, eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  gobiernoExpedientes,
  gobiernoExpedienteEventos,
  gobiernoApelaciones,
  GobiernoExpediente,
  GobiernoApelacion,
} from '@/_db/schema/SmartRotomGobierno';
import { generateGobCode } from '../_shared/code.util';
import { CreateExpedienteDto, CreateApelacionDto } from './dto/justicia.dto';

@Injectable()
export class JusticiaRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== EXPEDIENTES ====================

  async listExpedientes(
    page: number,
    limit: number,
    filters: { status?: string; severity?: string; dep?: string },
  ) {
    const conditions = [
      filters.status
        ? eq(gobiernoExpedientes.status, filters.status)
        : undefined,
      filters.severity
        ? eq(gobiernoExpedientes.severity, filters.severity)
        : undefined,
      filters.dep ? eq(gobiernoExpedientes.dep, filters.dep) : undefined,
    ].filter((c) => c !== undefined);
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalRows] = await Promise.all([
      this.db
        .select()
        .from(gobiernoExpedientes)
        .where(where)
        .orderBy(desc(gobiernoExpedientes.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      this.db
        .select({ total: sql<number>`count(*)` })
        .from(gobiernoExpedientes)
        .where(where),
    ]);
    return { items, total: Number(totalRows[0]?.total ?? 0) };
  }

  async findExpediente(id: number): Promise<GobiernoExpediente | null> {
    const rows = await this.db
      .select()
      .from(gobiernoExpedientes)
      .where(eq(gobiernoExpedientes.id, id));
    return rows[0] ?? null;
  }

  async createExpediente(
    data: CreateExpedienteDto,
  ): Promise<GobiernoExpediente> {
    const code = generateGobCode('EXP');
    const result = await this.db.insert(gobiernoExpedientes).values({
      code,
      title: data.title,
      subjectUuid: data.subjectUuid,
      dep: data.dep ?? 'justicia',
      severity: data.severity ?? 'medium',
      leadUuid: data.leadUuid,
    });
    return (await this.findExpediente(
      result[0].insertId,
    )) as GobiernoExpediente;
  }

  async updateExpediente(
    id: number,
    data: Partial<{
      title: string;
      dep: string;
      severity: string;
      leadUuid: string;
      status: string;
    }>,
  ): Promise<GobiernoExpediente | null> {
    const set: Record<string, unknown> = { ...data };
    if (data.status === 'closed') set.closedAt = new Date();
    if (data.status === 'open') set.closedAt = null;
    if (Object.keys(set).length > 0) {
      await this.db
        .update(gobiernoExpedientes)
        .set(set)
        .where(eq(gobiernoExpedientes.id, id));
    }
    return this.findExpediente(id);
  }

  async deleteExpediente(id: number): Promise<boolean> {
    const result = await this.db
      .delete(gobiernoExpedientes)
      .where(eq(gobiernoExpedientes.id, id));
    return result[0].affectedRows > 0;
  }

  async listTimeline(expedienteId: number, page: number, limit: number) {
    const where = eq(gobiernoExpedienteEventos.expedienteId, expedienteId);
    const [items, totalRows] = await Promise.all([
      this.db
        .select()
        .from(gobiernoExpedienteEventos)
        .where(where)
        .orderBy(desc(gobiernoExpedienteEventos.at))
        .limit(limit)
        .offset((page - 1) * limit),
      this.db
        .select({ total: sql<number>`count(*)` })
        .from(gobiernoExpedienteEventos)
        .where(where),
    ]);
    return { items, total: Number(totalRows[0]?.total ?? 0) };
  }

  async appendTimeline(
    expedienteId: number,
    data: { kind: string; ref?: string; text: string },
  ) {
    await this.db.insert(gobiernoExpedienteEventos).values({
      expedienteId,
      kind: data.kind,
      ref: data.ref,
      text: data.text,
    });
  }

  // ==================== APELACIONES ====================

  async listApelaciones(
    page: number,
    limit: number,
    filters: { status?: string },
  ) {
    const where = filters.status
      ? eq(gobiernoApelaciones.status, filters.status)
      : undefined;
    const [items, totalRows] = await Promise.all([
      this.db
        .select()
        .from(gobiernoApelaciones)
        .where(where)
        .orderBy(desc(gobiernoApelaciones.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      this.db
        .select({ total: sql<number>`count(*)` })
        .from(gobiernoApelaciones)
        .where(where),
    ]);
    return { items, total: Number(totalRows[0]?.total ?? 0) };
  }

  async findApelacion(id: number): Promise<GobiernoApelacion | null> {
    const rows = await this.db
      .select()
      .from(gobiernoApelaciones)
      .where(eq(gobiernoApelaciones.id, id));
    return rows[0] ?? null;
  }

  async createApelacion(data: CreateApelacionDto): Promise<GobiernoApelacion> {
    const code = generateGobCode('APE');
    const result = await this.db.insert(gobiernoApelaciones).values({
      code,
      multaId: data.multaId,
      playerUuid: data.playerUuid,
      grounds: data.grounds,
    });
    return (await this.findApelacion(result[0].insertId)) as GobiernoApelacion;
  }

  async updateApelacion(
    id: number,
    data: Partial<{ grounds: string; status: string }>,
  ): Promise<GobiernoApelacion | null> {
    if (Object.keys(data).length > 0) {
      await this.db
        .update(gobiernoApelaciones)
        .set(data)
        .where(eq(gobiernoApelaciones.id, id));
    }
    return this.findApelacion(id);
  }

  async deleteApelacion(id: number): Promise<boolean> {
    const result = await this.db
      .delete(gobiernoApelaciones)
      .where(eq(gobiernoApelaciones.id, id));
    return result[0].affectedRows > 0;
  }

  async resolveApelacion(
    id: number,
    outcome: 'upheld' | 'overturned',
    decision: string,
    reviewerUuid: string,
    refundTxId: number | null,
  ): Promise<GobiernoApelacion> {
    await this.db
      .update(gobiernoApelaciones)
      .set({
        status: outcome,
        decision,
        reviewerUuid,
        resolvedAt: new Date(),
        refundTxId,
      })
      .where(eq(gobiernoApelaciones.id, id));
    return (await this.findApelacion(id)) as GobiernoApelacion;
  }
}
