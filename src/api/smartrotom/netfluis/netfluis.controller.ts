import { Controller, Get, HttpStatus, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NetfluisService } from './netfluis.service';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';

@ApiTags('SmartRotom | Netfluis')
@Controller('smartrotom/netfluis')
@UseInterceptors(ResponseInterceptor)
export class NetfluisController {
    constructor(private readonly netfluisService: NetfluisService) {}

    @Get("test")
    @ApiOperation({ summary: 'Test Netfluis service' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Test completed successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Test failed.' })
    async test() {
        return await this.netfluisService.test();
    }
}