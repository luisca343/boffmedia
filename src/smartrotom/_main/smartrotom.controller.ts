
import axios from 'axios';
import { NpcImageDto } from '../_dto/npc-image-dto';
import { SmartrotomService } from './smartrotom.service';
import { UuidDto } from '../_dto/smartrotom-request-dto';
import { ResponseService } from '@/response/response.service';
import { BattleAchievementDto } from '../_dto/battle-achievement-dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Body, Controller, Get, Param, Post, HttpException, HttpStatus, Logger } from '@nestjs/common';

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

@ApiTags('smartrotom')
@Controller('smartrotom')
export class SmartrotomController {
  
  private readonly logger = new Logger(SmartrotomController.name);

  constructor(
    private smartrotomService: SmartrotomService,
    private readonly responseService: ResponseService,
  ) {}

  @Get('performance')
  @ApiOperation({ summary: 'Get performance' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Performance retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve performance.' })
  async getPerformance() {
    const performance = await this.smartrotomService.getPerformance();
    return {
      data: performance,
      statusCode: 200,
      message: 'Performance retrieved successfully',
    }
  }

  @Post('/karts/carrera')
  @ApiOperation({ summary: 'Finalizar carrera' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Carrera finalizada exitosamente.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Error al finalizar la carrera.' })
  async finalizarCarrera(@Body() resultadoCarreraDto: ResultadoCarreraDto) {
    try {
      // Process the race result
      const result = await this.smartrotomService.processRaceResult(resultadoCarreraDto);
      return {
        data: result,
        statusCode: 200,
        message: 'Carrera finalizada exitosamente',
      };
    } catch (error) {
      this.logger.error('Error al finalizar la carrera:', error);
      throw new HttpException('Error al finalizar la carrera', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
