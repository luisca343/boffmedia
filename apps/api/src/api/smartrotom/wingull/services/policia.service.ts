import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { boffMediaUsers, boffMediaUserRoles, boffMediaRoles } from '@/_db/schema/BoffMedia';
import { smartrotomUsers } from '@/_db/schema/SmartRotom';
import { PoliciaDenunciasRepository } from '../repositories/policia-denuncias.repository';
import { PoliciaBuscadosRepository } from '../repositories/policia-buscados.repository';
import { PoliciaMultasRepository } from '../repositories/policia-multas.repository';
import { PoliciaPlotHistoryRepository } from '../repositories/policia-plot-history.repository';
import { WingullFacadeService } from '../wingull.facade.service';
import { CreateDenunciaDto, DenunciaStatus, UpdateDenunciaStatusDto } from '../dto/denuncia.dto';
import { BuscadoSeverity, BuscadoStatus, CreateBuscadoDto, UpdateBuscadoStatusDto } from '../dto/buscado.dto';
import { CreateMultaDto, MultaStatus, UpdateMultaStatusDto } from '../dto/multa.dto';

@Injectable()
export class PoliciaService {
  constructor(
    private readonly denunciasRepo: PoliciaDenunciasRepository,
    private readonly buscadosRepo: PoliciaBuscadosRepository,
    private readonly multasRepo: PoliciaMultasRepository,
    private readonly plotHistoryRepo: PoliciaPlotHistoryRepository,
    private readonly wingullFacade: WingullFacadeService,
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  // ========================
  // Denuncias
  // ========================

  createDenuncia(dto: CreateDenunciaDto) {
    return this.denunciasRepo.create(dto);
  }

  getDenuncias(filters?: { town?: string; status?: DenunciaStatus; accusedUuid?: string }) {
    return this.denunciasRepo.findAll(filters);
  }

  updateDenunciaStatus(id: number, dto: UpdateDenunciaStatusDto) {
    return this.denunciasRepo.updateStatus(id, dto);
  }

  // ========================
  // Buscados
  // ========================

  createBuscado(dto: CreateBuscadoDto) {
    return this.buscadosRepo.create(dto);
  }

  getBuscados(filters?: { status?: BuscadoStatus; severity?: BuscadoSeverity }) {
    return this.buscadosRepo.findAll(filters);
  }

  updateBuscadoStatus(id: number, dto: UpdateBuscadoStatusDto) {
    return this.buscadosRepo.updateStatus(id, dto);
  }

  // ========================
  // Multas
  // ========================

  createMulta(dto: CreateMultaDto) {
    return this.multasRepo.create(dto);
  }

  getMultas(filters?: { playerUuid?: string; status?: MultaStatus }) {
    return this.multasRepo.findAll(filters);
  }

  updateMultaStatus(id: number, dto: UpdateMultaStatusDto) {
    return this.multasRepo.updateStatus(id, dto);
  }

  // ========================
  // Oficiales (Staff/Admin users)
  // ========================

  async getOficiales(): Promise<{ uuid: string; username: string; role: string }[]> {
    const rows = await this.db
      .select({
        uuid: boffMediaUsers.uuid,
        username: boffMediaUsers.username,
        role: boffMediaRoles.name,
      })
      .from(boffMediaUsers)
      .innerJoin(boffMediaUserRoles, eq(boffMediaUserRoles.userId, boffMediaUsers.id))
      .innerJoin(boffMediaRoles, eq(boffMediaRoles.id, boffMediaUserRoles.roleId));

    return rows
      .filter((r) => r.uuid !== null)
      .map((r) => ({ uuid: r.uuid!, username: r.username, role: r.role }));
  }

  // ========================
  // Historial de Parcelas
  // ========================

  getPlotHistory(town: string, plotNumber: number) {
    return this.plotHistoryRepo.findByPlot(town, plotNumber);
  }

  // ========================
  // Zonas Restringidas
  // ========================

  async getZonasRestringidas() {
    const all = await this.wingullFacade.getAllRegions();
    return all
      .filter((p) => p.type !== 'parcela' && p.type !== 'negocio' && p.type !== 'tienda')
      .map((p) => ({ ...p, zoneType: p.type }));
  }
}
