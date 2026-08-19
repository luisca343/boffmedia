import { Injectable, NotFoundException } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { PeopleRepository } from '../_shared/people.repository';
import { AuditoriaService } from '../_shared/auditoria.service';
import { CountersService } from '../_shared/counters.service';
import { toPersonRef } from '../_shared/entities/person-ref.entity';
import { ListAuditoriaQueryDto } from '../_shared/dto/list-auditoria-query.dto';
import { GobiernoAuditoriaListEntity } from '../_shared/entities/auditoria.entity';
import { GobiernoCountersEntity } from '../_shared/entities/counters.entity';
import { resolvePageSize } from '../_shared/dto/paged-query.dto';
import { GeneralRepository } from './general.repository';
import {
  CreateAnuncioDto,
  UpdateAnuncioDto,
  ListAnunciosQueryDto,
} from './dto/anuncios.dto';
import {
  GobiernoAnuncioEntity,
  GobiernoAnuncioListEntity,
} from './entities/anuncio.entity';

@Injectable()
export class GeneralService {
  constructor(
    private readonly logger: Logger,
    private readonly generalRepository: GeneralRepository,
    private readonly peopleRepository: PeopleRepository,
    private readonly auditoriaService: AuditoriaService,
    private readonly countersService: CountersService,
  ) {}

  // ==================== ANUNCIOS ====================

  private async toAnuncioEntity(
    a: NonNullable<Awaited<ReturnType<GeneralRepository['findAnuncio']>>>,
    names: Map<string, string>,
  ): Promise<GobiernoAnuncioEntity> {
    return {
      id: a.id,
      kind: a.kind,
      title: a.title,
      body: a.body,
      town: a.town,
      author: toPersonRef(a.authorUuid, names) as any,
      pinned: a.pinned,
      audience: a.audience,
      publishedAt: a.publishedAt,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  }

  async listAnuncios(
    query: ListAnunciosQueryDto,
  ): Promise<GobiernoAnuncioListEntity> {
    const page = query.page ?? 1;
    const limit = resolvePageSize(query);
    const { items, total } = await this.generalRepository.listAnuncios(
      page,
      limit,
      query,
    );
    const names = await this.peopleRepository.findUsernames(
      items.map((a) => a.authorUuid),
    );
    return {
      items: await Promise.all(
        items.map((a) => this.toAnuncioEntity(a, names)),
      ),
      total,
      page,
      pageSize: limit,
    };
  }

  async getAnuncio(id: number): Promise<GobiernoAnuncioEntity> {
    const a = await this.generalRepository.findAnuncio(id);
    if (!a) throw new NotFoundException(`Anuncio ${id} not found`);
    const names = await this.peopleRepository.findUsernames([a.authorUuid]);
    return this.toAnuncioEntity(a, names);
  }

  async createAnuncio(dto: CreateAnuncioDto): Promise<GobiernoAnuncioEntity> {
    const a = await this.generalRepository.createAnuncio(dto);
    await this.auditoriaService.log({
      actorUuid: dto.authorUuid,
      action: 'create',
      target: `anuncio "${a.title}"`,
      dep: 'gobierno',
    });
    return this.getAnuncio(a.id);
  }

  async updateAnuncio(
    id: number,
    dto: UpdateAnuncioDto,
  ): Promise<GobiernoAnuncioEntity> {
    const existing = await this.generalRepository.findAnuncio(id);
    if (!existing) throw new NotFoundException(`Anuncio ${id} not found`);
    await this.generalRepository.updateAnuncio(id, {
      kind: dto.kind,
      title: dto.title,
      body: dto.body,
      town: dto.town,
      pinned: dto.pinned,
      audience: dto.audience,
    });
    await this.auditoriaService.log({
      actorUuid: existing.authorUuid,
      action: 'update',
      target: `anuncio "${existing.title}"`,
      dep: 'gobierno',
    });
    return this.getAnuncio(id);
  }

  async deleteAnuncio(
    id: number,
    actorUuid?: string,
  ): Promise<{ success: boolean }> {
    const existing = await this.generalRepository.findAnuncio(id);
    if (!existing) throw new NotFoundException(`Anuncio ${id} not found`);
    await this.generalRepository.deleteAnuncio(id);
    await this.auditoriaService.log({
      actorUuid: actorUuid || existing.authorUuid,
      action: 'delete',
      target: `anuncio "${existing.title}"`,
      dep: 'gobierno',
    });
    return { success: true };
  }

  // ==================== AUDITORIA ====================

  async listAuditoria(
    query: ListAuditoriaQueryDto,
  ): Promise<GobiernoAuditoriaListEntity> {
    return this.auditoriaService.list(query);
  }

  // ==================== COUNTERS ====================

  async getCounters(): Promise<GobiernoCountersEntity> {
    return this.countersService.getCounters();
  }
}
