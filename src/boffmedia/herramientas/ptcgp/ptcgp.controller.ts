import { Body, Controller, Get, Param, Post, Req, Sse } from '@nestjs/common';
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

    @Get("cards/:pack")
    @ApiOperation({ summary: 'Get card by ID' })
    @ApiResponse({ status: 200, description: 'Card found successfully.' })
    @ApiResponse({ status: 500, description: 'Failed to find card.' })
    async getCard(@Param('pack') pack: string, @Param('number') number: number) {
        return this.ptcgpService.getCards(pack);
    }

    @Get("cards/:pack/:number")
    @ApiOperation({ summary: 'Get card by ID' })
    @ApiResponse({ status: 200, description: 'Card found successfully.' })
    @ApiResponse({ status: 500, description: 'Failed to find card.' })
    async getCardByNumber(@Param('pack') pack: string, @Param('number') number: number) {
        return this.ptcgpService.getCard(pack, number);
    }

    @Post("user-cards")
    @ApiOperation({ summary: 'Get all cards for the authenticated user' })
    @ApiResponse({ status: 200, description: 'User cards found successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 500, description: 'Failed to find user cards.' })
    async getUserCards(@Body() user: { username: string }) {
        return await this.ptcgpService.getUserCards(user.username);
    }

    @Post("update-cards")
    @ApiOperation({ summary: 'Update multiple cards in the user\'s collection' })
    @ApiResponse({ status: 200, description: 'Cards updated successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 500, description: 'Failed to update cards.' })
    async updateUserCards(@Body() updateData: { username: string, updates: { expansion: string, cardNumber: number, packId: string, change: number }[] }) {
        console.log('Updating cards for user:', updateData);
        return this.ptcgpService.batchUpdateUserCards(updateData.username, updateData.updates);
    }
}