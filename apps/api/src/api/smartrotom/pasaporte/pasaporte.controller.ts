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
