import { Controller, Post, Body, HttpStatus, Inject } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from "@nestjs/swagger"
import { ResponseService } from "@/response/response.service"
import { UuidDto } from "../_dto/smartrotom-request-dto"
import { PlayerService } from "./player.service"

@ApiTags("smartrotom/player")
@Controller("smartrotom/player")
export class PlayerController {
    constructor(
        @Inject(PlayerService) private readonly playerService: PlayerService,
        @Inject(ResponseService) private readonly responseService: ResponseService,
    ) {}
    
    @Post('stats')
    @ApiOperation({ summary: 'Get stats for a player' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Stats retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve stats.' })
    @ApiBody({ type: UuidDto })
    async getStats(@Body() { uuid }: UuidDto) {
        const action = 'get stats';
        try {
            this.responseService.logRequest(action, { uuid });
            const stats = await this.playerService.getStats(uuid);
            this.responseService.logSuccess(action, stats);
            return this.responseService.createSuccessResponse('Stats retrieved successfully', stats);
        } catch (error) {
            this.responseService.handleError(action, error, { uuid });
        }
    }
    
    @Post('team')
    @ApiOperation({ summary: 'Get team for a player' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Team retrieved successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve team.' })
    @ApiBody({ type: UuidDto })
    async getTeam(@Body() { uuid }: UuidDto) {
        const action = 'get team';
        try {
            this.responseService.logRequest(action, { uuid });
            const team = await this.playerService.getTeam(uuid);
            this.responseService.logSuccess(action, team);
            return this.responseService.createSuccessResponse('Team retrieved successfully', team);
        } catch (error) {
            this.responseService.handleError(action, error, { uuid });
        }
    }
}

