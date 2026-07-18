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
  Req,
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
import { Request } from 'express';
import { GameOrUserAuthGuard } from '@api/_utils/guards/game-or-user-auth.guard';
import { resolveActor } from '@api/_utils/auth/actor';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { ActorBodyDto } from '../_shared/dto/actor-body.dto';
import { resolvePageSize } from '../_shared/dto/paged-query.dto';
import { EventosService } from './eventos.service';
import {
  CreateEventoDto,
  UpdateEventoDto,
  ListEventosQueryDto,
  CreateObraDto,
  UpdateObraDto,
  VoteObraDto,
  CreateEspecieDto,
  UpdateEspecieDto,
  RegisterCapturaDto,
  ListCapturasQueryDto,
} from './dto/eventos.dto';
import {
  GobiernoEventoEntity,
  GobiernoEventoObraEntity,
  GobiernoEventoObraListEntity,
  GobiernoEventoEspecieEntity,
  GobiernoEventoEspecieListEntity,
  GobiernoEventoCapturaEntity,
  GobiernoEventoCapturasResponseEntity,
} from './entities/eventos.entity';

@ApiTags('SmartRotom | Gobierno | Eventos')
@Controller('smartrotom/gobierno/eventos')
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  // ==================== EVENTOS ====================

  @Get()
  @Public()
  @ApiOperation({ summary: 'List eventos' })
  @ApiResponse({ status: HttpStatus.OK, type: [GobiernoEventoEntity] })
  async listEventos(
    @Query() query: ListEventosQueryDto,
  ): Promise<GobiernoEventoEntity[]> {
    return this.eventosService.listEventos(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get an evento by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoEventoEntity })
  async getEvento(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GobiernoEventoEntity> {
    return this.eventosService.getEvento(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an evento (construccion or caza)' })
  @ApiBody({ type: CreateEventoDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: GobiernoEventoEntity })
  async createEvento(
    @Body() dto: CreateEventoDto,
  ): Promise<GobiernoEventoEntity> {
    return this.eventosService.createEvento(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an evento' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateEventoDto })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoEventoEntity })
  async updateEvento(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventoDto,
  ): Promise<GobiernoEventoEntity> {
    return this.eventosService.updateEvento(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an evento' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: ActorBodyDto })
  @ApiResponse({ status: HttpStatus.OK })
  async deleteEvento(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActorBodyDto,
  ): Promise<{ success: boolean }> {
    return this.eventosService.deleteEvento(id, dto.actorUuid);
  }

  // ==================== OBRAS (construccion) ====================

  @Get(':id/obras')
  @Public()
  @ApiOperation({
    summary:
      'List obras for a construccion evento, with derived vote aggregates',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoEventoObraListEntity })
  async listObras(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page = 1,
    @Query('pageSize') pageSize?: string,
    @Query('limit') limit = 20,
  ): Promise<GobiernoEventoObraListEntity> {
    return this.eventosService.listObras(
      id,
      Number(page),
      Number(pageSize ?? limit),
    );
  }

  @Post(':id/obras')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit an obra to a construccion evento' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: CreateObraDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: GobiernoEventoObraEntity })
  async createObra(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateObraDto,
  ): Promise<GobiernoEventoObraEntity> {
    return this.eventosService.createObra(id, dto);
  }

  @Get('obras/:obraId')
  @Public()
  @ApiOperation({ summary: 'Get an obra by id, with derived vote aggregates' })
  @ApiParam({ name: 'obraId', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoEventoObraEntity })
  async getObra(
    @Param('obraId', ParseIntPipe) obraId: number,
  ): Promise<GobiernoEventoObraEntity> {
    return this.eventosService.getObra(obraId);
  }

  @Patch('obras/:obraId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an obra' })
  @ApiParam({ name: 'obraId', type: Number })
  @ApiBody({ type: UpdateObraDto })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoEventoObraEntity })
  async updateObra(
    @Param('obraId', ParseIntPipe) obraId: number,
    @Body() dto: UpdateObraDto,
  ): Promise<GobiernoEventoObraEntity> {
    return this.eventosService.updateObra(obraId, dto);
  }

  @Delete('obras/:obraId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an obra' })
  @ApiParam({ name: 'obraId', type: Number })
  @ApiBody({ type: ActorBodyDto })
  @ApiResponse({ status: HttpStatus.OK })
  async deleteObra(
    @Param('obraId', ParseIntPipe) obraId: number,
    @Body() dto: ActorBodyDto,
  ): Promise<{ success: boolean }> {
    return this.eventosService.deleteObra(obraId, dto.actorUuid);
  }

  @Post('obras/:obraId/voto')
  @Public()
  @UseGuards(GameOrUserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cast (or replace) a vote on an obra — one per player, upserted',
  })
  @ApiParam({ name: 'obraId', type: Number })
  @ApiBody({ type: VoteObraDto })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoEventoObraEntity })
  async voteObra(
    @Param('obraId', ParseIntPipe) obraId: number,
    @Body() dto: VoteObraDto,
    @Req() req: Request,
  ): Promise<GobiernoEventoObraEntity> {
    return this.eventosService.voteObra(obraId, dto, resolveActor(req));
  }

  // ==================== ESPECIES (caza) ====================

  @Get(':id/especies')
  @Public()
  @ApiOperation({
    summary: 'List the public spawn/scoring species table for a caza evento',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoEventoEspecieListEntity })
  async listEspecies(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page = 1,
    @Query('pageSize') pageSize?: string,
    @Query('limit') limit = 20,
  ): Promise<GobiernoEventoEspecieListEntity> {
    return this.eventosService.listEspecies(
      id,
      Number(page),
      Number(pageSize ?? limit),
    );
  }

  @Post(':id/especies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a species to a caza evento' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: CreateEspecieDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: GobiernoEventoEspecieEntity,
  })
  async createEspecie(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateEspecieDto,
  ): Promise<GobiernoEventoEspecieEntity> {
    return this.eventosService.createEspecie(id, dto);
  }

  @Patch('especies/:especieId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a species' })
  @ApiParam({ name: 'especieId', type: Number })
  @ApiBody({ type: UpdateEspecieDto })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoEventoEspecieEntity })
  async updateEspecie(
    @Param('especieId', ParseIntPipe) especieId: number,
    @Body() dto: UpdateEspecieDto,
  ): Promise<GobiernoEventoEspecieEntity> {
    return this.eventosService.updateEspecie(especieId, dto);
  }

  @Delete('especies/:especieId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a species' })
  @ApiParam({ name: 'especieId', type: Number })
  @ApiBody({ type: ActorBodyDto })
  @ApiResponse({ status: HttpStatus.OK })
  async deleteEspecie(
    @Param('especieId', ParseIntPipe) especieId: number,
    @Body() dto: ActorBodyDto,
  ): Promise<{ success: boolean }> {
    return this.eventosService.deleteEspecie(especieId, dto.actorUuid);
  }

  // ==================== CAPTURAS (caza) ====================

  @Post(':id/captura')
  @Public()
  @UseGuards(GameOrUserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Register (or replace) the caller's capture for a caza evento",
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: RegisterCapturaDto })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoEventoCapturaEntity })
  async registerCaptura(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegisterCapturaDto,
    @Req() req: Request,
  ): Promise<GobiernoEventoCapturaEntity> {
    return this.eventosService.registerCaptura(id, dto, resolveActor(req));
  }

  @Get(':id/captura/:uuid')
  @Public()
  @ApiOperation({
    summary: "Get a single player's own capture (safe while the hunt is blind)",
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiParam({ name: 'uuid', type: String })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoEventoCapturaEntity })
  async getOwnCaptura(
    @Param('id', ParseIntPipe) id: number,
    @Param('uuid') uuid: string,
  ): Promise<GobiernoEventoCapturaEntity | null> {
    return this.eventosService.getOwnCaptura(id, uuid);
  }

  @Get(':id/capturas')
  @Public()
  @ApiOperation({
    summary:
      'List captures. While live, only aggregate counts are returned — rows are withheld until the hunt closes.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    type: GobiernoEventoCapturasResponseEntity,
  })
  async listCapturas(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ListCapturasQueryDto,
  ): Promise<GobiernoEventoCapturasResponseEntity> {
    return this.eventosService.listCapturas(
      id,
      query.page ?? 1,
      resolvePageSize(query),
    );
  }
}
