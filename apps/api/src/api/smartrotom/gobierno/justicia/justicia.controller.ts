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
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '@api/_utils/decorators/public.decorator';
import { ActorBodyDto } from '../_shared/dto/actor-body.dto';
import { JusticiaService } from './justicia.service';
import {
  CreateExpedienteDto,
  UpdateExpedienteDto,
  ListExpedientesQueryDto,
  CreateExpedienteEventoDto,
  CreateApelacionDto,
  UpdateApelacionDto,
  ResolveApelacionDto,
  ListApelacionesQueryDto,
} from './dto/justicia.dto';
import {
  GobiernoExpedienteEntity,
  GobiernoExpedienteListEntity,
  GobiernoExpedienteEventoListEntity,
  GobiernoApelacionEntity,
  GobiernoApelacionListEntity,
} from './entities/justicia.entity';

@ApiTags('SmartRotom | Gobierno | Justicia')
@Public()
@Controller('smartrotom/gobierno/justicia')
export class JusticiaController {
  constructor(private readonly justiciaService: JusticiaService) {}

  // ==================== EXPEDIENTES ====================

  @Get('expedientes')
  @ApiOperation({ summary: 'List expedientes' })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoExpedienteListEntity })
  async listExpedientes(
    @Query() query: ListExpedientesQueryDto,
  ): Promise<GobiernoExpedienteListEntity> {
    return this.justiciaService.listExpedientes(query);
  }

  @Get('expedientes/:id')
  @ApiOperation({ summary: 'Get an expediente by id, with its timeline' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoExpedienteEntity })
  async getExpediente(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GobiernoExpedienteEntity> {
    return this.justiciaService.getExpediente(id);
  }

  @Post('expedientes')
  @ApiOperation({ summary: 'Open an expediente' })
  @ApiBody({ type: CreateExpedienteDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: GobiernoExpedienteEntity })
  async createExpediente(
    @Body() dto: CreateExpedienteDto,
  ): Promise<GobiernoExpedienteEntity> {
    return this.justiciaService.createExpediente(dto);
  }

  @Patch('expedientes/:id')
  @ApiOperation({ summary: 'Update an expediente' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateExpedienteDto })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoExpedienteEntity })
  async updateExpediente(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExpedienteDto,
  ): Promise<GobiernoExpedienteEntity> {
    return this.justiciaService.updateExpediente(id, dto);
  }

  @Delete('expedientes/:id')
  @ApiOperation({ summary: 'Delete an expediente' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: ActorBodyDto })
  @ApiResponse({ status: HttpStatus.OK })
  async deleteExpediente(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActorBodyDto,
  ): Promise<{ success: boolean }> {
    return this.justiciaService.deleteExpediente(id, dto.actorUuid);
  }

  @Get('expedientes/:id/eventos')
  @ApiOperation({ summary: 'List timeline events for an expediente' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    type: GobiernoExpedienteEventoListEntity,
  })
  async listTimeline(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page = 1,
    @Query('pageSize') pageSize?: string,
    @Query('limit') limit = 20,
  ): Promise<GobiernoExpedienteEventoListEntity> {
    return this.justiciaService.listTimeline(
      id,
      Number(page),
      Number(pageSize ?? limit),
    );
  }

  @Post('expedientes/:id/eventos')
  @ApiOperation({ summary: 'Append a timeline event to an expediente' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: CreateExpedienteEventoDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: GobiernoExpedienteEventoListEntity,
  })
  async appendTimeline(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateExpedienteEventoDto,
  ): Promise<GobiernoExpedienteEventoListEntity> {
    return this.justiciaService.appendTimeline(id, dto);
  }

  // ==================== APELACIONES ====================

  @Get('apelaciones')
  @ApiOperation({ summary: 'List apelaciones' })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoApelacionListEntity })
  async listApelaciones(
    @Query() query: ListApelacionesQueryDto,
  ): Promise<GobiernoApelacionListEntity> {
    return this.justiciaService.listApelaciones(query);
  }

  @Get('apelaciones/:id')
  @ApiOperation({ summary: 'Get an apelacion by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoApelacionEntity })
  async getApelacion(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GobiernoApelacionEntity> {
    return this.justiciaService.getApelacion(id);
  }

  @Post('apelaciones')
  @ApiOperation({ summary: 'File an apelacion against a multa' })
  @ApiBody({ type: CreateApelacionDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: GobiernoApelacionEntity })
  async createApelacion(
    @Body() dto: CreateApelacionDto,
  ): Promise<GobiernoApelacionEntity> {
    return this.justiciaService.createApelacion(dto);
  }

  @Patch('apelaciones/:id')
  @ApiOperation({ summary: 'Update an unresolved apelacion' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateApelacionDto })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoApelacionEntity })
  async updateApelacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateApelacionDto,
  ): Promise<GobiernoApelacionEntity> {
    return this.justiciaService.updateApelacion(id, dto);
  }

  @Delete('apelaciones/:id')
  @ApiOperation({ summary: 'Delete an apelacion' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: ActorBodyDto })
  @ApiResponse({ status: HttpStatus.OK })
  async deleteApelacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActorBodyDto,
  ): Promise<{ success: boolean }> {
    return this.justiciaService.deleteApelacion(id, dto.actorUuid);
  }

  @Post('apelaciones/:id/resolve')
  @ApiOperation({
    summary:
      'Resolve an apelacion. Overturning an already-paid multa refunds the payer out of the treasury.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: ResolveApelacionDto })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoApelacionEntity })
  async resolveApelacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolveApelacionDto,
  ): Promise<GobiernoApelacionEntity> {
    return this.justiciaService.resolveApelacion(id, dto);
  }
}
