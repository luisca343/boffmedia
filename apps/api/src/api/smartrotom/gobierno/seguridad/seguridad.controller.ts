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
import { SeguridadService } from './seguridad.service';
import {
  CreateDenunciaDto,
  UpdateDenunciaDto,
  ResolveDenunciaDto,
  ListDenunciasQueryDto,
  CreateBuscadoDto,
  UpdateBuscadoDto,
  CaptureBuscadoDto,
  ListBuscadosQueryDto,
  CreatePatrullaDto,
  UpdatePatrullaDto,
  ListPatrullasQueryDto,
  CreateBitacoraDto,
  ListBitacoraQueryDto,
} from './dto/seguridad.dto';
import {
  GobiernoDenunciaEntity,
  GobiernoDenunciaListEntity,
  GobiernoBuscadoEntity,
  GobiernoBuscadoListEntity,
  GobiernoPatrullaEntity,
  GobiernoBitacoraEntity,
} from './entities/seguridad.entity';

@ApiTags('SmartRotom | Gobierno | Seguridad')
@Controller('smartrotom/gobierno/seguridad')
export class SeguridadController {
  constructor(private readonly seguridadService: SeguridadService) {}

  // ==================== DENUNCIAS ====================

  @Get('denuncias')
  @Public()
  @ApiOperation({ summary: 'List denuncias' })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoDenunciaListEntity })
  async listDenuncias(
    @Query() query: ListDenunciasQueryDto,
  ): Promise<GobiernoDenunciaListEntity> {
    return this.seguridadService.listDenuncias(query);
  }

  @Get('denuncias/:id')
  @Public()
  @ApiOperation({ summary: 'Get a denuncia by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoDenunciaEntity })
  async getDenuncia(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GobiernoDenunciaEntity> {
    return this.seguridadService.getDenuncia(id);
  }

  @Post('denuncias')
  @Public()
  @UseGuards(GameOrUserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'File a denuncia' })
  @ApiBody({ type: CreateDenunciaDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: GobiernoDenunciaEntity })
  async createDenuncia(
    @Body() dto: CreateDenunciaDto,
    @Req() req: Request,
  ): Promise<GobiernoDenunciaEntity> {
    return this.seguridadService.createDenuncia(dto, resolveActor(req));
  }

  @Patch('denuncias/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a denuncia' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateDenunciaDto })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoDenunciaEntity })
  async updateDenuncia(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDenunciaDto,
  ): Promise<GobiernoDenunciaEntity> {
    return this.seguridadService.updateDenuncia(id, dto);
  }

  @Patch('denuncias/:id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolve or dismiss a denuncia' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: ResolveDenunciaDto })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoDenunciaEntity })
  async resolveDenuncia(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolveDenunciaDto,
  ): Promise<GobiernoDenunciaEntity> {
    return this.seguridadService.resolveDenuncia(id, dto);
  }

  @Delete('denuncias/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a denuncia' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: ActorBodyDto })
  @ApiResponse({ status: HttpStatus.OK })
  async deleteDenuncia(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActorBodyDto,
  ): Promise<{ success: boolean }> {
    return this.seguridadService.deleteDenuncia(id, dto.actorUuid);
  }

  // ==================== BUSCADOS ====================

  @Get('buscados')
  @Public()
  @ApiOperation({ summary: 'List buscados' })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoBuscadoListEntity })
  async listBuscados(
    @Query() query: ListBuscadosQueryDto,
  ): Promise<GobiernoBuscadoListEntity> {
    return this.seguridadService.listBuscados(query);
  }

  @Get('buscados/:id')
  @Public()
  @ApiOperation({ summary: 'Get a buscado by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoBuscadoEntity })
  async getBuscado(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GobiernoBuscadoEntity> {
    return this.seguridadService.getBuscado(id);
  }

  @Post('buscados')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Issue a wanted notice' })
  @ApiBody({ type: CreateBuscadoDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: GobiernoBuscadoEntity })
  async createBuscado(
    @Body() dto: CreateBuscadoDto,
  ): Promise<GobiernoBuscadoEntity> {
    return this.seguridadService.createBuscado(dto);
  }

  @Patch('buscados/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a buscado' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateBuscadoDto })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoBuscadoEntity })
  async updateBuscado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBuscadoDto,
  ): Promise<GobiernoBuscadoEntity> {
    return this.seguridadService.updateBuscado(id, dto);
  }

  @Delete('buscados/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a buscado' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: ActorBodyDto })
  @ApiResponse({ status: HttpStatus.OK })
  async deleteBuscado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActorBodyDto,
  ): Promise<{ success: boolean }> {
    return this.seguridadService.deleteBuscado(id, dto.actorUuid);
  }

  @Post('buscados/:id/capture')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Mark a buscado as captured and pay the bounty out of the treasury',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: CaptureBuscadoDto })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoBuscadoEntity })
  async captureBuscado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CaptureBuscadoDto,
  ): Promise<GobiernoBuscadoEntity> {
    return this.seguridadService.captureBuscado(id, dto);
  }

  // ==================== PATRULLAS ====================

  @Get('patrullas')
  @Public()
  @ApiOperation({ summary: 'List patrullas, with their officers' })
  @ApiResponse({ status: HttpStatus.OK, type: [GobiernoPatrullaEntity] })
  async listPatrullas(
    @Query() query: ListPatrullasQueryDto,
  ): Promise<GobiernoPatrullaEntity[]> {
    return this.seguridadService.listPatrullas(query);
  }

  @Get('patrullas/:id')
  @Public()
  @ApiOperation({ summary: 'Get a patrulla by id, with its officers' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoPatrullaEntity })
  async getPatrulla(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GobiernoPatrullaEntity> {
    return this.seguridadService.getPatrulla(id);
  }

  @Post('patrullas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a patrulla' })
  @ApiBody({ type: CreatePatrullaDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: GobiernoPatrullaEntity })
  async createPatrulla(
    @Body() dto: CreatePatrullaDto,
  ): Promise<GobiernoPatrullaEntity> {
    return this.seguridadService.createPatrulla(dto);
  }

  @Patch('patrullas/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a patrulla (officers array replaces the roster)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdatePatrullaDto })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoPatrullaEntity })
  async updatePatrulla(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePatrullaDto,
  ): Promise<GobiernoPatrullaEntity> {
    return this.seguridadService.updatePatrulla(id, dto);
  }

  @Delete('patrullas/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a patrulla' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: ActorBodyDto })
  @ApiResponse({ status: HttpStatus.OK })
  async deletePatrulla(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActorBodyDto,
  ): Promise<{ success: boolean }> {
    return this.seguridadService.deletePatrulla(id, dto.actorUuid);
  }

  // ==================== BITACORA ====================

  @Get('bitacora')
  @Public()
  @ApiOperation({ summary: 'List bitácora entries' })
  @ApiResponse({ status: HttpStatus.OK, type: [GobiernoBitacoraEntity] })
  async listBitacora(
    @Query() query: ListBitacoraQueryDto,
  ): Promise<GobiernoBitacoraEntity[]> {
    return this.seguridadService.listBitacora(query);
  }

  @Post('bitacora')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Append a bitácora entry' })
  @ApiBody({ type: CreateBitacoraDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: [GobiernoBitacoraEntity] })
  async appendBitacora(
    @Body() dto: CreateBitacoraDto,
  ): Promise<GobiernoBitacoraEntity[]> {
    return this.seguridadService.appendBitacora(dto);
  }
}
