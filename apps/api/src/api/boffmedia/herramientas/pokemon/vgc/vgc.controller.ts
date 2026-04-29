import { Controller, Get, NotFoundException, Param, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { VgcService, VgcPokemon, SpeedTierEntry } from './vgc.service';

@ApiTags('BoffMedia 🛠 | Pokémon VGC')
@Controller('tools/vgc')
@UseInterceptors(ResponseInterceptor)
export class VgcController {
  constructor(private readonly vgcService: VgcService) {}

  @Get('champions/regulations')
  @ApiOperation({
    summary: '[Compatibility alias] List Champions regulations',
    description:
      'Compatibility alias for `GET /tools/vgc/meta/regulations`. ' +
      'Returns all supported Champions regulations. ' +
      'Use the meta endpoint as the canonical regulation source for admin and ingestion flows.',
  })
  @ApiResponse({ status: 200, description: 'Regulations retrieved successfully.' })
  async getChampionsRegulations() {
    return this.vgcService.getChampionsRegulations();
  }

  @Get('champions/:regulationId/pokemon')
  @ApiOperation({
    summary: 'Get legal Pokémon for a Champions regulation',
    description:
      'Uses the Champions mod (ported from the official Showdown Champions mod) ' +
      'to determine the legal pool. Shorthand for calling `/formats/:formatId/pokemon` ' +
      'with the corresponding Champions format ID.',
  })
  @ApiParam({
    name: 'regulationId',
    description: 'Champions regulation shorthand ID',
    example: 'vgc2026regma',
  })
  @ApiResponse({ status: 200, description: 'Legal Pokémon retrieved successfully.' })
  async getChampionsLegalPokemon(@Param('regulationId') regulationId: string): Promise<VgcPokemon[]> {
    const regulation = await this.vgcService.getRegulationById(regulationId);
    if (!regulation) {
      throw new NotFoundException(`Champions regulation "${regulationId}" not found.`);
    }
    return this.vgcService.getLegalPokemon(regulation.formatId);
  }

  @Get('champions/:regulationId/speed-tiers')
  @ApiOperation({
    summary: 'Get speed tier chart for a Champions regulation',
    description:
      'Legal Pokémon for the regulation sorted by base Speed (desc) with pre-calculated ' +
      'Speed stats at common EV/nature/item combos at level 50.',
  })
  @ApiParam({
    name: 'regulationId',
    description: 'Champions regulation shorthand ID',
    example: 'vgc2026regma',
  })
  @ApiResponse({ status: 200, description: 'Speed tiers retrieved successfully.' })
  async getChampionsSpeedTiers(@Param('regulationId') regulationId: string): Promise<SpeedTierEntry[]> {
    const regulation = await this.vgcService.getRegulationById(regulationId);
    if (!regulation) {
      throw new NotFoundException(`Champions regulation "${regulationId}" not found.`);
    }
    return this.vgcService.getSpeedTiers(regulation.formatId);
  }
}
