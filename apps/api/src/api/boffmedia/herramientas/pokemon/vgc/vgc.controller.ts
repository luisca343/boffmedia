import { Controller, Get, NotFoundException, Param, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { VgcService, VgcPokemon, SpeedTierEntry } from './vgc.service';
import { CHAMPIONS_REGULATIONS, ChampionsRegulation } from './champions-data';

@ApiTags('BoffMedia 🛠 | Pokémon VGC')
@Controller('tools/vgc')
@UseInterceptors(ResponseInterceptor)
export class VgcController {
  constructor(private readonly vgcService: VgcService) {}

  @Get('champions/regulations')
  @ApiOperation({
    summary: 'List Champions mod regulations',
    description:
      'Returns all supported Champions regulations. ' +
      'Each entry includes the `formatId` which can be passed directly to ' +
      '`/formats/:formatId/pokemon` or `/formats/:formatId/speed-tiers`, ' +
      'or use the shorthand `:regulationId` in the Champions-specific endpoints below.',
  })
  @ApiResponse({ status: 200, description: 'Regulations retrieved successfully.' })
  getChampionsRegulations(): ChampionsRegulation[] {
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
  getChampionsLegalPokemon(@Param('regulationId') regulationId: string): VgcPokemon[] {
    const regulation = CHAMPIONS_REGULATIONS[regulationId];
    if (!regulation) {
      throw new NotFoundException(
        `Champions regulation "${regulationId}" not found. ` +
        `Available: ${Object.keys(CHAMPIONS_REGULATIONS).join(', ')}`,
      );
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
  getChampionsSpeedTiers(@Param('regulationId') regulationId: string): SpeedTierEntry[] {
    const regulation = CHAMPIONS_REGULATIONS[regulationId];
    if (!regulation) {
      throw new NotFoundException(
        `Champions regulation "${regulationId}" not found. ` +
        `Available: ${Object.keys(CHAMPIONS_REGULATIONS).join(', ')}`,
      );
    }
    return this.vgcService.getSpeedTiers(regulation.formatId);
  }
}
