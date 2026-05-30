import { Injectable } from '@nestjs/common';
import { PoliciaDenunciasRepository } from '../repositories/policia-denuncias.repository';
import { CreateDenunciaDto, DenunciaStatus, UpdateDenunciaStatusDto } from '../dto/denuncia.dto';

@Injectable()
export class PoliciaService {
  constructor(
    private readonly denunciasRepo: PoliciaDenunciasRepository,
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
}
