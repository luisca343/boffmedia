import { Injectable } from '@nestjs/common';
import { PoliciaDenunciasRepository } from '../repositories/policia-denuncias.repository';
import { PoliciaBuscadosRepository } from '../repositories/policia-buscados.repository';
import { PoliciaMultasRepository } from '../repositories/policia-multas.repository';
import { CreateDenunciaDto, DenunciaStatus, UpdateDenunciaStatusDto } from '../dto/denuncia.dto';
import { BuscadoSeverity, BuscadoStatus, CreateBuscadoDto, UpdateBuscadoStatusDto } from '../dto/buscado.dto';
import { CreateMultaDto, MultaStatus, UpdateMultaStatusDto } from '../dto/multa.dto';

@Injectable()
export class PoliciaService {
  constructor(
    private readonly denunciasRepo: PoliciaDenunciasRepository,
    private readonly buscadosRepo: PoliciaBuscadosRepository,
    private readonly multasRepo: PoliciaMultasRepository,
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
}
