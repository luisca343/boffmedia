import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { VgcMetaFacadeService } from './meta.facade.service';
import { QuerySmogonDto } from './dto/query-smogon.dto';
import { QueryChampionsDto } from './dto/query-champions.dto';
import { AddLimitlessTournamentDto } from './dto/add-limitless-tournament.dto';
import { QueryLimitlessDto } from './dto/query-limitless.dto';

@ApiTags('BoffMedia 🛠 | VGC Meta')
@Controller('tools/vgc/meta')
@UseInterceptors(ResponseInterceptor)
export class VgcMetaController {
  constructor(private readonly facade: VgcMetaFacadeService) {}

  // --- Ladder (Smogon) -------------------------------------------------------

  @Get('smogon')
  @ApiOperation({ summary: 'Get Smogon ladder usage data for a format + month' })
  @ApiResponse({ status: 200, description: 'Usage list returned.' })
  getSmogonUsage(@Query() dto: QuerySmogonDto) {
    return this.facade.getSmogonUsage(dto);
  }

  @Get('smogon/:speciesId')
  @ApiOperation({ summary: 'Get full Smogon detail panel for a single Pokemon' })
  @ApiParam({ name: 'speciesId', example: 'incineroar' })
  @ApiResponse({ status: 200, description: 'Detail panel returned.' })
  getSmogonDetail(@Param('speciesId') speciesId: string, @Query() dto: QuerySmogonDto) {
    return this.facade.getSmogonDetail({ ...dto, speciesId });
  }

  // --- Champions (VGCPastes) -------------------------------------------------

  @Get('champions')
  @ApiOperation({ summary: 'Get Champions usage data from VGCPastes' })
  @ApiResponse({ status: 200, description: 'Usage list returned.' })
  getChampionsUsage(@Query() dto: QueryChampionsDto) {
    return this.facade.getChampionsUsage(dto);
  }

  @Post('champions/refresh')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Re-fetch VGCPastes CSV and refresh Champions data' })
  @ApiResponse({ status: 201, description: 'Data refreshed.' })
  refreshChampions(@Query('regulationId') regulationId: string) {
    return this.facade.refreshChampionsData(regulationId);
  }

  // --- Limitless -------------------------------------------------------------

  @Get('limitless')
  @ApiOperation({ summary: 'List all cached Limitless tournaments' })
  @ApiResponse({ status: 200, description: 'Tournament list returned.' })
  listTournaments() {
    return this.facade.listLimitlessTournaments();
  }

  @Get('limitless/usage')
  @ApiOperation({ summary: 'Get usage data for a Limitless tournament' })
  @ApiResponse({ status: 200, description: 'Usage list returned.' })
  getLimitlessUsage(@Query() dto: QueryLimitlessDto) {
    return this.facade.getLimitlessUsage(dto.tournamentId);
  }

  @Post('limitless/tournament')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Import a Limitless tournament by URL' })
  @ApiResponse({ status: 201, description: 'Tournament import started.' })
  importTournament(@Body() dto: AddLimitlessTournamentDto) {
    return this.facade.importLimitlessTournament(dto);
  }
}
