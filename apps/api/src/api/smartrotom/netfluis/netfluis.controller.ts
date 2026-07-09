import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NetfluisService } from './netfluis.service';

@ApiTags('SmartRotom | Netfluis')
@Controller('smartrotom/netfluis')
export class NetfluisController {
  constructor(private readonly netfluisService: NetfluisService) {}

  @Get('test')
  @ApiOperation({ summary: 'Test Netfluis service' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Test completed successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Test failed.',
  })
  async test() {
    return await this.netfluisService.test();
  }
}
