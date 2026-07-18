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
import { SeguridadRepository } from './seguridad.repository';
import {
  CreateDenunciaDto,
  UpdateDenunciaDto,
  ResolveDenunciaDto,
  ListDenunciasQueryDto,
  CreateBuscadoDto,
  UpdateBuscadoDto,
  CaptureBuscadoDto,
  ListBuscadosQueryDto,
  CreatePatrullaDto,
  UpdatePatrullaDto,
  ListPatrullasQueryDto,
  CreateBitacoraDto,
  ListBitacoraQueryDto,
} from './dto/seguridad.dto';
import {
  GobiernoDenunciaEntity,
  GobiernoDenunciaListEntity,
  GobiernoBuscadoEntity,
  GobiernoBuscadoListEntity,
  GobiernoPatrullaEntity,
  GobiernoBitacoraEntity,
} from './entities/seguridad.entity';

@Injectable()
export class SeguridadService {
  constructor(
    private readonly logger: Logger,
    private readonly seguridadRepository: SeguridadRepository,
    private readonly peopleRepository: PeopleRepository,
    private readonly auditoriaService: AuditoriaService,
    private readonly treasuryService: TreasuryService,
  ) {}

  // ==================== DENUNCIAS ====================

  private async toDenunciaEntity(
    d: NonNullable<Awaited<ReturnType<SeguridadRepository['findDenuncia']>>>,
    names: Map<string, string>,
  ): Promise<GobiernoDenunciaEntity> {
    return {
      id: d.id,
      code: d.code,
      town: d.town,
      plotNumber: d.plotNumber,
      accused: toPersonRef(d.accusedUuid, names),
      reporter: toPersonRef(d.reporterUuid, names) as any,
      category: d.category,
      status: d.status,
      description: d.description,
      resolution: d.resolution,
      resolvedBy: toPersonRef(d.resolvedBy, names),
      resolvedAt: d.resolvedAt,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }

  async listDenuncias(
    query: ListDenunciasQueryDto,
  ): Promise<GobiernoDenunciaListEntity> {
    const page = query.page ?? 1;
    const limit = resolvePageSize(query);
    const { items, total } = await this.seguridadRepository.listDenuncias(
      page,
      limit,
      query,
    );
    const names = await this.peopleRepository.findUsernames(
      items.flatMap((d) => [d.accusedUuid, d.reporterUuid, d.resolvedBy]),
    );
    return {
      items: await Promise.all(
        items.map((d) => this.toDenunciaEntity(d, names)),
      ),
      total,
      page,
      pageSize: limit,
    };
  }

  async getDenuncia(id: number): Promise<GobiernoDenunciaEntity> {
    const d = await this.seguridadRepository.findDenuncia(id);
    if (!d) throw new NotFoundException(`Denuncia ${id} not found`);
    const names = await this.peopleRepository.findUsernames([
      d.accusedUuid,
      d.reporterUuid,
      d.resolvedBy,
    ]);
    return this.toDenunciaEntity(d, names);
  }

  async createDenuncia(
    dto: CreateDenunciaDto,
    actor?: ActorContext,
  ): Promise<GobiernoDenunciaEntity> {
    assertActsAsSelf(dto.reporterUuid, actor);
    const d = await this.seguridadRepository.createDenuncia(dto);
    await this.auditoriaService.log({
      actorUuid: dto.reporterUuid,
      action: 'create',
      target: `denuncia ${d.code}`,
      dep: 'seguridad',
    });
    return this.getDenuncia(d.id);
  }

  async updateDenuncia(
    id: number,
    dto: UpdateDenunciaDto,
  ): Promise<GobiernoDenunciaEntity> {
    const existing = await this.seguridadRepository.findDenuncia(id);
    if (!existing) throw new NotFoundException(`Denuncia ${id} not found`);
    await this.seguridadRepository.updateDenuncia(id, {
      town: dto.town,
      plotNumber: dto.plotNumber,
      accusedUuid: dto.accusedUuid,
      category: dto.category,
      description: dto.description,
      status: dto.status,
    });
    await this.auditoriaService.log({
      actorUuid: existing.reporterUuid,
      action: dto.status === 'reviewing' ? 'review' : 'update',
      target: `denuncia ${existing.code}`,
      dep: 'seguridad',
    });
    return this.getDenuncia(id);
  }

  async resolveDenuncia(
    id: number,
    dto: ResolveDenunciaDto,
  ): Promise<GobiernoDenunciaEntity> {
    const existing = await this.seguridadRepository.findDenuncia(id);
    if (!existing) throw new NotFoundException(`Denuncia ${id} not found`);
    if (existing.status !== 'pending' && existing.status !== 'reviewing') {
      throw new BadRequestException(
        `Denuncia ${existing.code} is already ${existing.status}`,
      );
    }
    await this.seguridadRepository.resolveDenuncia(
      id,
      dto.status,
      dto.resolution,
      dto.resolvedBy,
    );
    await this.auditoriaService.log({
      actorUuid: dto.resolvedBy,
      action: 'resolve',
      target: `denuncia ${existing.code}`,
      dep: 'seguridad',
    });
    return this.getDenuncia(id);
  }

  async deleteDenuncia(
    id: number,
    actorUuid?: string,
  ): Promise<{ success: boolean }> {
    const existing = await this.seguridadRepository.findDenuncia(id);
    if (!existing) throw new NotFoundException(`Denuncia ${id} not found`);
    await this.seguridadRepository.deleteDenuncia(id);
    await this.auditoriaService.log({
      actorUuid: actorUuid || existing.reporterUuid,
      action: 'delete',
      target: `denuncia ${existing.code}`,
      dep: 'seguridad',
    });
    return { success: true };
  }

  // ==================== BUSCADOS ====================

  private async toBuscadoEntity(
    b: NonNullable<Awaited<ReturnType<SeguridadRepository['findBuscado']>>>,
    names: Map<string, string>,
  ): Promise<GobiernoBuscadoEntity> {
    return {
      id: b.id,
      code: b.code,
      player: toPersonRef(b.playerUuid, names) as any,
      severity: b.severity,
      status: b.status,
      bounty: b.bounty,
      offense: b.offense,
      reportedBy: toPersonRef(b.reportedBy, names) as any,
      lastSeen: b.lastSeen,
      notes: b.notes,
      capturedBy: toPersonRef(b.capturedBy, names),
      capturedAt: b.capturedAt,
      payoutTxId: b.payoutTxId,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    };
  }

  async listBuscados(
    query: ListBuscadosQueryDto,
  ): Promise<GobiernoBuscadoListEntity> {
    const page = query.page ?? 1;
    const limit = resolvePageSize(query);
    const { items, total } = await this.seguridadRepository.listBuscados(
      page,
      limit,
      query,
    );
    const names = await this.peopleRepository.findUsernames(
      items.flatMap((b) => [b.playerUuid, b.reportedBy, b.capturedBy]),
    );
    return {
      items: await Promise.all(
        items.map((b) => this.toBuscadoEntity(b, names)),
      ),
      total,
      page,
      pageSize: limit,
    };
  }

  async getBuscado(id: number): Promise<GobiernoBuscadoEntity> {
    const b = await this.seguridadRepository.findBuscado(id);
    if (!b) throw new NotFoundException(`Buscado ${id} not found`);
    const names = await this.peopleRepository.findUsernames([
      b.playerUuid,
      b.reportedBy,
      b.capturedBy,
    ]);
    return this.toBuscadoEntity(b, names);
  }

  async createBuscado(dto: CreateBuscadoDto): Promise<GobiernoBuscadoEntity> {
    const b = await this.seguridadRepository.createBuscado(dto);
    await this.auditoriaService.log({
      actorUuid: dto.reportedBy,
      action: 'create',
      target: `buscado ${b.code}`,
      dep: 'seguridad',
    });
    return this.getBuscado(b.id);
  }

  async updateBuscado(
    id: number,
    dto: UpdateBuscadoDto,
  ): Promise<GobiernoBuscadoEntity> {
    const existing = await this.seguridadRepository.findBuscado(id);
    if (!existing) throw new NotFoundException(`Buscado ${id} not found`);
    await this.seguridadRepository.updateBuscado(id, {
      severity: dto.severity,
      bounty: dto.bounty,
      offense: dto.offense,
      lastSeen: dto.lastSeen,
      notes: dto.notes,
    });
    await this.auditoriaService.log({
      actorUuid: existing.reportedBy,
      action: 'update',
      target: `buscado ${existing.code}`,
      dep: 'seguridad',
    });
    return this.getBuscado(id);
  }

  async deleteBuscado(
    id: number,
    actorUuid?: string,
  ): Promise<{ success: boolean }> {
    const existing = await this.seguridadRepository.findBuscado(id);
    if (!existing) throw new NotFoundException(`Buscado ${id} not found`);
    await this.seguridadRepository.deleteBuscado(id);
    await this.auditoriaService.log({
      actorUuid: actorUuid || existing.reportedBy,
      action: 'delete',
      target: `buscado ${existing.code}`,
      dep: 'seguridad',
    });
    return { success: true };
  }

  async captureBuscado(
    id: number,
    dto: CaptureBuscadoDto,
  ): Promise<GobiernoBuscadoEntity> {
    const existing = await this.seguridadRepository.findBuscado(id);
    if (!existing) throw new NotFoundException(`Buscado ${id} not found`);
    if (existing.status !== 'active') {
      throw new BadRequestException(
        `Buscado ${existing.code} is already ${existing.status}`,
      );
    }

    let payoutTxId: number | null = null;
    if (existing.bounty > 0) {
      payoutTxId = await this.treasuryService.debit(
        dto.capturedBy,
        existing.bounty,
        TransactionType.RECOMPENSA,
        `Recompensa por captura de ${existing.code}`,
      );
    }

    await this.seguridadRepository.captureBuscado(
      id,
      dto.capturedBy,
      payoutTxId,
    );
    await this.auditoriaService.log({
      actorUuid: dto.capturedBy,
      action: 'capture',
      target: `buscado ${existing.code}`,
      dep: 'seguridad',
    });
    return this.getBuscado(id);
  }

  // ==================== PATRULLAS ====================

  async listPatrullas(
    query: ListPatrullasQueryDto,
  ): Promise<GobiernoPatrullaEntity[]> {
    const patrullas = await this.seguridadRepository.listPatrullas(
      query.status,
    );
    const officersByPatrulla =
      await this.seguridadRepository.listOfficersForMany(
        patrullas.map((p) => p.id),
      );
    const allUuids = Array.from(officersByPatrulla.values()).flat();
    const names = await this.peopleRepository.findUsernames(allUuids);

    return patrullas.map((p) => ({
      id: p.id,
      label: p.label,
      fromTime: p.fromTime,
      toTime: p.toTime,
      zone: p.zone,
      status: p.status,
      officers: (officersByPatrulla.get(p.id) ?? []).map(
        (uuid) => toPersonRef(uuid, names) as any,
      ),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }

  async getPatrulla(id: number): Promise<GobiernoPatrullaEntity> {
    const p = await this.seguridadRepository.findPatrulla(id);
    if (!p) throw new NotFoundException(`Patrulla ${id} not found`);
    const officers = await this.seguridadRepository.listOfficers(id);
    const names = await this.peopleRepository.findUsernames(officers);
    return {
      id: p.id,
      label: p.label,
      fromTime: p.fromTime,
      toTime: p.toTime,
      zone: p.zone,
      status: p.status,
      officers: officers.map((uuid) => toPersonRef(uuid, names) as any),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  async createPatrulla(
    dto: CreatePatrullaDto,
  ): Promise<GobiernoPatrullaEntity> {
    const p = await this.seguridadRepository.createPatrulla(dto);
    await this.auditoriaService.log({
      actorUuid: dto.actorUuid || 'system',
      action: 'create',
      target: `patrulla "${p.label}"`,
      dep: 'seguridad',
    });
    return this.getPatrulla(p.id);
  }

  async updatePatrulla(
    id: number,
    dto: UpdatePatrullaDto,
  ): Promise<GobiernoPatrullaEntity> {
    const existing = await this.seguridadRepository.findPatrulla(id);
    if (!existing) throw new NotFoundException(`Patrulla ${id} not found`);
    await this.seguridadRepository.updatePatrulla(
      id,
      {
        label: dto.label,
        fromTime: dto.fromTime,
        toTime: dto.toTime,
        zone: dto.zone,
        status: dto.status,
      },
      dto.officers,
    );
    await this.auditoriaService.log({
      actorUuid: dto.actorUuid || 'system',
      action: 'update',
      target: `patrulla "${existing.label}"`,
      dep: 'seguridad',
    });
    return this.getPatrulla(id);
  }

  async deletePatrulla(
    id: number,
    actorUuid?: string,
  ): Promise<{ success: boolean }> {
    const existing = await this.seguridadRepository.findPatrulla(id);
    if (!existing) throw new NotFoundException(`Patrulla ${id} not found`);
    await this.seguridadRepository.deletePatrulla(id);
    await this.auditoriaService.log({
      actorUuid: actorUuid || 'system',
      action: 'delete',
      target: `patrulla "${existing.label}"`,
      dep: 'seguridad',
    });
    return { success: true };
  }

  // ==================== BITACORA ====================

  async listBitacora(
    query: ListBitacoraQueryDto,
  ): Promise<GobiernoBitacoraEntity[]> {
    const rows = await this.seguridadRepository.listBitacora(query);
    const names = await this.peopleRepository.findUsernames(
      rows.map((r) => r.uuid),
    );
    return rows.map((r) => ({
      id: r.id,
      patrullaId: r.patrullaId,
      officer: toPersonRef(r.uuid, names) as any,
      text: r.text,
      tone: r.tone,
      createdAt: r.createdAt,
    }));
  }

  async appendBitacora(
    dto: CreateBitacoraDto,
  ): Promise<GobiernoBitacoraEntity[]> {
    await this.seguridadRepository.appendBitacora(dto);
    await this.auditoriaService.log({
      actorUuid: dto.uuid,
      action: 'create',
      target: `entrada de bitácora${dto.patrullaId ? ` (patrulla #${dto.patrullaId})` : ''}`,
      dep: 'seguridad',
    });
    return this.listBitacora({ patrullaId: dto.patrullaId });
  }
}
