import { Controller, Get, Param, HttpStatus, UseInterceptors } from '@nestjs/common';
import { LigaService } from './liga.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';

@ApiTags('smartrotom/liga')
@Controller('/smartrotom/liga')
@UseInterceptors(ResponseInterceptor)
export class LigaController {
  constructor(
    private readonly ligaService: LigaService,
  ) {}

  @Get('replay/:id')
  @ApiOperation({ summary: 'Get replay by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Replay retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve replay.' })
  async getReplay(@Param('id') id: number) {
    return await this.ligaService.getReplay(id);
  }
}