import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActorContext, assertActsAsSelf } from '@api/_utils/auth/actor';
import { Logger } from 'nestjs-pino';
import { PeopleRepository } from '../_shared/people.repository';
import { AuditoriaService } from '../_shared/auditoria.service';
import { toPersonRef } from '../_shared/entities/person-ref.entity';
import { EventosRepository } from './eventos.repository';
import {
  CreateEventoDto,
  UpdateEventoDto,
  ListEventosQueryDto,
  CreateObraDto,
  UpdateObraDto,
  VoteObraDto,
  CreateEspecieDto,
  UpdateEspecieDto,
  RegisterCapturaDto,
} from './dto/eventos.dto';
import {
  GobiernoEventoEntity,
  GobiernoEventoObraEntity,
  GobiernoEventoObraListEntity,
  GobiernoEventoEspecieEntity,
  GobiernoEventoEspecieListEntity,
  GobiernoEventoCapturaEntity,
  GobiernoEventoCapturasResponseEntity,
} from './entities/eventos.entity';

@Injectable()
export class EventosService {
  constructor(
    private readonly logger: Logger,
    private readonly eventosRepository: EventosRepository,
    private readonly peopleRepository: PeopleRepository,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  // ==================== EVENTOS ====================

  private async toEventoEntity(
    e: NonNullable<Awaited<ReturnType<EventosRepository['findEvento']>>>,
    names: Map<string, string>,
  ): Promise<GobiernoEventoEntity> {
    return {
      ...e,
      weights: e.weights as GobiernoEventoEntity['weights'],
      createdBy: toPersonRef(e.createdByUuid, names) as any,
    };
  }

  async listEventos(
    query: ListEventosQueryDto,
  ): Promise<GobiernoEventoEntity[]> {
    const rows = await this.eventosRepository.listEventos(query);
    const names = await this.peopleRepository.findUsernames(
      rows.map((e) => e.createdByUuid),
    );
    return Promise.all(rows.map((e) => this.toEventoEntity(e, names)));
  }

  async getEvento(id: number): Promise<GobiernoEventoEntity> {
    const e = await this.eventosRepository.findEvento(id);
    if (!e) throw new NotFoundException(`Evento ${id} not found`);
    const names = await this.peopleRepository.findUsernames([e.createdByUuid]);
    return this.toEventoEntity(e, names);
  }

  async createEvento(dto: CreateEventoDto): Promise<GobiernoEventoEntity> {
    const e = await this.eventosRepository.createEvento(dto);
    await this.auditoriaService.log({
      actorUuid: dto.createdBy,
      action: 'create',
      target: `evento ${e.code} (${e.type})`,
      dep: 'eventos',
    });
    return this.getEvento(e.id);
  }

  async updateEvento(
    id: number,
    dto: UpdateEventoDto,
  ): Promise<GobiernoEventoEntity> {
    const existing = await this.eventosRepository.findEvento(id);
    if (!existing) throw new NotFoundException(`Evento ${id} not found`);
    await this.eventosRepository.updateEvento(id, {
      title: dto.title,
      brief: dto.brief,
      prize: dto.prize,
      crew: dto.crew,
      buildClosedAt: dto.buildClosedAt,
      ratingOpensAt: dto.ratingOpensAt,
      ratingClosesAt: dto.ratingClosesAt,
      winnerTown: dto.winnerTown,
      zone: dto.zone,
      coordsX: dto.coordsX,
      coordsZ: dto.coordsZ,
      radius: dto.radius,
      opensAt: dto.opensAt,
      closesAt: dto.closesAt,
      rules: dto.rules,
      weights: dto.weights,
      status: dto.status,
    });
    await this.auditoriaService.log({
      actorUuid: existing.createdByUuid,
      action: 'update',
      target: `evento ${existing.code}`,
      dep: 'eventos',
    });
    return this.getEvento(id);
  }

  async deleteEvento(
    id: number,
    actorUuid?: string,
  ): Promise<{ success: boolean }> {
    const existing = await this.eventosRepository.findEvento(id);
    if (!existing) throw new NotFoundException(`Evento ${id} not found`);
    await this.eventosRepository.deleteEvento(id);
    await this.auditoriaService.log({
      actorUuid: actorUuid || existing.createdByUuid,
      action: 'delete',
      target: `evento ${existing.code}`,
      dep: 'eventos',
    });
    return { success: true };
  }

  // ==================== OBRAS ====================

  private async toObraEntity(
    o: NonNullable<Awaited<ReturnType<EventosRepository['findObra']>>>,
    names: Map<string, string>,
    aggregate?: {
      diseno: number;
      ambicion: number;
      fidelidad: number;
      votes: number;
    },
  ): Promise<GobiernoEventoObraEntity> {
    const builders = ((o.builders as string[] | null) ?? []).map(
      (uuid) => toPersonRef(uuid, names) as any,
    );
    return {
      id: o.id,
      eventoId: o.eventoId,
      town: o.town,
      buildName: o.buildName,
      description: o.description,
      builders,
      createdAt: o.createdAt,
      diseno: aggregate ? Math.round(aggregate.diseno * 10) / 10 : 0,
      ambicion: aggregate ? Math.round(aggregate.ambicion * 10) / 10 : 0,
      fidelidad: aggregate ? Math.round(aggregate.fidelidad * 10) / 10 : 0,
      votes: aggregate?.votes ?? 0,
    };
  }

  async listObras(
    eventoId: number,
    page: number,
    limit: number,
  ): Promise<GobiernoEventoObraListEntity> {
    const { items, total } = await this.eventosRepository.listObras(
      eventoId,
      page,
      limit,
    );
    const aggregates = await this.eventosRepository.getVoteAggregates(
      items.map((o) => o.id),
    );
    const names = await this.peopleRepository.findUsernames(
      items.flatMap((o) => (o.builders as string[] | null) ?? []),
    );
    return {
      items: await Promise.all(
        items.map((o) => this.toObraEntity(o, names, aggregates.get(o.id))),
      ),
      total,
      page,
      pageSize: limit,
    };
  }

  async getObra(id: number): Promise<GobiernoEventoObraEntity> {
    const o = await this.eventosRepository.findObra(id);
    if (!o) throw new NotFoundException(`Obra ${id} not found`);
    const aggregates = await this.eventosRepository.getVoteAggregates([id]);
    const names = await this.peopleRepository.findUsernames(
      (o.builders as string[] | null) ?? [],
    );
    return this.toObraEntity(o, names, aggregates.get(id));
  }

  async createObra(
    eventoId: number,
    dto: CreateObraDto,
  ): Promise<GobiernoEventoObraEntity> {
    const evento = await this.eventosRepository.findEvento(eventoId);
    if (!evento) throw new NotFoundException(`Evento ${eventoId} not found`);
    if (evento.type !== 'construccion') {
      throw new BadRequestException(
        `Evento ${evento.code} is not a construcción event`,
      );
    }

    const o = await this.eventosRepository.createObra(eventoId, dto);
    await this.auditoriaService.log({
      actorUuid: dto.actorUuid || evento.createdByUuid,
      action: 'create',
      target: `obra "${o.buildName}" (evento ${evento.code})`,
      dep: 'eventos',
    });
    return this.getObra(o.id);
  }

  async updateObra(
    id: number,
    dto: UpdateObraDto,
  ): Promise<GobiernoEventoObraEntity> {
    const existing = await this.eventosRepository.findObra(id);
    if (!existing) throw new NotFoundException(`Obra ${id} not found`);
    await this.eventosRepository.updateObra(id, {
      town: dto.town,
      buildName: dto.buildName,
      description: dto.description,
      builders: dto.builders,
    });
    await this.auditoriaService.log({
      actorUuid: dto.actorUuid || 'system',
      action: 'update',
      target: `obra "${existing.buildName}"`,
      dep: 'eventos',
    });
    return this.getObra(id);
  }

  async deleteObra(
    id: number,
    actorUuid?: string,
  ): Promise<{ success: boolean }> {
    const existing = await this.eventosRepository.findObra(id);
    if (!existing) throw new NotFoundException(`Obra ${id} not found`);
    await this.eventosRepository.deleteObra(id);
    await this.auditoriaService.log({
      actorUuid: actorUuid || 'system',
      action: 'delete',
      target: `obra "${existing.buildName}"`,
      dep: 'eventos',
    });
    return { success: true };
  }

  async voteObra(
    id: number,
    dto: VoteObraDto,
    actor?: ActorContext,
  ): Promise<GobiernoEventoObraEntity> {
    assertActsAsSelf(dto.voterUuid, actor);
    const existing = await this.eventosRepository.findObra(id);
    if (!existing) throw new NotFoundException(`Obra ${id} not found`);
    await this.eventosRepository.voteObra(
      id,
      dto.voterUuid,
      dto.diseno,
      dto.ambicion,
      dto.fidelidad,
    );
    await this.auditoriaService.log({
      actorUuid: dto.voterUuid,
      action: 'update',
      target: `voto en obra "${existing.buildName}"`,
      dep: 'eventos',
    });
    return this.getObra(id);
  }

  // ==================== ESPECIES ====================

  private toEspecieEntity(e: {
    id: number;
    eventoId: number;
    name: string;
    rarity: string;
    rarityPts: number;
    spawnPct: string;
    shinyPct: string;
    lvlMin: number;
    lvlMax: number;
  }): GobiernoEventoEspecieEntity {
    return {
      id: e.id,
      eventoId: e.eventoId,
      name: e.name,
      rarity: e.rarity,
      rarityPts: e.rarityPts,
      spawnPct: Number(e.spawnPct),
      shinyPct: Number(e.shinyPct),
      lvlMin: e.lvlMin,
      lvlMax: e.lvlMax,
    };
  }

  async listEspecies(
    eventoId: number,
    page: number,
    limit: number,
  ): Promise<GobiernoEventoEspecieListEntity> {
    const { items, total } = await this.eventosRepository.listEspecies(
      eventoId,
      page,
      limit,
    );
    return {
      items: items.map((e) => this.toEspecieEntity(e)),
      total,
      page,
      pageSize: limit,
    };
  }

  async createEspecie(
    eventoId: number,
    dto: CreateEspecieDto,
  ): Promise<GobiernoEventoEspecieEntity> {
    const evento = await this.eventosRepository.findEvento(eventoId);
    if (!evento) throw new NotFoundException(`Evento ${eventoId} not found`);
    if (evento.type !== 'caza') {
      throw new BadRequestException(
        `Evento ${evento.code} is not a caza event`,
      );
    }

    const e = await this.eventosRepository.createEspecie(eventoId, dto);
    await this.auditoriaService.log({
      actorUuid: dto.actorUuid || evento.createdByUuid,
      action: 'create',
      target: `especie "${e.name}" (evento ${evento.code})`,
      dep: 'eventos',
    });
    return this.toEspecieEntity(e);
  }

  async updateEspecie(
    id: number,
    dto: UpdateEspecieDto,
  ): Promise<GobiernoEventoEspecieEntity> {
    const existing = await this.eventosRepository.findEspecie(id);
    if (!existing) throw new NotFoundException(`Especie ${id} not found`);
    const e = await this.eventosRepository.updateEspecie(id, {
      name: dto.name,
      rarity: dto.rarity,
      rarityPts: dto.rarityPts,
      spawnPct: dto.spawnPct === undefined ? undefined : String(dto.spawnPct),
      shinyPct: dto.shinyPct === undefined ? undefined : String(dto.shinyPct),
      lvlMin: dto.lvlMin,
      lvlMax: dto.lvlMax,
    });
    await this.auditoriaService.log({
      actorUuid: dto.actorUuid || 'system',
      action: 'update',
      target: `especie "${existing.name}"`,
      dep: 'eventos',
    });
    return this.toEspecieEntity(e as NonNullable<typeof e>);
  }

  async deleteEspecie(
    id: number,
    actorUuid?: string,
  ): Promise<{ success: boolean }> {
    const existing = await this.eventosRepository.findEspecie(id);
    if (!existing) throw new NotFoundException(`Especie ${id} not found`);
    await this.eventosRepository.deleteEspecie(id);
    await this.auditoriaService.log({
      actorUuid: actorUuid || 'system',
      action: 'delete',
      target: `especie "${existing.name}"`,
      dep: 'eventos',
    });
    return { success: true };
  }

  // ==================== CAPTURAS ====================

  private async toCapturaEntity(
    c: NonNullable<Awaited<ReturnType<EventosRepository['findCaptura']>>>,
    names: Map<string, string>,
  ): Promise<GobiernoEventoCapturaEntity> {
    return {
      id: c.id,
      eventoId: c.eventoId,
      player: toPersonRef(c.uuid, names) as any,
      species: c.species,
      level: c.level,
      ivsTotal: c.ivsTotal,
      shiny: c.shiny === 1,
      size: c.size === null ? null : Number(c.size),
      score: c.score,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  // The public scoring weights {tamano, ivs, shiny, nivel, especie} are coefficients: a
  // weighted sum over species rarity, size, IVs, level and a flat shiny bonus. Only the key
  // names are fixed externally, so the curve below is this codebase's own interpretation —
  // change it here and every event rescores.
  private computeScore(
    dto: RegisterCapturaDto,
    weights: Record<string, number> | null,
    rarityPts: number,
  ): number {
    const w = weights ?? {};
    const score =
      rarityPts * (w.especie ?? 1) +
      dto.level * (w.nivel ?? 1) +
      dto.ivsTotal * (w.ivs ?? 1) +
      (dto.size ?? 0) * (w.tamano ?? 1) +
      (dto.shiny ? (w.shiny ?? 0) : 0);
    return Math.round(score);
  }

  async registerCaptura(
    eventoId: number,
    dto: RegisterCapturaDto,
    actor?: ActorContext,
  ): Promise<GobiernoEventoCapturaEntity> {
    assertActsAsSelf(dto.uuid, actor);
    const evento = await this.eventosRepository.findEvento(eventoId);
    if (!evento) throw new NotFoundException(`Evento ${eventoId} not found`);
    if (evento.type !== 'caza') {
      throw new BadRequestException(
        `Evento ${evento.code} is not a caza event`,
      );
    }
    if (evento.status !== 'live') {
      throw new BadRequestException(`Evento ${evento.code} is not live`);
    }

    const especies =
      await this.eventosRepository.findEspeciesByEvento(eventoId);
    const especie = especies.find(
      (e) => e.name.toLowerCase() === dto.species.toLowerCase(),
    );
    const rarityPts = especie?.rarityPts ?? 0;
    const score = this.computeScore(
      dto,
      evento.weights as Record<string, number> | null,
      rarityPts,
    );

    const c = await this.eventosRepository.upsertCaptura(eventoId, dto.uuid, {
      species: dto.species,
      level: dto.level,
      ivsTotal: dto.ivsTotal,
      shiny: dto.shiny ? 1 : 0,
      size: dto.size === undefined ? undefined : String(dto.size),
      score,
    });

    await this.auditoriaService.log({
      actorUuid: dto.uuid,
      action: 'update',
      target: `captura en evento ${evento.code}`,
      dep: 'eventos',
      source: 'actividad',
    });

    const names = await this.peopleRepository.findUsernames([c.uuid]);
    return this.toCapturaEntity(c, names);
  }

  async getOwnCaptura(
    eventoId: number,
    uuid: string,
  ): Promise<GobiernoEventoCapturaEntity | null> {
    const c = await this.eventosRepository.findCaptura(eventoId, uuid);
    if (!c) return null;
    const names = await this.peopleRepository.findUsernames([c.uuid]);
    return this.toCapturaEntity(c, names);
  }

  async listCapturas(
    eventoId: number,
    page: number,
    limit: number,
  ): Promise<GobiernoEventoCapturasResponseEntity> {
    const evento = await this.eventosRepository.findEvento(eventoId);
    if (!evento) throw new NotFoundException(`Evento ${eventoId} not found`);

    if (evento.status !== 'closed') {
      const count = await this.eventosRepository.countCapturas(eventoId);
      return { blind: true, participants: count, capturasRegistradas: count };
    }

    const { items, total } = await this.eventosRepository.listCapturas(
      eventoId,
      page,
      limit,
    );
    const names = await this.peopleRepository.findUsernames(
      items.map((c) => c.uuid),
    );
    return {
      blind: false,
      items: await Promise.all(
        items.map((c) => this.toCapturaEntity(c, names)),
      ),
      total,
      page,
      pageSize: limit,
    };
  }
}
