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
  ApiQuery,
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
import { UrbanismoService } from './urbanismo.service';
import {
  CreateZonaDto,
  UpdateZonaDto,
  ListZonasQueryDto,
  CreateParcelaDto,
  UpdateParcelaDto,
  ListParcelasQueryDto,
  CreateParcelaHistorialDto,
  ListAllHistorialQueryDto,
  CreateSubastaDto,
  UpdateSubastaDto,
  ListSubastasQueryDto,
  PlaceBidDto,
  CloseSubastaDto,
} from './dto/urbanismo.dto';
import {
  GobiernoZonaEntity,
  GobiernoParcelaEntity,
  GobiernoParcelaListEntity,
  GobiernoParcelaHistorialListEntity,
  GobiernoSubastaEntity,
  GobiernoSubastaListEntity,
} from './entities/urbanismo.entity';

@ApiTags('SmartRotom | Gobierno | Urbanismo')
@Controller('smartrotom/gobierno/urbanismo')
export class UrbanismoController {
  constructor(private readonly urbanismoService: UrbanismoService) {}

  // ==================== ZONAS ====================

  @Get('zonas')
  @Public()
  @ApiOperation({ summary: 'List zonas' })
  @ApiResponse({ status: HttpStatus.OK, type: [GobiernoZonaEntity] })
  async listZonas(
    @Query() query: ListZonasQueryDto,
  ): Promise<GobiernoZonaEntity[]> {
    return this.urbanismoService.listZonas(query);
  }

  @Get('zonas/:id')
  @Public()
  @ApiOperation({ summary: 'Get a zona by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoZonaEntity })
  async getZona(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GobiernoZonaEntity> {
    return this.urbanismoService.getZona(id);
  }

  @Post('zonas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a zona' })
  @ApiBody({ type: CreateZonaDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: GobiernoZonaEntity })
  async createZona(@Body() dto: CreateZonaDto): Promise<GobiernoZonaEntity> {
    return this.urbanismoService.createZona(dto);
  }

  @Patch('zonas/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a zona' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateZonaDto })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoZonaEntity })
  async updateZona(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateZonaDto,
  ): Promise<GobiernoZonaEntity> {
    return this.urbanismoService.updateZona(id, dto);
  }

  @Delete('zonas/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a zona' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: ActorBodyDto })
  @ApiResponse({ status: HttpStatus.OK })
  async deleteZona(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActorBodyDto,
  ): Promise<{ success: boolean }> {
    return this.urbanismoService.deleteZona(id, dto.actorUuid);
  }

  // ==================== HISTORIAL (aggregate, all plots) ====================

  @Get('historial')
  @Public()
  @ApiOperation({
    summary:
      'Aggregate ownership-change register across every plot in Teras, newest first',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: GobiernoParcelaHistorialListEntity,
  })
  async listAllHistorial(
    @Query() query: ListAllHistorialQueryDto,
  ): Promise<GobiernoParcelaHistorialListEntity> {
    return this.urbanismoService.listAllHistorial(query);
  }

  // ==================== PARCELAS ====================

  @Get('parcelas')
  @Public()
  @ApiOperation({
    summary: 'List parcelas, enriched with the real Teras plot/owner data',
  })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoParcelaListEntity })
  async listParcelas(
    @Query() query: ListParcelasQueryDto,
  ): Promise<GobiernoParcelaListEntity> {
    return this.urbanismoService.listParcelas(query);
  }

  @Get('parcelas/:regionId')
  @Public()
  @ApiOperation({ summary: 'Get a parcela by Teras region id' })
  @ApiParam({ name: 'regionId', type: String })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoParcelaEntity })
  async getParcela(
    @Param('regionId') regionId: string,
  ): Promise<GobiernoParcelaEntity> {
    return this.urbanismoService.getParcela(regionId);
  }

  @Post('parcelas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Register or replace gobierno metadata for a Teras plot',
  })
  @ApiBody({ type: CreateParcelaDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: GobiernoParcelaEntity })
  async createParcela(
    @Body() dto: CreateParcelaDto,
  ): Promise<GobiernoParcelaEntity> {
    return this.urbanismoService.createParcela(dto);
  }

  @Patch('parcelas/:regionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update gobierno metadata for a parcela' })
  @ApiParam({ name: 'regionId', type: String })
  @ApiBody({ type: UpdateParcelaDto })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoParcelaEntity })
  async updateParcela(
    @Param('regionId') regionId: string,
    @Body() dto: UpdateParcelaDto,
  ): Promise<GobiernoParcelaEntity> {
    return this.urbanismoService.updateParcela(regionId, dto);
  }

  @Get('parcelas/:regionId/historial')
  @Public()
  @ApiOperation({ summary: 'List ownership/tax history for a parcela' })
  @ApiParam({ name: 'regionId', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number, deprecated: true })
  @ApiResponse({
    status: HttpStatus.OK,
    type: GobiernoParcelaHistorialListEntity,
  })
  async listHistorial(
    @Param('regionId') regionId: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize?: string,
    @Query('limit') limit = 20,
  ): Promise<GobiernoParcelaHistorialListEntity> {
    return this.urbanismoService.listHistorial(
      regionId,
      Number(page),
      Number(pageSize ?? limit),
    );
  }

  @Post('parcelas/:regionId/historial')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Append a historial entry for a parcela' })
  @ApiParam({ name: 'regionId', type: String })
  @ApiBody({ type: CreateParcelaHistorialDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: GobiernoParcelaHistorialListEntity,
  })
  async appendHistorial(
    @Param('regionId') regionId: string,
    @Body() dto: CreateParcelaHistorialDto,
  ): Promise<GobiernoParcelaHistorialListEntity> {
    return this.urbanismoService.appendHistorial(regionId, dto);
  }

  // ==================== SUBASTAS ====================

  @Get('subastas')
  @Public()
  @ApiOperation({ summary: 'List subastas' })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoSubastaListEntity })
  async listSubastas(
    @Query() query: ListSubastasQueryDto,
  ): Promise<GobiernoSubastaListEntity> {
    return this.urbanismoService.listSubastas(query);
  }

  @Get('subastas/:id')
  @Public()
  @ApiOperation({ summary: 'Get a subasta by id, with recent bids' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoSubastaEntity })
  async getSubasta(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GobiernoSubastaEntity> {
    return this.urbanismoService.getSubasta(id);
  }

  @Post('subastas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a subasta' })
  @ApiBody({ type: CreateSubastaDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: GobiernoSubastaEntity })
  async createSubasta(
    @Body() dto: CreateSubastaDto,
  ): Promise<GobiernoSubastaEntity> {
    return this.urbanismoService.createSubasta(dto);
  }

  @Patch('subastas/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a subasta' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateSubastaDto })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoSubastaEntity })
  async updateSubasta(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubastaDto,
  ): Promise<GobiernoSubastaEntity> {
    return this.urbanismoService.updateSubasta(id, dto);
  }

  @Delete('subastas/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a subasta' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: ActorBodyDto })
  @ApiResponse({ status: HttpStatus.OK })
  async deleteSubasta(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActorBodyDto,
  ): Promise<{ success: boolean }> {
    return this.urbanismoService.deleteSubasta(id, dto.actorUuid);
  }

  @Post('subastas/:id/puja')
  @Public()
  @UseGuards(GameOrUserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Place a bid on a subasta (must exceed the current bid)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: PlaceBidDto })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoSubastaEntity })
  async placeBid(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PlaceBidDto,
    @Req() req: Request,
  ): Promise<GobiernoSubastaEntity> {
    return this.urbanismoService.placeBid(id, dto, resolveActor(req));
  }

  @Post('subastas/:id/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Close a subasta and settle it into the treasury' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: CloseSubastaDto })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoSubastaEntity })
  async closeSubasta(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CloseSubastaDto,
  ): Promise<GobiernoSubastaEntity> {
    return this.urbanismoService.closeSubasta(id, dto.actorUuid);
  }
}
