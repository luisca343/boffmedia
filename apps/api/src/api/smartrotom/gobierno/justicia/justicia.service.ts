import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActorContext, assertActsAsSelf } from '@api/_utils/auth/actor';
import { Logger } from 'nestjs-pino';
import { PeopleRepository } from '../_shared/people.repository';
import { AuditoriaService } from '../_shared/auditoria.service';
import { TreasuryService } from '../_shared/treasury.service';
import { TransactionType } from '../../starbank/enums/transaction-type.enum';
import { toPersonRef } from '../_shared/entities/person-ref.entity';
import { resolvePageSize } from '../_shared/dto/paged-query.dto';
import { HaciendaRepository } from '../hacienda/hacienda.repository';
import { JusticiaRepository } from './justicia.repository';
import {
  CreateExpedienteDto,
  UpdateExpedienteDto,
  ListExpedientesQueryDto,
  CreateExpedienteEventoDto,
  CreateApelacionDto,
  UpdateApelacionDto,
  ResolveApelacionDto,
  ListApelacionesQueryDto,
} from './dto/justicia.dto';
import {
  GobiernoExpedienteEntity,
  GobiernoExpedienteListEntity,
  GobiernoExpedienteEventoListEntity,
  GobiernoApelacionEntity,
  GobiernoApelacionListEntity,
} from './entities/justicia.entity';

@Injectable()
export class JusticiaService {
  constructor(
    private readonly logger: Logger,
    private readonly justiciaRepository: JusticiaRepository,
    private readonly haciendaRepository: HaciendaRepository,
    private readonly peopleRepository: PeopleRepository,
    private readonly auditoriaService: AuditoriaService,
    private readonly treasuryService: TreasuryService,
  ) {}

  // ==================== EXPEDIENTES ====================

  private async toExpedienteEntity(
    e: NonNullable<Awaited<ReturnType<JusticiaRepository['findExpediente']>>>,
    names: Map<string, string>,
    timeline?: GobiernoExpedienteEntity['timeline'],
  ): Promise<GobiernoExpedienteEntity> {
    return {
      id: e.id,
      code: e.code,
      title: e.title,
      subject: toPersonRef(e.subjectUuid, names) as any,
      dep: e.dep,
      status: e.status,
      severity: e.severity,
      lead: toPersonRef(e.leadUuid, names) as any,
      openedAt: e.openedAt,
      closedAt: e.closedAt,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      timeline,
    };
  }

  async listExpedientes(
    query: ListExpedientesQueryDto,
  ): Promise<GobiernoExpedienteListEntity> {
    const page = query.page ?? 1;
    const limit = resolvePageSize(query);
    const { items, total } = await this.justiciaRepository.listExpedientes(
      page,
      limit,
      query,
    );
    const names = await this.peopleRepository.findUsernames(
      items.flatMap((e) => [e.subjectUuid, e.leadUuid]),
    );
    return {
      items: await Promise.all(
        items.map((e) => this.toExpedienteEntity(e, names)),
      ),
      total,
      page,
      pageSize: limit,
    };
  }

  async getExpediente(id: number): Promise<GobiernoExpedienteEntity> {
    const e = await this.justiciaRepository.findExpediente(id);
    if (!e) throw new NotFoundException(`Expediente ${id} not found`);
    const { items: timelineRows } = await this.justiciaRepository.listTimeline(
      id,
      1,
      50,
    );
    const names = await this.peopleRepository.findUsernames([
      e.subjectUuid,
      e.leadUuid,
    ]);
    return this.toExpedienteEntity(e, names, timelineRows);
  }

  async createExpediente(
    dto: CreateExpedienteDto,
  ): Promise<GobiernoExpedienteEntity> {
    const e = await this.justiciaRepository.createExpediente(dto);
    await this.auditoriaService.log({
      actorUuid: dto.leadUuid,
      action: 'create',
      target: `expediente ${e.code}`,
      dep: 'justicia',
    });
    return this.getExpediente(e.id);
  }

  async updateExpediente(
    id: number,
    dto: UpdateExpedienteDto,
  ): Promise<GobiernoExpedienteEntity> {
    const existing = await this.justiciaRepository.findExpediente(id);
    if (!existing) throw new NotFoundException(`Expediente ${id} not found`);
    await this.justiciaRepository.updateExpediente(id, {
      title: dto.title,
      dep: dto.dep,
      severity: dto.severity,
      leadUuid: dto.leadUuid,
      status: dto.status,
    });
    await this.auditoriaService.log({
      actorUuid: existing.leadUuid,
      action: 'update',
      target: `expediente ${existing.code}`,
      dep: 'justicia',
    });
    return this.getExpediente(id);
  }

  async deleteExpediente(
    id: number,
    actorUuid?: string,
  ): Promise<{ success: boolean }> {
    const existing = await this.justiciaRepository.findExpediente(id);
    if (!existing) throw new NotFoundException(`Expediente ${id} not found`);
    await this.justiciaRepository.deleteExpediente(id);
    await this.auditoriaService.log({
      actorUuid: actorUuid || existing.leadUuid,
      action: 'delete',
      target: `expediente ${existing.code}`,
      dep: 'justicia',
    });
    return { success: true };
  }

  async listTimeline(
    expedienteId: number,
    page: number,
    limit: number,
  ): Promise<GobiernoExpedienteEventoListEntity> {
    const { items, total } = await this.justiciaRepository.listTimeline(
      expedienteId,
      page,
      limit,
    );
    return { items, total, page, pageSize: limit };
  }

  async appendTimeline(
    expedienteId: number,
    dto: CreateExpedienteEventoDto,
  ): Promise<GobiernoExpedienteEventoListEntity> {
    const existing = await this.justiciaRepository.findExpediente(expedienteId);
    if (!existing)
      throw new NotFoundException(`Expediente ${expedienteId} not found`);
    await this.justiciaRepository.appendTimeline(expedienteId, dto);
    await this.auditoriaService.log({
      actorUuid: existing.leadUuid,
      action: 'update',
      target: `línea de tiempo del expediente ${existing.code}`,
      dep: 'justicia',
    });
    return this.listTimeline(expedienteId, 1, 20);
  }

  // ==================== APELACIONES ====================

  private async toApelacionEntity(
    a: NonNullable<Awaited<ReturnType<JusticiaRepository['findApelacion']>>>,
    names: Map<string, string>,
  ): Promise<GobiernoApelacionEntity> {
    return {
      id: a.id,
      code: a.code,
      multaId: a.multaId,
      player: toPersonRef(a.playerUuid, names) as any,
      status: a.status,
      grounds: a.grounds,
      reviewer: toPersonRef(a.reviewerUuid, names),
      decision: a.decision,
      resolvedAt: a.resolvedAt,
      refundTxId: a.refundTxId,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  }

  async listApelaciones(
    query: ListApelacionesQueryDto,
  ): Promise<GobiernoApelacionListEntity> {
    const page = query.page ?? 1;
    const limit = resolvePageSize(query);
    const { items, total } = await this.justiciaRepository.listApelaciones(
      page,
      limit,
      query,
    );
    const names = await this.peopleRepository.findUsernames(
      items.flatMap((a) => [a.playerUuid, a.reviewerUuid]),
    );
    return {
      items: await Promise.all(
        items.map((a) => this.toApelacionEntity(a, names)),
      ),
      total,
      page,
      pageSize: limit,
    };
  }

  async getApelacion(id: number): Promise<GobiernoApelacionEntity> {
    const a = await this.justiciaRepository.findApelacion(id);
    if (!a) throw new NotFoundException(`Apelacion ${id} not found`);
    const names = await this.peopleRepository.findUsernames([
      a.playerUuid,
      a.reviewerUuid,
    ]);
    return this.toApelacionEntity(a, names);
  }

  async createApelacion(
    dto: CreateApelacionDto,
    actor?: ActorContext,
  ): Promise<GobiernoApelacionEntity> {
    assertActsAsSelf(dto.playerUuid, actor);
    const multa = await this.haciendaRepository.findMulta(dto.multaId);
    if (!multa) throw new BadRequestException(`Multa ${dto.multaId} not found`);

    const a = await this.justiciaRepository.createApelacion(dto);
    await this.auditoriaService.log({
      actorUuid: dto.playerUuid,
      action: 'create',
      target: `apelación ${a.code} (multa ${multa.code})`,
      dep: 'justicia',
    });
    return this.getApelacion(a.id);
  }

  async updateApelacion(
    id: number,
    dto: UpdateApelacionDto,
  ): Promise<GobiernoApelacionEntity> {
    const existing = await this.justiciaRepository.findApelacion(id);
    if (!existing) throw new NotFoundException(`Apelacion ${id} not found`);
    if (existing.status === 'upheld' || existing.status === 'overturned') {
      throw new BadRequestException(
        `Apelacion ${existing.code} is already resolved`,
      );
    }
    await this.justiciaRepository.updateApelacion(id, {
      grounds: dto.grounds,
      status: dto.status,
    });
    await this.auditoriaService.log({
      actorUuid: existing.playerUuid,
      action: 'update',
      target: `apelación ${existing.code}`,
      dep: 'justicia',
    });
    return this.getApelacion(id);
  }

  async deleteApelacion(
    id: number,
    actorUuid?: string,
  ): Promise<{ success: boolean }> {
    const existing = await this.justiciaRepository.findApelacion(id);
    if (!existing) throw new NotFoundException(`Apelacion ${id} not found`);
    await this.justiciaRepository.deleteApelacion(id);
    await this.auditoriaService.log({
      actorUuid: actorUuid || existing.playerUuid,
      action: 'delete',
      target: `apelación ${existing.code}`,
      dep: 'justicia',
    });
    return { success: true };
  }

  async resolveApelacion(
    id: number,
    dto: ResolveApelacionDto,
  ): Promise<GobiernoApelacionEntity> {
    const existing = await this.justiciaRepository.findApelacion(id);
    if (!existing) throw new NotFoundException(`Apelacion ${id} not found`);
    if (existing.status === 'upheld' || existing.status === 'overturned') {
      throw new BadRequestException(
        `Apelacion ${existing.code} is already resolved`,
      );
    }

    let refundTxId: number | null = null;
    if (dto.outcome === 'overturned') {
      const multa = await this.haciendaRepository.findMulta(existing.multaId);
      if (multa) {
        if (multa.status === 'paid') {
          refundTxId = await this.treasuryService.debit(
            multa.playerUuid,
            multa.amount,
            TransactionType.MULTA,
            `Devolución de multa ${multa.code} (apelación ${existing.code} estimada)`,
          );
        }
        if (multa.status !== 'cancelled') {
          await this.haciendaRepository.cancelMulta(multa.id);
        }
      }
    }

    await this.justiciaRepository.resolveApelacion(
      id,
      dto.outcome,
      dto.decision,
      dto.reviewerUuid,
      refundTxId,
    );
    await this.auditoriaService.log({
      actorUuid: dto.reviewerUuid,
      action: 'resolve',
      target: `apelación ${existing.code} (${dto.outcome})`,
      dep: 'justicia',
    });
    return this.getApelacion(id);
  }
}
