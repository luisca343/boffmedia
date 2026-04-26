import { Injectable, NotFoundException } from '@nestjs/common';
import { SmogonService } from './services/smogon.service';
import { VgcPastesService } from './services/vgcpastes.service';
import { PokepasteService } from './services/pokepaste.service';
import { LimitlessService } from './services/limitless.service';
import { StatCalcService } from './services/stat-calc.service';
import { QuerySmogonDto } from './dto/query-smogon.dto';
import { QueryChampionsDto } from './dto/query-champions.dto';
import { AddLimitlessTournamentDto } from './dto/add-limitless-tournament.dto';
import { SMOGON_DEFAULT_CUTOFF } from './config/smogon.config';
import { CHAMPIONS_REGULATIONS } from '../champions-data';

@Injectable()
export class VgcMetaFacadeService {
  constructor(
    private readonly smogonService: SmogonService,
    private readonly vgcPastesService: VgcPastesService,
    private readonly pokepasteService: PokepasteService,
    private readonly limitlessService: LimitlessService,
    readonly statCalcService: StatCalcService,
  ) {}

  // â”€â”€â”€ Ladder (Smogon) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async getSmogonUsage(dto: QuerySmogonDto) {
    const cutoff = dto.cutoff ?? SMOGON_DEFAULT_CUTOFF;
    const month = dto.month ?? await this.smogonService.resolveLatestMonth(dto.format);
    return this.smogonService.getUsageList(dto.format, month, cutoff);
  }

  async getSmogonDetail(dto: QuerySmogonDto & { speciesId: string }) {
    const cutoff = dto.cutoff ?? SMOGON_DEFAULT_CUTOFF;
    const month = dto.month ?? await this.smogonService.resolveLatestMonth(dto.format);
    return this.smogonService.getPokemonDetail(dto.format, month, cutoff, dto.speciesId);
  }

  // â”€â”€â”€ Champions (VGCPastes) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async getChampionsUsage(dto: QueryChampionsDto) {
    const regulation = CHAMPIONS_REGULATIONS[dto.regulationId];
    if (!regulation) throw new NotFoundException(`Regulation "${dto.regulationId}" not found`);
    if (!regulation.vgcPastesGid) throw new NotFoundException(`No VGCPastes GID configured for "${dto.regulationId}"`);
    return this.vgcPastesService.getUsageList(dto.regulationId);
  }

  async refreshChampionsData(regulationId: string) {
    const regulation = CHAMPIONS_REGULATIONS[regulationId];
    if (!regulation) throw new NotFoundException(`Regulation "${regulationId}" not found`);
    if (!regulation.vgcPastesGid) throw new NotFoundException(`No VGCPastes GID configured for "${regulationId}"`);
    return this.vgcPastesService.refreshRegulation(regulationId, regulation.vgcPastesGid);
  }

  // â”€â”€â”€ Limitless â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async importLimitlessTournament(dto: AddLimitlessTournamentDto) {
    return this.limitlessService.importTournament(dto.url);
  }

  async getLimitlessUsage(tournamentId: number) {
    return this.limitlessService.getUsageList(tournamentId);
  }

  async listLimitlessTournaments() {
    return this.limitlessService.listTournaments();
  }
}
