import { Body, Controller, Get, HttpStatus, Param, Put } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '@api/_utils/decorators/public.decorator';
import { PcMarksService } from './services/pc-marks.service';
import { PcMark } from './entities/pc-mark.entity';
import { BulkUpsertPcMarksDto, UpsertPcMarkDto } from './dto/pc-mark.dto';

@ApiTags('SmartRotom | PC')
@Public()
@Controller('smartrotom/pc-marks')
export class PcMarksController {
  constructor(private readonly pcMarksService: PcMarksService) {}

  @Get(':uuid')
  @ApiOperation({ summary: 'Get all PC marks (favourites + tags) for a user' })
  @ApiParam({
    name: 'uuid',
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Marks retrieved successfully.',
    type: PcMark,
    isArray: true,
  })
  async getMarks(@Param('uuid') uuid: string): Promise<PcMark[]> {
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
  async bulkUpsert(@Body() data: BulkUpsertPcMarksDto): Promise<PcMark[]> {
    return this.pcMarksService.bulkUpsert(data);
  }

  @Put()
  @ApiOperation({ summary: 'Upsert a single PC mark' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mark upserted successfully.',
    type: PcMark,
  })
  @ApiBody({ type: UpsertPcMarkDto })
  async upsertMark(@Body() data: UpsertPcMarkDto): Promise<PcMark> {
    return this.pcMarksService.upsertMark(data);
  }
}
