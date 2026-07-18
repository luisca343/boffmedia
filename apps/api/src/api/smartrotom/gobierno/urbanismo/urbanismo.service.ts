import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActorContext, assertActsAsSelf } from '@api/_utils/auth/actor';
import { Logger } from 'nestjs-pino';
import { WingullFacadeService } from '../../wingull/wingull.facade.service';
import { PeopleRepository } from '../_shared/people.repository';
import { AuditoriaService } from '../_shared/auditoria.service';
import { TreasuryService } from '../_shared/treasury.service';
import { TransactionType } from '../../starbank/enums/transaction-type.enum';
import { toPersonRef } from '../_shared/entities/person-ref.entity';
import { generateGobCode } from '../_shared/code.util';
import { resolvePageSize } from '../_shared/dto/paged-query.dto';
import { UrbanismoRepository } from './urbanismo.repository';
import {
  CreateZonaDto,
  UpdateZonaDto,
  ListZonasQueryDto,
  CreateParcelaDto,
  UpdateParcelaDto,
  ListParcelasQueryDto,
  CreateParcelaHistorialDto,
  ListAllHistorialQueryDto,
  CreateSubastaDto,
  UpdateSubastaDto,
  ListSubastasQueryDto,
  PlaceBidDto,
} from './dto/urbanismo.dto';
import {
  GobiernoZonaEntity,
  GobiernoParcelaEntity,
  GobiernoParcelaListEntity,
  GobiernoParcelaHistorialListEntity,
  GobiernoSubastaEntity,
  GobiernoSubastaListEntity,
} from './entities/urbanismo.entity';

type Plot = {
  regionId: string;
  town: string;
  type: string;
  number: number;
  ownerUuid?: string;
};

@Injectable()
export class UrbanismoService {
  constructor(
    private readonly logger: Logger,
    private readonly urbanismoRepository: UrbanismoRepository,
    private readonly wingullFacadeService: WingullFacadeService,
    private readonly peopleRepository: PeopleRepository,
    private readonly auditoriaService: AuditoriaService,
    private readonly treasuryService: TreasuryService,
  ) {}

  // ==================== ZONAS ====================

  async listZonas(query: ListZonasQueryDto): Promise<GobiernoZonaEntity[]> {
    return this.urbanismoRepository.listZonas(query.town);
  }

  async getZona(id: number): Promise<GobiernoZonaEntity> {
    const zona = await this.urbanismoRepository.findZona(id);
    if (!zona) throw new NotFoundException(`Zona ${id} not found`);
    return zona;
  }

  async createZona(dto: CreateZonaDto): Promise<GobiernoZonaEntity> {
    const zona = await this.urbanismoRepository.createZona(dto);
    await this.auditoriaService.log({
      actorUuid: dto.actorUuid || 'system',
      action: 'create',
      target: `zona "${zona.name}" (${zona.town})`,
      dep: 'urbanismo',
    });
    return zona;
  }

  async updateZona(
    id: number,
    dto: UpdateZonaDto,
  ): Promise<GobiernoZonaEntity> {
    await this.getZona(id);
    const zona = await this.urbanismoRepository.updateZona(id, dto);
    await this.auditoriaService.log({
      actorUuid: dto.actorUuid || 'system',
      action: 'update',
      target: `zona #${id}`,
      dep: 'urbanismo',
    });
    return zona as GobiernoZonaEntity;
  }

  async deleteZona(
    id: number,
    actorUuid?: string,
  ): Promise<{ success: boolean }> {
    await this.getZona(id);
    await this.urbanismoRepository.deleteZona(id);
    await this.auditoriaService.log({
      actorUuid: actorUuid || 'system',
      action: 'delete',
      target: `zona #${id}`,
      dep: 'urbanismo',
    });
    return { success: true };
  }

  // ==================== PARCELAS ====================

  private async getPlots(): Promise<Plot[]> {
    const plots = await this.wingullFacadeService.getAllPlots();
    return (plots as Plot[]).filter((p) => p.type === 'parcela');
  }

  private async toParcelaEntity(
    plot: Plot,
    names: Map<string, string>,
    meta?: {
      id: number;
      zonaId: number | null;
      status: string;
      taxAmount: number;
      taxDueAt: Date | null;
      notes: string | null;
      createdAt: Date;
      updatedAt: Date;
    } | null,
  ): Promise<GobiernoParcelaEntity> {
    return {
      id: meta?.id ?? null,
      regionId: plot.regionId,
      town: plot.town,
      number: plot.number,
      zonaId: meta?.zonaId ?? null,
      status: meta?.status ?? 'sin_registrar',
      taxAmount: meta?.taxAmount ?? null,
      taxDueAt: meta?.taxDueAt ?? null,
      notes: meta?.notes ?? null,
      owner: toPersonRef(plot.ownerUuid, names),
      createdAt: meta?.createdAt ?? null,
      updatedAt: meta?.updatedAt ?? null,
    };
  }

  async listParcelas(
    query: ListParcelasQueryDto,
  ): Promise<GobiernoParcelaListEntity> {
    const page = query.page ?? 1;
    const limit = resolvePageSize(query);

    let plots = await this.getPlots();
    if (query.town) plots = plots.filter((p) => p.town === query.town);

    const metaRows = await this.urbanismoRepository.findParcelasByRegions(
      plots.map((p) => p.regionId),
    );
    const metaByRegion = new Map(metaRows.map((m) => [m.regionId, m]));

    let merged = plots.map((plot) => ({
      plot,
      meta: metaByRegion.get(plot.regionId) ?? null,
    }));

    if (query.status) {
      merged = merged.filter(
        (r) => (r.meta?.status ?? 'sin_registrar') === query.status,
      );
    }
    if (query.zonaId !== undefined) {
      merged = merged.filter((r) => r.meta?.zonaId === query.zonaId);
    }

    const total = merged.length;
    const pageItems = merged.slice(
      (page - 1) * limit,
      (page - 1) * limit + limit,
    );
    const names = await this.peopleRepository.findUsernames(
      pageItems.map((r) => r.plot.ownerUuid),
    );

    const items = await Promise.all(
      pageItems.map((r) => this.toParcelaEntity(r.plot, names, r.meta)),
    );
    return { items, total, page, pageSize: limit };
  }

  async getParcela(regionId: string): Promise<GobiernoParcelaEntity> {
    const plots = await this.getPlots();
    const plot = plots.find((p) => p.regionId === regionId);
    if (!plot)
      throw new NotFoundException(`Plot ${regionId} not found in WorldGuard`);

    const meta = await this.urbanismoRepository.findParcelaByRegion(regionId);
    const names = await this.peopleRepository.findUsernames([plot.ownerUuid]);
    return this.toParcelaEntity(plot, names, meta);
  }

  async createParcela(dto: CreateParcelaDto): Promise<GobiernoParcelaEntity> {
    const plots = await this.getPlots();
    const plot = plots.find((p) => p.regionId === dto.regionId);
    if (!plot) {
      throw new BadRequestException(
        `No WorldGuard plot matches region ${dto.regionId}`,
      );
    }

    await this.urbanismoRepository.upsertParcela({
      regionId: dto.regionId,
      town: dto.town,
      number: dto.number,
      zonaId: dto.zonaId ?? null,
      status: dto.status,
      taxAmount: dto.taxAmount,
      taxDueAt: dto.taxDueAt,
      notes: dto.notes,
    });

    await this.auditoriaService.log({
      actorUuid: dto.actorUuid || 'system',
      action: 'create',
      target: `parcela ${dto.regionId}`,
      dep: 'urbanismo',
    });

    return this.getParcela(dto.regionId);
  }

  async updateParcela(
    regionId: string,
    dto: UpdateParcelaDto,
  ): Promise<GobiernoParcelaEntity> {
    const existing =
      await this.urbanismoRepository.findParcelaByRegion(regionId);
    if (!existing) {
      throw new NotFoundException(
        `Parcela ${regionId} has no metadata yet — POST it first`,
      );
    }

    await this.urbanismoRepository.updateParcela(regionId, {
      zonaId: dto.zonaId ?? undefined,
      status: dto.status,
      taxAmount: dto.taxAmount,
      taxDueAt: dto.taxDueAt,
      notes: dto.notes,
    });

    await this.auditoriaService.log({
      actorUuid: dto.actorUuid || 'system',
      action: 'update',
      target: `parcela ${regionId}`,
      dep: 'urbanismo',
    });

    return this.getParcela(regionId);
  }

  // ==================== PARCELA HISTORIAL ====================

  async listHistorial(
    regionId: string,
    page: number,
    limit: number,
  ): Promise<GobiernoParcelaHistorialListEntity> {
    const all = await this.urbanismoRepository.listHistorial(regionId);
    const names = await this.peopleRepository.findUsernames(
      all.flatMap((h) => [h.previousOwnerUuid, h.newOwnerUuid]),
    );
    const pageItems = all.slice((page - 1) * limit, (page - 1) * limit + limit);
    return {
      items: pageItems.map((h) => ({
        id: h.id,
        regionId: h.regionId,
        town: h.town,
        number: h.number,
        previousOwner: toPersonRef(h.previousOwnerUuid, names),
        newOwner: toPersonRef(h.newOwnerUuid, names),
        reason: h.reason,
        changedAt: h.changedAt,
      })),
      total: all.length,
      page,
      pageSize: limit,
    };
  }

  // The Historial screen: aggregate ownership-change register across every plot, newest first.
  async listAllHistorial(
    query: ListAllHistorialQueryDto,
  ): Promise<GobiernoParcelaHistorialListEntity> {
    const page = query.page ?? 1;
    const limit = resolvePageSize(query);
    const { items, total } = await this.urbanismoRepository.listAllHistorial(
      page,
      limit,
      query,
    );
    const names = await this.peopleRepository.findUsernames(
      items.flatMap((h) => [h.previousOwnerUuid, h.newOwnerUuid]),
    );
    return {
      items: items.map((h) => ({
        id: h.id,
        regionId: h.regionId,
        town: h.town,
        number: h.number,
        previousOwner: toPersonRef(h.previousOwnerUuid, names),
        newOwner: toPersonRef(h.newOwnerUuid, names),
        reason: h.reason,
        changedAt: h.changedAt,
      })),
      total,
      page,
      pageSize: limit,
    };
  }

  async appendHistorial(regionId: string, dto: CreateParcelaHistorialDto) {
    await this.urbanismoRepository.appendHistorial(regionId, dto);
    await this.auditoriaService.log({
      actorUuid: dto.newOwnerUuid || dto.previousOwnerUuid || 'system',
      action: 'update',
      target: `historial de parcela ${regionId}`,
      dep: 'urbanismo',
    });
    return this.listHistorial(regionId, 1, 20);
  }

  // ==================== SUBASTAS ====================

  private async toSubastaEntity(
    subasta: Awaited<ReturnType<UrbanismoRepository['findSubasta']>>,
    withBids = false,
  ): Promise<GobiernoSubastaEntity> {
    if (!subasta) throw new NotFoundException('Subasta not found');
    const bids = withBids
      ? await this.urbanismoRepository.listPujas(subasta.id)
      : [];
    const names = await this.peopleRepository.findUsernames([
      subasta.bidderUuid,
      subasta.createdBy,
      ...bids.map((b) => b.uuid),
    ]);
    return {
      id: subasta.id,
      code: subasta.code,
      regionId: subasta.regionId,
      town: subasta.town,
      number: subasta.number,
      startBid: subasta.startBid,
      currentBid: subasta.currentBid,
      bidder: toPersonRef(subasta.bidderUuid, names),
      bids: subasta.bids,
      reason: subasta.reason,
      status: subasta.status,
      endsAt: subasta.endsAt,
      settledTxId: subasta.settledTxId,
      createdBy: toPersonRef(subasta.createdBy, names) as any,
      createdAt: subasta.createdAt,
      updatedAt: subasta.updatedAt,
      recentBids: withBids
        ? bids.slice(0, 20).map((b) => ({
            id: b.id,
            bidder: toPersonRef(b.uuid, names) as any,
            amount: b.amount,
            createdAt: b.createdAt,
          }))
        : undefined,
    };
  }

  async listSubastas(
    query: ListSubastasQueryDto,
  ): Promise<GobiernoSubastaListEntity> {
    const page = query.page ?? 1;
    const limit = resolvePageSize(query);
    const { items, total } = await this.urbanismoRepository.listSubastas(
      page,
      limit,
      query.status,
      query.town,
    );
    const enriched = await Promise.all(
      items.map((s) => this.toSubastaEntity(s, false)),
    );
    return { items: enriched, total, page, pageSize: limit };
  }

  async getSubasta(id: number): Promise<GobiernoSubastaEntity> {
    const subasta = await this.urbanismoRepository.findSubasta(id);
    return this.toSubastaEntity(subasta, true);
  }

  async createSubasta(dto: CreateSubastaDto): Promise<GobiernoSubastaEntity> {
    const code = generateGobCode('SUB');
    const subasta = await this.urbanismoRepository.createSubasta({
      ...dto,
      code,
    });
    await this.auditoriaService.log({
      actorUuid: dto.createdBy,
      action: 'create',
      target: `subasta ${code}`,
      dep: 'urbanismo',
    });
    return this.toSubastaEntity(subasta, false);
  }

  async updateSubasta(
    id: number,
    dto: UpdateSubastaDto,
  ): Promise<GobiernoSubastaEntity> {
    const existing = await this.urbanismoRepository.findSubasta(id);
    if (!existing) throw new NotFoundException(`Subasta ${id} not found`);

    const subasta = await this.urbanismoRepository.updateSubasta(id, {
      startBid: dto.startBid,
      reason: dto.reason,
      endsAt: dto.endsAt,
      status: dto.status,
    });
    await this.auditoriaService.log({
      actorUuid: 'system',
      action: 'update',
      target: `subasta ${existing.code}`,
      dep: 'urbanismo',
    });
    return this.toSubastaEntity(subasta, false);
  }

  async deleteSubasta(
    id: number,
    actorUuid?: string,
  ): Promise<{ success: boolean }> {
    const existing = await this.urbanismoRepository.findSubasta(id);
    if (!existing) throw new NotFoundException(`Subasta ${id} not found`);
    await this.urbanismoRepository.deleteSubasta(id);
    await this.auditoriaService.log({
      actorUuid: actorUuid || 'system',
      action: 'delete',
      target: `subasta ${existing.code}`,
      dep: 'urbanismo',
    });
    return { success: true };
  }

  async placeBid(
    id: number,
    dto: PlaceBidDto,
    actor?: ActorContext,
  ): Promise<GobiernoSubastaEntity> {
    assertActsAsSelf(dto.uuid, actor);
    const existing = await this.urbanismoRepository.findSubasta(id);
    if (!existing) throw new NotFoundException(`Subasta ${id} not found`);
    if (existing.status !== 'live') {
      throw new BadRequestException(`Auction ${existing.code} is not live`);
    }
    if (dto.amount <= existing.currentBid) {
      throw new BadRequestException(
        `Bid must be greater than the current bid (${existing.currentBid})`,
      );
    }

    const updated = await this.urbanismoRepository.placeBid(
      id,
      dto.uuid,
      dto.amount,
    );
    await this.auditoriaService.log({
      actorUuid: dto.uuid,
      action: 'update',
      target: `puja en subasta ${existing.code}`,
      dep: 'urbanismo',
    });
    return this.toSubastaEntity(updated, true);
  }

  async closeSubasta(
    id: number,
    actorUuid?: string,
  ): Promise<GobiernoSubastaEntity> {
    const existing = await this.urbanismoRepository.findSubasta(id);
    if (!existing) throw new NotFoundException(`Subasta ${id} not found`);
    if (existing.status !== 'live') {
      throw new BadRequestException(
        `Auction ${existing.code} is already ${existing.status}`,
      );
    }

    let settledTxId: number | null = null;
    if (existing.bidderUuid && existing.currentBid > 0) {
      settledTxId = await this.treasuryService.credit(
        existing.bidderUuid,
        existing.currentBid,
        TransactionType.SUBASTA,
        `Subasta ${existing.code} — parcela ${existing.town} #${existing.number}`,
      );
    }

    const closed = await this.urbanismoRepository.closeSubasta(id, settledTxId);
    await this.auditoriaService.log({
      actorUuid: actorUuid || existing.bidderUuid || 'system',
      action: 'close',
      target: `subasta ${existing.code}`,
      dep: 'urbanismo',
    });
    return this.toSubastaEntity(closed, true);
  }
}
