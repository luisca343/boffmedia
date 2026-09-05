import { Controller, Get, HttpStatus, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@api/_utils/decorators/public.decorator';
import { PasaporteService } from './pasaporte.service';
import { TrainerParamsDto } from './dto/pasaporte.dto';
import {
  PasaporteLogroEntity,
  PasaporteProfileEntity,
  PasaporteSeasonEntity,
} from './entities/pasaporte.entity';

@ApiTags('SmartRotom | Pasaporte')
@Public()
@Controller('smartrotom/pasaporte')
export class PasaporteController {
  constructor(private readonly pasaporteService: PasaporteService) {}

  // ownership-review: the trainer carne is public by design - it is the card other
  // players look at. What needs a decision is the SIDE EFFECT: this route
  // provisions the passport on first read, so an anonymous GET performs a write
  // for an arbitrary uuid. AWAITING OWNER DECISION: provision on an authenticated
  // read only, or keep it. See scripts/check-ownership-routes.mjs REVIEW_ALLOWLIST.
  @Get('profile/:uuid')
  @ApiOperation({
    summary:
      'The carné. Provisions the passport on first read (deterministic trainer id, region from the world). ' +
      'rank / title / completionPct are derived from achievements on every read — never stored.',
  })
  @ApiParam({ name: 'uuid', description: "The trainer's UUID" })
  @ApiResponse({ status: HttpStatus.OK, type: PasaporteProfileEntity })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'No such trainer' })
  async getProfile(
    @Param() params: TrainerParamsDto,
  ): Promise<PasaporteProfileEntity> {
    return this.pasaporteService.getProfile(
      params.uuid,
    ) as unknown as Promise<PasaporteProfileEntity>;
  }

  // ownership-ok: public by design - it reports each achievement's global rarity %,
  // so it is built around cross-player aggregation.
  @Get('logros/:uuid')
  @ApiOperation({
    summary:
      'Every achievement (locked and unlocked) with this trainer’s progress, its points/tier and a REAL rarity ' +
      '(% of players who completed it). Ordered by category, then order.',
  })
  @ApiParam({ name: 'uuid', description: "The trainer's UUID" })
  @ApiResponse({ status: HttpStatus.OK, type: [PasaporteLogroEntity] })
  async getLogros(
    @Param() params: TrainerParamsDto,
  ): Promise<PasaporteLogroEntity[]> {
    return this.pasaporteService.getLogros(params.uuid) as unknown as Promise<
      PasaporteLogroEntity[]
    >;
  }

  // ownership-ok: public by design - derived entirely from replays, which are
  // themselves public.
  @Get('season/:uuid')
  @ApiOperation({
    summary:
      'The active cycle plus this trainer’s standing, derived entirely from rotom_replays inside the season ' +
      'window — there is no LP table. Returns season:null and a zeroed standing between cycles.',
  })
  @ApiParam({ name: 'uuid', description: "The trainer's UUID" })
  @ApiResponse({ status: HttpStatus.OK, type: PasaporteSeasonEntity })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'No such trainer' })
  async getSeason(
    @Param() params: TrainerParamsDto,
  ): Promise<PasaporteSeasonEntity> {
    return this.pasaporteService.getSeason(
      params.uuid,
    ) as unknown as Promise<PasaporteSeasonEntity>;
  }
}
