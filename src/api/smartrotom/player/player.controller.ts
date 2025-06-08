import { Controller, Post, Body, HttpStatus, UseInterceptors } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from "@nestjs/swagger"
import { UuidDto } from "../_dto/smartrotom-request-dto"
import { WingullService } from "../wingull/wingull.service"
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor'

@ApiTags("smartrotom/player")
@Controller("smartrotom/player")
@UseInterceptors(ResponseInterceptor)
export class PlayerController {
    constructor(
        private readonly wingullService: WingullService,
    ) {}
    
    @Post('stats')
    @ApiOperation({ summary: 'Get stats for a player' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Stats retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve stats.' })
    @ApiBody({ type: UuidDto })
    async getStats(@Body() { uuid }: UuidDto) {
        return await this.wingullService.getStats(uuid);
    }
    
    @Post('team')
    @ApiOperation({ summary: 'Get team for a player' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Team retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve team.' })
    @ApiBody({ type: UuidDto })
    async getTeam(@Body() { uuid }: UuidDto) {
        return await this.wingullService.getTeam(uuid);
    }
}