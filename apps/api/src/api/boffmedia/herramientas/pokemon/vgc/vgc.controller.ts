import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { Public } from '@api/_utils/decorators/public.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { VgcService, VgcPokemon, SpeedTierEntry } from './vgc.service';
import {
  Gen9DataDto,
  SpeedTierEntryDto,
  VgcPokemonDto,
} from './dto/vgc-response.dto';

@ApiTags('BoffMedia 🛠 | Pokémon VGC')
@Public()
@Controller('tools/vgc')
export class VgcController {
  constructor(private readonly vgcService: VgcService) {}

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
  @ApiResponse({
    status: 200,
    description: 'Legal Pokémon retrieved successfully.',
    type: VgcPokemonDto,
    isArray: true,
  })
  async getChampionsLegalPokemon(
    @Param('regulationId') regulationId: string,
  ): Promise<VgcPokemon[]> {
    const regulation = await this.vgcService.getRegulationById(regulationId);
    if (!regulation) {
      throw new NotFoundException(
        `Champions regulation "${regulationId}" not found.`,
      );
    }
    return this.vgcService.getLegalPokemon(regulation.formatId);
  }

  @Get('champions/:regulationId/game-data')
  @ApiOperation({
    summary:
      'Get game data (moves, items, abilities) for a Champions regulation',
    description:
      'Returns moves, items, and abilities valid for the given regulation. ' +
      "Uses Dex.forFormat() so the regulation's ban list is respected. Cached per formatId.",
  })
  @ApiParam({
    name: 'regulationId',
    description: 'Champions regulation shorthand ID',
    example: 'vgc2026regma',
  })
  @ApiResponse({
    status: 200,
    description: 'Game data retrieved successfully.',
    type: Gen9DataDto,
  })
  async getChampionsGameData(@Param('regulationId') regulationId: string) {
    const regulation = await this.vgcService.getRegulationById(regulationId);
    if (!regulation) {
      throw new NotFoundException(
        `Champions regulation "${regulationId}" not found.`,
      );
    }
    return this.vgcService.getChampionsGameData(regulation.formatId);
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
  @ApiResponse({
    status: 200,
    description: 'Speed tiers retrieved successfully.',
    type: SpeedTierEntryDto,
    isArray: true,
  })
  async getChampionsSpeedTiers(
    @Param('regulationId') regulationId: string,
  ): Promise<SpeedTierEntry[]> {
    const regulation = await this.vgcService.getRegulationById(regulationId);
    if (!regulation) {
      throw new NotFoundException(
        `Champions regulation "${regulationId}" not found.`,
      );
    }
    return this.vgcService.getSpeedTiers(regulation.formatId);
  }
}
