import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PtcgpService } from './ptcgp.service';

@ApiTags('/herramientas/ptcgp')
@Controller('/herramientas/ptcgp')
export class PtcgpController {
    constructor(private ptcgpService: PtcgpService) {}

    @Get("/serebii")
    @ApiOperation({ summary: 'Get data from Serebii' })
    @ApiResponse( { status: 200, description: 'Data from Serebii found successfully.' })
    @ApiResponse( { status: 500, description: 'Failed to find data from Serebii.' })
    async getFromSerebii() {
        return this.ptcgpService.getSets();
    }
}
