import { Controller, Get, Post, Sse } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PtcgpService } from './ptcgp.service';

@ApiTags('/herramientas/ptcgp')
@Controller('/herramientas/ptcgp')
export class PtcgpController {
    constructor(private ptcgpService: PtcgpService) {}

    @Get("/serebii")
    @ApiOperation({ summary: 'Get data from Serebii' })
    @ApiResponse({ status: 200, description: 'Data from Serebii found successfully.' })
    @ApiResponse({ status: 500, description: 'Failed to find data from Serebii.' })
    async getFromSerebii() {
        return this.ptcgpService.getSets();
    }

    @Post("/fetch")
    @ApiOperation({ summary: 'Manually trigger data fetch from Serebii' })
    @ApiResponse({ status: 200, description: 'Fetch operation started successfully.' })
    @ApiResponse({ status: 500, description: 'Failed to start fetch operation.' })
    async triggerFetch() {
        return this.ptcgpService.startFetch();
    }

    @Sse('fetch-status')
    @ApiOperation({ summary: 'Get real-time updates on fetch status' })
    fetchStatus(): Observable<MessageEvent> {
        return this.ptcgpService.getFetchStatus().pipe(
            map(statusData => {
                return {
                    data: JSON.stringify(statusData),
                    type: 'message',
                    lastEventId: '',
                    origin: '',
                } as MessageEvent;
            })
        );
    }


    @Get("boosterpacks")
    @ApiOperation({ summary: 'Get all booster packs' })
    @ApiResponse({ status: 200, description: 'Booster packs found successfully.' })
    @ApiResponse({ status: 500, description: 'Failed to find booster packs.' })
    async getCollections() {
        return this.ptcgpService.getBoosterPacks();
    }

    @Get("cards")
    @ApiOperation({ summary: 'Get all cards' })
    @ApiResponse({ status: 200, description: 'Cards found successfully.' })
    @ApiResponse({ status: 500, description: 'Failed to find cards.' })
    async getCards() {
        return this.ptcgpService.getCards();
    }
}