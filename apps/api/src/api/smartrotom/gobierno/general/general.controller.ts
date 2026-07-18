import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '@api/_utils/decorators/public.decorator';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { ActorBodyDto } from '../_shared/dto/actor-body.dto';
import { ListAuditoriaQueryDto } from '../_shared/dto/list-auditoria-query.dto';
import { GobiernoAuditoriaListEntity } from '../_shared/entities/auditoria.entity';
import { GobiernoCountersEntity } from '../_shared/entities/counters.entity';
import { GeneralService } from './general.service';
import {
  CreateAnuncioDto,
  UpdateAnuncioDto,
  ListAnunciosQueryDto,
} from './dto/anuncios.dto';
import {
  GobiernoAnuncioEntity,
  GobiernoAnuncioListEntity,
} from './entities/anuncio.entity';

@ApiTags('SmartRotom | Gobierno')
@Controller('smartrotom/gobierno')
export class GeneralController {
  constructor(private readonly generalService: GeneralService) {}

  // ==================== ANUNCIOS ====================

  @Get('anuncios')
  @Public()
  @ApiOperation({ summary: 'List anuncios' })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoAnuncioListEntity })
  async listAnuncios(
    @Query() query: ListAnunciosQueryDto,
  ): Promise<GobiernoAnuncioListEntity> {
    return this.generalService.listAnuncios(query);
  }

  @Get('anuncios/:id')
  @Public()
  @ApiOperation({ summary: 'Get an anuncio by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoAnuncioEntity })
  async getAnuncio(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GobiernoAnuncioEntity> {
    return this.generalService.getAnuncio(id);
  }

  @Post('anuncios')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish an anuncio' })
  @ApiBody({ type: CreateAnuncioDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: GobiernoAnuncioEntity })
  async createAnuncio(
    @Body() dto: CreateAnuncioDto,
  ): Promise<GobiernoAnuncioEntity> {
    return this.generalService.createAnuncio(dto);
  }

  @Patch('anuncios/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an anuncio' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateAnuncioDto })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoAnuncioEntity })
  async updateAnuncio(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAnuncioDto,
  ): Promise<GobiernoAnuncioEntity> {
    return this.generalService.updateAnuncio(id, dto);
  }

  @Delete('anuncios/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an anuncio' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: ActorBodyDto })
  @ApiResponse({ status: HttpStatus.OK })
  async deleteAnuncio(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActorBodyDto,
  ): Promise<{ success: boolean }> {
    return this.generalService.deleteAnuncio(id, dto.actorUuid);
  }

  // ==================== AUDITORIA ====================

  @Get('auditoria')
  @Public()
  @ApiOperation({ summary: 'List the append-only audit log' })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoAuditoriaListEntity })
  async listAuditoria(
    @Query() query: ListAuditoriaQueryDto,
  ): Promise<GobiernoAuditoriaListEntity> {
    return this.generalService.listAuditoria(query);
  }

  // ==================== COUNTERS ====================

  @Get('counters')
  @Public()
  @ApiOperation({
    summary: 'Pending-work counts for the sidebar badges, in one call',
  })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoCountersEntity })
  async getCounters(): Promise<GobiernoCountersEntity> {
    return this.generalService.getCounters();
  }
}
