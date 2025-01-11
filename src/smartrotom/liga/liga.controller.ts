import { Controller, Get, Param, HttpStatus, Logger } from '@nestjs/common';
import { LigaService } from './liga.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseService } from '@/response/response.service';

@ApiTags('smartrotom/liga')
@Controller('/smartrotom/liga')
export class LigaController {
  private readonly logger = new Logger(LigaController.name);

  constructor(
    private readonly ligaService: LigaService,
    private readonly responseService: ResponseService,
  ) {}

  @Get('replay/:id')
  @ApiOperation({ summary: 'Get replay by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Replay retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve replay.' })
  async getReplay(@Param('id') id: number) {
    const action = 'get replay';
    try {
      this.responseService.logRequest(action, { id });
      const replay = await this.ligaService.getReplay(id);
      this.responseService.logSuccess(action, replay);
      return this.responseService.createSuccessResponse('Replay retrieved successfully', replay);
    } catch (error) {
      this.responseService.handleError(action, error, { id });
    }
  }
}