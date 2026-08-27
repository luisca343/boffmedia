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
import { HaciendaService } from './hacienda.service';
import {
  CreateMultaDto,
  UpdateMultaDto,
  ListMultasQueryDto,
  PayMultaDto,
  CancelMultaDto,
  CreateTasaDto,
  UpdateTasaDto,
  ListTasasQueryDto,
  GetTesoreriaQueryDto,
} from './dto/hacienda.dto';
import {
  GobiernoMultaEntity,
  GobiernoMultaListEntity,
  GobiernoTasaEntity,
  GobiernoTesoreriaEntity,
} from './entities/hacienda.entity';

@ApiTags('SmartRotom | Gobierno | Hacienda')
@Controller('smartrotom/gobierno/hacienda')
export class HaciendaController {
  constructor(private readonly haciendaService: HaciendaService) {}

  // ==================== MULTAS ====================

  @Get('multas')
  @Public()
  @ApiOperation({ summary: 'List multas' })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoMultaListEntity })
  async listMultas(
    @Query() query: ListMultasQueryDto,
  ): Promise<GobiernoMultaListEntity> {
    return this.haciendaService.listMultas(query);
  }

  @Get('multas/:id')
  @Public()
  @ApiOperation({ summary: 'Get a multa by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoMultaEntity })
  async getMulta(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GobiernoMultaEntity> {
    return this.haciendaService.getMulta(id);
  }

  @Post('multas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Issue a multa' })
  @ApiBody({ type: CreateMultaDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: GobiernoMultaEntity })
  async createMulta(
    @Body() dto: CreateMultaDto,
    @Req() req: Request,
  ): Promise<GobiernoMultaEntity> {
    return this.haciendaService.createMulta(dto, resolveActor(req));
  }

  @Patch('multas/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a pending multa' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateMultaDto })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoMultaEntity })
  async updateMulta(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMultaDto,
    @Req() req: Request,
  ): Promise<GobiernoMultaEntity> {
    return this.haciendaService.updateMulta(id, dto, resolveActor(req));
  }

  @Delete('multas/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a multa' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: ActorBodyDto })
  @ApiResponse({ status: HttpStatus.OK })
  async deleteMulta(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActorBodyDto,
  ): Promise<{ success: boolean }> {
    return this.haciendaService.deleteMulta(id, dto.actorUuid);
  }

  @Post('multas/:id/pay')
  @Public()
  @UseGuards(GameOrUserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Pay a multa from the player's main account into the treasury",
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: PayMultaDto })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoMultaEntity })
  async payMulta(
    @Param('id', ParseIntPipe) id: number,
    @Body() _dto: PayMultaDto,
    @Req() req: Request,
  ): Promise<GobiernoMultaEntity> {
    return this.haciendaService.payMulta(id, resolveActor(req));
  }

  @Patch('multas/:id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancel a pending multa (paid fines are refunded via apelaciones)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: CancelMultaDto })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoMultaEntity })
  async cancelMulta(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelMultaDto,
  ): Promise<GobiernoMultaEntity> {
    return this.haciendaService.cancelMulta(id, dto);
  }

  // ==================== TASAS ====================

  @Get('tasas')
  @Public()
  @ApiOperation({ summary: 'List the rate card' })
  @ApiResponse({ status: HttpStatus.OK, type: [GobiernoTasaEntity] })
  async listTasas(
    @Query() query: ListTasasQueryDto,
  ): Promise<GobiernoTasaEntity[]> {
    return this.haciendaService.listTasas(query);
  }

  @Get('tasas/:id')
  @Public()
  @ApiOperation({ summary: 'Get a tasa by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoTasaEntity })
  async getTasa(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GobiernoTasaEntity> {
    return this.haciendaService.getTasa(id);
  }

  @Post('tasas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a rate-card entry' })
  @ApiBody({ type: CreateTasaDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: GobiernoTasaEntity })
  async createTasa(@Body() dto: CreateTasaDto): Promise<GobiernoTasaEntity> {
    return this.haciendaService.createTasa(dto);
  }

  @Patch('tasas/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a rate-card entry' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateTasaDto })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoTasaEntity })
  async updateTasa(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTasaDto,
  ): Promise<GobiernoTasaEntity> {
    return this.haciendaService.updateTasa(id, dto);
  }

  @Delete('tasas/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a rate-card entry' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: ActorBodyDto })
  @ApiResponse({ status: HttpStatus.OK })
  async deleteTasa(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActorBodyDto,
  ): Promise<{ success: boolean }> {
    return this.haciendaService.deleteTasa(id, dto.actorUuid);
  }

  // ==================== TESORERIA ====================

  @Get('tesoreria')
  @Public()
  @ApiOperation({
    summary:
      'Derived treasury snapshot: balance, income/expense series and breakdown',
  })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoTesoreriaEntity })
  async getTesoreria(
    @Query() query: GetTesoreriaQueryDto,
  ): Promise<GobiernoTesoreriaEntity> {
    return this.haciendaService.getTesoreria(query.days ?? 30);
  }
}
