import { Body, Controller, Get, HttpStatus, Put } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentMcUuid } from '@api/_utils/decorators/current-user.decorator';
import { PcMarksService } from './services/pc-marks.service';
import { PcMark } from './entities/pc-mark.entity';
import { BulkUpsertPcMarksDto, UpsertPcMarkDto } from './dto/pc-mark.dto';

/**
 * PC marks (favourites + tags) are per-player data. The owner comes from the
 * session: the controller was `@Public()` and read `:uuid` from the URL / body,
 * so anyone could read or overwrite another player's marks.
 */
@ApiTags('SmartRotom | PC')
@ApiBearerAuth()
@Controller('smartrotom/pc-marks')
export class PcMarksController {
  constructor(private readonly pcMarksService: PcMarksService) {}

  @Get()
  @ApiOperation({ summary: "Get the caller's PC marks (favourites + tags)" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Marks retrieved successfully.',
    type: PcMark,
    isArray: true,
  })
  async getMarks(@CurrentMcUuid() uuid: string): Promise<PcMark[]> {
    return this.pcMarksService.getMarks(uuid);
  }

  @Put('bulk')
  @ApiOperation({ summary: 'Upsert many PC marks at once (bulk selection)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Marks upserted successfully.',
    type: PcMark,
    isArray: true,
  })
  @ApiBody({ type: BulkUpsertPcMarksDto })
  async bulkUpsert(
    @Body() data: BulkUpsertPcMarksDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<PcMark[]> {
    return this.pcMarksService.bulkUpsert(uuid, data);
  }

  @Put()
  @ApiOperation({ summary: 'Upsert a single PC mark' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mark upserted successfully.',
    type: PcMark,
  })
  @ApiBody({ type: UpsertPcMarkDto })
  async upsertMark(
    @Body() data: UpsertPcMarkDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<PcMark> {
    return this.pcMarksService.upsertMark(uuid, data);
  }
}
