import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  gobiernoEventos,
  gobiernoEventoObras,
  gobiernoEventoVotos,
  gobiernoEventoEspecies,
  gobiernoEventoCapturas,
  GobiernoEvento,
  GobiernoEventoObra,
  GobiernoEventoEspecie,
  GobiernoEventoCaptura,
} from '@/_db/schema/SmartRotomGobierno';
import { generateGobCode } from '../_shared/code.util';
import {
  CreateEventoDto,
  CreateObraDto,
  CreateEspecieDto,
} from './dto/eventos.dto';

export interface VoteAggregate {
  diseno: number;
  ambicion: number;
  fidelidad: number;
  votes: number;
}

@Injectable()
export class EventosRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== EVENTOS ====================

  async listEventos(filters: {
    type?: string;
    status?: string;
  }): Promise<GobiernoEvento[]> {
    const conditions = [
      filters.type ? eq(gobiernoEventos.type, filters.type) : undefined,
      filters.status ? eq(gobiernoEventos.status, filters.status) : undefined,
    ].filter((c) => c !== undefined);
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    return this.db
      .select()
      .from(gobiernoEventos)
      .where(where)
      .orderBy(desc(gobiernoEventos.createdAt));
  }

  async findEvento(id: number): Promise<GobiernoEvento | null> {
    const rows = await this.db
      .select()
      .from(gobiernoEventos)
      .where(eq(gobiernoEventos.id, id));
    return rows[0] ?? null;
  }

  async createEvento(data: CreateEventoDto): Promise<GobiernoEvento> {
    const code = generateGobCode('EVT');
    const result = await this.db.insert(gobiernoEventos).values({
      code,
      type: data.type,
      title: data.title,
      brief: data.brief,
      prize: data.prize,
      crew: data.crew,
      buildClosedAt: data.buildClosedAt
        ? new Date(data.buildClosedAt)
        : undefined,
      ratingOpensAt: data.ratingOpensAt
        ? new Date(data.ratingOpensAt)
        : undefined,
      ratingClosesAt: data.ratingClosesAt
        ? new Date(data.ratingClosesAt)
        : undefined,
      zone: data.zone,
      coordsX: data.coordsX,
      coordsZ: data.coordsZ,
      radius: data.radius,
      opensAt: data.opensAt ? new Date(data.opensAt) : undefined,
      closesAt: data.closesAt ? new Date(data.closesAt) : undefined,
      rules: data.rules,
      weights: data.weights,
      createdBy: data.createdBy,
    });
    return (await this.findEvento(result[0].insertId)) as GobiernoEvento;
  }

  async updateEvento(
    id: number,
    data: Partial<{
      title: string;
      brief: string;
      prize: string;
      crew: string;
      buildClosedAt: string;
      ratingOpensAt: string;
      ratingClosesAt: string;
      winnerTown: string;
      zone: string;
      coordsX: number;
      coordsZ: number;
      radius: number;
      opensAt: string;
      closesAt: string;
      rules: string;
      weights: unknown;
      status: string;
    }>,
  ): Promise<GobiernoEvento | null> {
    const set: Record<string, unknown> = { ...data };
    for (const dateField of [
      'buildClosedAt',
      'ratingOpensAt',
      'ratingClosesAt',
      'opensAt',
      'closesAt',
    ]) {
      if (typeof set[dateField] === 'string')
        set[dateField] = new Date(set[dateField] as string);
    }
    if (Object.keys(set).length > 0) {
      await this.db
        .update(gobiernoEventos)
        .set(set)
        .where(eq(gobiernoEventos.id, id));
    }
    return this.findEvento(id);
  }

  async deleteEvento(id: number): Promise<boolean> {
    const result = await this.db
      .delete(gobiernoEventos)
      .where(eq(gobiernoEventos.id, id));
    return result[0].affectedRows > 0;
  }

  // ==================== OBRAS ====================

  async listObras(eventoId: number, page: number, limit: number) {
    const where = eq(gobiernoEventoObras.eventoId, eventoId);
    const [items, totalRows] = await Promise.all([
      this.db
        .select()
        .from(gobiernoEventoObras)
        .where(where)
        .orderBy(desc(gobiernoEventoObras.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      this.db
        .select({ total: sql<number>`count(*)` })
        .from(gobiernoEventoObras)
        .where(where),
    ]);
    return { items, total: Number(totalRows[0]?.total ?? 0) };
  }

  async findObra(id: number): Promise<GobiernoEventoObra | null> {
    const rows = await this.db
      .select()
      .from(gobiernoEventoObras)
      .where(eq(gobiernoEventoObras.id, id));
    return rows[0] ?? null;
  }

  async createObra(
    eventoId: number,
    data: CreateObraDto,
  ): Promise<GobiernoEventoObra> {
    const result = await this.db.insert(gobiernoEventoObras).values({
      eventoId,
      town: data.town,
      buildName: data.buildName,
      description: data.description,
      builders: data.builders,
    });
    return (await this.findObra(result[0].insertId)) as GobiernoEventoObra;
  }

  async updateObra(
    id: number,
    data: Partial<{
      town: string;
      buildName: string;
      description: string;
      builders: string[];
    }>,
  ): Promise<GobiernoEventoObra | null> {
    if (Object.keys(data).length > 0) {
      await this.db
        .update(gobiernoEventoObras)
        .set(data)
        .where(eq(gobiernoEventoObras.id, id));
    }
    return this.findObra(id);
  }

  async deleteObra(id: number): Promise<boolean> {
    const result = await this.db
      .delete(gobiernoEventoObras)
      .where(eq(gobiernoEventoObras.id, id));
    return result[0].affectedRows > 0;
  }

  async voteObra(
    obraId: number,
    voterUuid: string,
    diseno: number,
    ambicion: number,
    fidelidad: number,
  ): Promise<void> {
    await this.db
      .insert(gobiernoEventoVotos)
      .values({ obraId, voterUuid, diseno, ambicion, fidelidad })
      .onDuplicateKeyUpdate({ set: { diseno, ambicion, fidelidad } });
  }

  async getVoteAggregates(
    obraIds: number[],
  ): Promise<Map<number, VoteAggregate>> {
    if (obraIds.length === 0) return new Map();
    const rows = await this.db
      .select({
        obraId: gobiernoEventoVotos.obraId,
        diseno: sql<number>`avg(${gobiernoEventoVotos.diseno})`,
        ambicion: sql<number>`avg(${gobiernoEventoVotos.ambicion})`,
        fidelidad: sql<number>`avg(${gobiernoEventoVotos.fidelidad})`,
        votes: sql<number>`count(*)`,
      })
      .from(gobiernoEventoVotos)
      .where(inArray(gobiernoEventoVotos.obraId, obraIds))
      .groupBy(gobiernoEventoVotos.obraId);

    return new Map(
      rows.map((r) => [
        r.obraId,
        {
          diseno: Number(r.diseno),
          ambicion: Number(r.ambicion),
          fidelidad: Number(r.fidelidad),
          votes: Number(r.votes),
        },
      ]),
    );
  }

  // ==================== ESPECIES ====================

  async listEspecies(eventoId: number, page: number, limit: number) {
    const where = eq(gobiernoEventoEspecies.eventoId, eventoId);
    const [items, totalRows] = await Promise.all([
      this.db
        .select()
        .from(gobiernoEventoEspecies)
        .where(where)
        .orderBy(gobiernoEventoEspecies.name)
        .limit(limit)
        .offset((page - 1) * limit),
      this.db
        .select({ total: sql<number>`count(*)` })
        .from(gobiernoEventoEspecies)
        .where(where),
    ]);
    return { items, total: Number(totalRows[0]?.total ?? 0) };
  }

  async findEspecie(id: number): Promise<GobiernoEventoEspecie | null> {
    const rows = await this.db
      .select()
      .from(gobiernoEventoEspecies)
      .where(eq(gobiernoEventoEspecies.id, id));
    return rows[0] ?? null;
  }

  async findEspeciesByEvento(
    eventoId: number,
  ): Promise<GobiernoEventoEspecie[]> {
    return this.db
      .select()
      .from(gobiernoEventoEspecies)
      .where(eq(gobiernoEventoEspecies.eventoId, eventoId));
  }

  async createEspecie(
    eventoId: number,
    data: CreateEspecieDto,
  ): Promise<GobiernoEventoEspecie> {
    const result = await this.db.insert(gobiernoEventoEspecies).values({
      eventoId,
      name: data.name,
      rarity: data.rarity,
      rarityPts: data.rarityPts ?? 0,
      spawnPct: String(data.spawnPct ?? 0),
      shinyPct: String(data.shinyPct ?? 0),
      lvlMin: data.lvlMin ?? 1,
      lvlMax: data.lvlMax ?? 100,
    });
    return (await this.findEspecie(
      result[0].insertId,
    )) as GobiernoEventoEspecie;
  }

  async updateEspecie(
    id: number,
    data: Partial<{
      name: string;
      rarity: string;
      rarityPts: number;
      spawnPct: string;
      shinyPct: string;
      lvlMin: number;
      lvlMax: number;
    }>,
  ): Promise<GobiernoEventoEspecie | null> {
    if (Object.keys(data).length > 0) {
      await this.db
        .update(gobiernoEventoEspecies)
        .set(data)
        .where(eq(gobiernoEventoEspecies.id, id));
    }
    return this.findEspecie(id);
  }

  async deleteEspecie(id: number): Promise<boolean> {
    const result = await this.db
      .delete(gobiernoEventoEspecies)
      .where(eq(gobiernoEventoEspecies.id, id));
    return result[0].affectedRows > 0;
  }

  // ==================== CAPTURAS ====================

  async upsertCaptura(
    eventoId: number,
    uuid: string,
    data: {
      species: string;
      level: number;
      ivsTotal: number;
      shiny: number;
      size?: string;
      score: number;
    },
  ): Promise<GobiernoEventoCaptura> {
    await this.db
      .insert(gobiernoEventoCapturas)
      .values({
        eventoId,
        uuid,
        species: data.species,
        level: data.level,
        ivsTotal: data.ivsTotal,
        shiny: data.shiny,
        size: data.size,
        score: data.score,
      })
      .onDuplicateKeyUpdate({
        set: {
          species: data.species,
          level: data.level,
          ivsTotal: data.ivsTotal,
          shiny: data.shiny,
          size: data.size,
          score: data.score,
        },
      });
    return (await this.findCaptura(eventoId, uuid)) as GobiernoEventoCaptura;
  }

  async findCaptura(
    eventoId: number,
    uuid: string,
  ): Promise<GobiernoEventoCaptura | null> {
    const rows = await this.db
      .select()
      .from(gobiernoEventoCapturas)
      .where(
        and(
          eq(gobiernoEventoCapturas.eventoId, eventoId),
          eq(gobiernoEventoCapturas.uuid, uuid),
        ),
      );
    return rows[0] ?? null;
  }

  async countCapturas(eventoId: number): Promise<number> {
    const rows = await this.db
      .select({ total: sql<number>`count(*)` })
      .from(gobiernoEventoCapturas)
      .where(eq(gobiernoEventoCapturas.eventoId, eventoId));
    return Number(rows[0]?.total ?? 0);
  }

  async listCapturas(eventoId: number, page: number, limit: number) {
    const where = eq(gobiernoEventoCapturas.eventoId, eventoId);
    const [items, totalRows] = await Promise.all([
      this.db
        .select()
        .from(gobiernoEventoCapturas)
        .where(where)
        .orderBy(desc(gobiernoEventoCapturas.score))
        .limit(limit)
        .offset((page - 1) * limit),
      this.db
        .select({ total: sql<number>`count(*)` })
        .from(gobiernoEventoCapturas)
        .where(where),
    ]);
    return { items, total: Number(totalRows[0]?.total ?? 0) };
  }
}
