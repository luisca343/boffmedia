
import { SmartrotomService } from './smartrotom.service';
import { ResponseService } from '@/response/response.service';
import { ApiTags, ApiOperation, ApiResponse} from '@nestjs/swagger';
import { Body, Controller, Get, Post, HttpException, HttpStatus, Logger, Headers } from '@nestjs/common';
import { TeleportPlayerDto } from '../_dto/teleport-player.dto';
import { WingullService } from '../wingull/wingull.service';

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
    private wingullService: WingullService,
    private readonly responseService: ResponseService,
  ) {}

  @Get('performance')
  @ApiOperation({ summary: 'Get performance' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Performance retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve performance.' })
  async getPerformance() {
    const performance = await this.wingullService.getPerformance();
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

  @Get('arceuspeak')
  @ApiOperation({ summary: 'Get Arceuspeak available characters' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Characters retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve characters.' })
  async getArceuspeak() {
    try {
      const characters = await this.smartrotomService.getArceuspeak();
      return {
        data: characters,
        statusCode: 200,
        message: 'Characters retrieved successfully',
      };
    } catch (error) {
      this.logger.error('Failed to retrieve characters:', error);
      throw new HttpException('Failed to retrieve characters', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('arceuspeak')
  @ApiOperation({ summary: 'Create or update Arceuspeak character' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Character created or updated successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to create or update character.' })
  async createOrUpdateArceuspeak(@Body() {name, value, format}: {name: string, value: string, format: string}) {
    try {
      const result = await this.smartrotomService.createOrUpdateArceuspeak(name, value, format);
      return {
        data: result,
        statusCode: 200,
        message: 'Character created or updated successfully',
      };
    } catch (error) {
      this.logger.error('Failed to create or update character:', error);
      throw new HttpException('Failed to create or update character', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('taxi/stops')
  @ApiOperation({ summary: 'Get all taxi stops' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Taxi stops retrieved successfully.'
  })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve taxi stops.' })
  async getTaxiStops() {
    try {
      const taxiStops = await this.wingullService.getTaxiStops();
      return {
        data: taxiStops,
        statusCode: 200,
        message: 'Taxi stops retrieved successfully',
      };
    } catch (error) {
      this.logger.error('Failed to retrieve taxi stops:', error);
      throw new HttpException('Failed to retrieve taxi stops', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('taxi/teleport')
  @ApiOperation({ summary: 'Teleport a player to a destination' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Player teleported successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to teleport player.' })
  async teleportPlayer(@Body() body: TeleportPlayerDto) {
    try {
      const result = await this.wingullService.teleportPlayer(body.id, body.uuid);
      return {
        data: { success: result },
        statusCode: 200,
        message: result ? 'Player teleported successfully' : 'Failed to teleport player',
      };
    } catch (error) {
      this.logger.error('Failed to teleport player:', error);
      throw new HttpException('Failed to teleport player', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}