import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { WingullFacadeService } from '../../wingull/wingull.facade.service';
import { PeopleRepository } from '../_shared/people.repository';
import { AuditoriaService } from '../_shared/auditoria.service';
import { toPersonRef } from '../_shared/entities/person-ref.entity';
import { AdministracionRepository } from './administracion.repository';
import {
  CreateNpcSkinDto,
  UpdateNpcSkinDto,
  SendMegafoniaDto,
  CreateCartelDto,
  UpdateCartelDto,
} from './dto/administracion.dto';
import {
  GobiernoNpcSkinEntity,
  GobiernoMegafoniaEntity,
  GobiernoCartelEntity,
} from './entities/administracion.entity';

@Injectable()
export class AdministracionService {
  constructor(
    private readonly logger: Logger,
    private readonly administracionRepository: AdministracionRepository,
    private readonly wingullFacadeService: WingullFacadeService,
    private readonly peopleRepository: PeopleRepository,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  // ==================== NPC SKINS ====================

  private toNpcSkinEntity(s: {
    id: number;
    skin: string;
    npcs: unknown;
    src: number;
    face: number;
    head: number;
    body: number;
    updatedAt: Date;
  }): GobiernoNpcSkinEntity {
    return { ...s, npcs: s.npcs as string[] | null };
  }

  async listNpcSkins(): Promise<GobiernoNpcSkinEntity[]> {
    const rows = await this.administracionRepository.listNpcSkins();
    return rows.map((r) => this.toNpcSkinEntity(r));
  }

  async getNpcSkin(skin: string): Promise<GobiernoNpcSkinEntity> {
    const s = await this.administracionRepository.findNpcSkin(skin);
    if (!s) throw new NotFoundException(`Skin "${skin}" not found`);
    return this.toNpcSkinEntity(s);
  }

  async createNpcSkin(dto: CreateNpcSkinDto): Promise<GobiernoNpcSkinEntity> {
    const existing = await this.administracionRepository.findNpcSkin(dto.skin);
    if (existing)
      throw new ConflictException(`Skin "${dto.skin}" already exists`);
    const s = await this.administracionRepository.createNpcSkin(dto);
    await this.auditoriaService.log({
      actorUuid: dto.actorUuid || 'system',
      action: 'create',
      target: `npc-skin "${s.skin}"`,
      dep: 'administracion',
    });
    return this.toNpcSkinEntity(s);
  }

  async updateNpcSkin(
    skin: string,
    dto: UpdateNpcSkinDto,
  ): Promise<GobiernoNpcSkinEntity> {
    const existing = await this.administracionRepository.findNpcSkin(skin);
    if (!existing) throw new NotFoundException(`Skin "${skin}" not found`);
    const s = await this.administracionRepository.updateNpcSkin(skin, {
      npcs: dto.npcs,
      src: dto.src,
      face: dto.face,
      head: dto.head,
      body: dto.body,
    });
    await this.auditoriaService.log({
      actorUuid: dto.actorUuid || 'system',
      action: 'update',
      target: `npc-skin "${skin}"`,
      dep: 'administracion',
    });
    return this.toNpcSkinEntity(s as NonNullable<typeof s>);
  }

  async deleteNpcSkin(
    skin: string,
    actorUuid?: string,
  ): Promise<{ success: boolean }> {
    const existing = await this.administracionRepository.findNpcSkin(skin);
    if (!existing) throw new NotFoundException(`Skin "${skin}" not found`);
    await this.administracionRepository.deleteNpcSkin(skin);
    await this.auditoriaService.log({
      actorUuid: actorUuid || 'system',
      action: 'delete',
      target: `npc-skin "${skin}"`,
      dep: 'administracion',
    });
    return { success: true };
  }

  // ==================== MEGAFONIA ====================

  async listMegafonia(limit: number): Promise<GobiernoMegafoniaEntity[]> {
    const rows = await this.administracionRepository.listMegafonia(limit);
    const names = await this.peopleRepository.findUsernames(
      rows.map((r) => r.byUuid),
    );
    return rows.map((r) => ({
      id: r.id,
      speaker: r.speaker,
      text: r.text,
      by: toPersonRef(r.byUuid, names) as any,
      createdAt: r.createdAt,
    }));
  }

  async sendMegafonia(
    dto: SendMegafoniaDto,
  ): Promise<GobiernoMegafoniaEntity[]> {
    await this.wingullFacadeService.globalchat(
      dto.byUuid,
      `[${dto.speaker}] ${dto.text}`,
    );
    await this.administracionRepository.recordMegafonia(dto);
    await this.auditoriaService.log({
      actorUuid: dto.byUuid,
      action: 'send',
      target: `megafonía como "${dto.speaker}"`,
      dep: 'administracion',
    });
    return this.listMegafonia(50);
  }

  // ==================== CARTELES ====================

  private async toCartelEntity(
    c: NonNullable<Awaited<ReturnType<AdministracionRepository['findCartel']>>>,
    names: Map<string, string>,
  ): Promise<GobiernoCartelEntity> {
    return {
      id: c.id,
      name: c.name,
      highway: c.highway,
      destinations: c.destinations as GobiernoCartelEntity['destinations'],
      createdBy: toPersonRef(c.createdBy, names) as any,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  async listCarteles(highway?: string): Promise<GobiernoCartelEntity[]> {
    const rows = await this.administracionRepository.listCarteles(highway);
    const names = await this.peopleRepository.findUsernames(
      rows.map((c) => c.createdBy),
    );
    return Promise.all(rows.map((c) => this.toCartelEntity(c, names)));
  }

  async getCartel(id: number): Promise<GobiernoCartelEntity> {
    const c = await this.administracionRepository.findCartel(id);
    if (!c) throw new NotFoundException(`Cartel ${id} not found`);
    const names = await this.peopleRepository.findUsernames([c.createdBy]);
    return this.toCartelEntity(c, names);
  }

  async createCartel(dto: CreateCartelDto): Promise<GobiernoCartelEntity> {
    const c = await this.administracionRepository.createCartel(dto);
    await this.auditoriaService.log({
      actorUuid: dto.createdBy,
      action: 'create',
      target: `cartel "${c.name}"`,
      dep: 'administracion',
    });
    return this.getCartel(c.id);
  }

  async updateCartel(
    id: number,
    dto: UpdateCartelDto,
  ): Promise<GobiernoCartelEntity> {
    const existing = await this.administracionRepository.findCartel(id);
    if (!existing) throw new NotFoundException(`Cartel ${id} not found`);
    await this.administracionRepository.updateCartel(id, {
      name: dto.name,
      highway: dto.highway,
      destinations: dto.destinations,
    });
    await this.auditoriaService.log({
      actorUuid: existing.createdBy,
      action: 'update',
      target: `cartel "${existing.name}"`,
      dep: 'administracion',
    });
    return this.getCartel(id);
  }

  async deleteCartel(
    id: number,
    actorUuid?: string,
  ): Promise<{ success: boolean }> {
    const existing = await this.administracionRepository.findCartel(id);
    if (!existing) throw new NotFoundException(`Cartel ${id} not found`);
    await this.administracionRepository.deleteCartel(id);
    await this.auditoriaService.log({
      actorUuid: actorUuid || existing.createdBy,
      action: 'delete',
      target: `cartel "${existing.name}"`,
      dep: 'administracion',
    });
    return { success: true };
  }
}
