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
@Public()
@Controller('smartrotom/gobierno/hacienda')
export class HaciendaController {
  constructor(private readonly haciendaService: HaciendaService) {}

  // ==================== MULTAS ====================

  @Get('multas')
  @ApiOperation({ summary: 'List multas' })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoMultaListEntity })
  async listMultas(
    @Query() query: ListMultasQueryDto,
  ): Promise<GobiernoMultaListEntity> {
    return this.haciendaService.listMultas(query);
  }

  @Get('multas/:id')
  @ApiOperation({ summary: 'Get a multa by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoMultaEntity })
  async getMulta(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GobiernoMultaEntity> {
    return this.haciendaService.getMulta(id);
  }

  @Post('multas')
  @ApiOperation({ summary: 'Issue a multa' })
  @ApiBody({ type: CreateMultaDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: GobiernoMultaEntity })
  async createMulta(@Body() dto: CreateMultaDto): Promise<GobiernoMultaEntity> {
    return this.haciendaService.createMulta(dto);
  }

  @Patch('multas/:id')
  @ApiOperation({ summary: 'Update a pending multa' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateMultaDto })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoMultaEntity })
  async updateMulta(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMultaDto,
  ): Promise<GobiernoMultaEntity> {
    return this.haciendaService.updateMulta(id, dto);
  }

  @Delete('multas/:id')
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
  @ApiOperation({
    summary: "Pay a multa from the player's main account into the treasury",
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: PayMultaDto })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoMultaEntity })
  async payMulta(
    @Param('id', ParseIntPipe) id: number,
    @Body() _dto: PayMultaDto,
  ): Promise<GobiernoMultaEntity> {
    return this.haciendaService.payMulta(id);
  }

  @Patch('multas/:id/cancel')
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
  @ApiOperation({ summary: 'List the rate card' })
  @ApiResponse({ status: HttpStatus.OK, type: [GobiernoTasaEntity] })
  async listTasas(
    @Query() query: ListTasasQueryDto,
  ): Promise<GobiernoTasaEntity[]> {
    return this.haciendaService.listTasas(query);
  }

  @Get('tasas/:id')
  @ApiOperation({ summary: 'Get a tasa by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: GobiernoTasaEntity })
  async getTasa(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GobiernoTasaEntity> {
    return this.haciendaService.getTasa(id);
  }

  @Post('tasas')
  @ApiOperation({ summary: 'Create a rate-card entry' })
  @ApiBody({ type: CreateTasaDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: GobiernoTasaEntity })
  async createTasa(@Body() dto: CreateTasaDto): Promise<GobiernoTasaEntity> {
    return this.haciendaService.createTasa(dto);
  }

  @Patch('tasas/:id')
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
