import { Controller, Get, HttpStatus, Logger, Param } from '@nestjs/common';
import { ArcadeService } from './arcade.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ResponseService } from '@/response/response.service';

@ApiTags('smartrotom/arcade')
@Controller('smartrotom/arcade')
export class ArcadeController {
  private readonly logger = new Logger(ArcadeController.name);

  constructor(
    private readonly arcadeService: ArcadeService,
    private readonly responseService: ResponseService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get arcade information' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Arcade information retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve arcade information.' })
  async getArcade() {
    const action = 'get arcade information';
    try {
      this.responseService.logRequest(action, null);
      const result = "Arcade Controller";
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Arcade information retrieved successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error);
    }
  }

  @Get('wordle/:uuid')
  @ApiOperation({ summary: 'Get Wordle game' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Wordle game retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve Wordle game.' })
  async getWordle(@Param('uuid') uuid: string) {
    const action = 'get Wordle game';
    try {
      this.responseService.logRequest(action, null);
      const result = await this.arcadeService.getWordle();
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Wordle game retrieved successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error);
    }
  }
}