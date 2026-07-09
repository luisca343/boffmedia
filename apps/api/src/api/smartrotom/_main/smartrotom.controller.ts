import { SmartrotomService } from './smartrotom.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  Post,
  HttpStatus,
} from '@nestjs/common';
import { TeleportPlayerDto } from '../_dto/teleport-player.dto';
import { WingullFacadeService } from '../wingull/wingull.facade.service';
import { ArceuSpeakEntity } from './entities/arceuspeak.entity';
import { ArceusspeakDto } from '../_dto/arceuspeak.dto';

export class ParticipanteCarreraDto {
  uuid: string;
  nombre: string;
  posicion: number;
  tiempo: number;
}

export class ResultadoCarreraDto {
  fecha: number;
  circuito: string;
  participantes: ParticipanteCarreraDto[];
}

@ApiTags('Smartrotom')
@Controller('smartrotom')
export class SmartrotomController {
  constructor(
    private smartrotomService: SmartrotomService,
    private wingullService: WingullFacadeService,
  ) {}

  @Get('performance')
  @ApiOperation({ summary: 'Get performance' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve performance.',
  })
  async getPerformance() {
    return await this.wingullService.getPerformance();
  }

  @Post('/karts/carrera')
  @ApiOperation({ summary: 'Finalizar carrera' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Carrera finalizada exitosamente.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Error al finalizar la carrera.',
  })
  async finalizarCarrera(@Body() resultadoCarreraDto: ResultadoCarreraDto) {
    return await this.smartrotomService.processRaceResult(resultadoCarreraDto);
  }

  @Get('arceuspeak')
  @ApiOperation({ summary: 'Get Arceuspeak available characters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Characters retrieved successfully.',
    type: ArceuSpeakEntity,
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve characters.',
  })
  async getArceuspeak() {
    return await this.smartrotomService.getArceuspeak();
  }

  @Post('arceuspeak')
  @ApiOperation({ summary: 'Create or update Arceuspeak character' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Character created or updated successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to create or update character.',
  })
  async createOrUpdateArceuspeak(
    @Body() { name, value, format }: ArceusspeakDto,
  ) {
    return await this.smartrotomService.createOrUpdateArceuspeak(
      name,
      value,
      format,
    );
  }

  @Get('taxi/stops')
  @ApiOperation({ summary: 'Get all taxi stops' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Taxi stops retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve taxi stops.',
  })
  async getTaxiStops() {
    return await this.wingullService.getTaxiStops();
  }

  @Post('taxi/teleport')
  @ApiOperation({ summary: 'Teleport a player to a destination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Player teleported successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to teleport player.',
  })
  async teleportPlayer(@Body() body: TeleportPlayerDto) {
    const result = await this.wingullService.teleportPlayer(body.id, body.uuid);
    return { success: result };
  }
}
