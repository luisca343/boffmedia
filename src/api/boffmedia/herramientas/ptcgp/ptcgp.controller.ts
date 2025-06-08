import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Query, Sse, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TgcpCardService } from './card.service';
import { TgcpUserCardService } from './user-card.service';
import { TgcpPackService } from './pack.service';
import { TgcpScraperService } from './scraper.service';
import { PtcgpBattleService } from './battle.service';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';

@ApiTags('/herramientas/ptcgp')
@Controller('/herramientas/ptcgp')
@UseInterceptors(ResponseInterceptor)
export class PtcgpController {
    constructor(
        private cardService: TgcpCardService,
        private userCardService: TgcpUserCardService,
        private packService: TgcpPackService,
        private scraperService: TgcpScraperService,
        private battleService: PtcgpBattleService
    ) {}

    @Get("/serebii")
    @ApiOperation({ summary: 'Get data from Serebii' })
    @ApiResponse({ status: 200, description: 'Data from Serebii found successfully.' })
    @ApiResponse({ status: 500, description: 'Failed to find data from Serebii.' })
    async getFromSerebii() {
        return this.scraperService.getSets();
    }

    @Post("/fetch")
    @ApiOperation({ summary: 'Manually trigger data fetch from Serebii' })
    @ApiResponse({ status: 200, description: 'Fetch operation started successfully.' })
    @ApiResponse({ status: 500, description: 'Failed to start fetch operation.' })
    async triggerFetch() {
        return this.scraperService.startFetch();
    }

    @Sse('fetch-status')
    @ApiOperation({ summary: 'Get real-time updates on fetch status' })
    fetchStatus(): Observable<MessageEvent> {
        return this.scraperService.getFetchStatus().pipe(
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
        return this.packService.getBoosterPacks();
    }

    @Get("cards")
    @ApiOperation({ summary: 'Get all cards' })
    @ApiResponse({ status: 200, description: 'Cards found successfully.' })
    @ApiResponse({ status: 500, description: 'Failed to find cards.' })
    async getCards() {
        return this.cardService.getCards();
    }

    @Get("cards/:pack")
    @ApiOperation({ summary: 'Get cards by pack' })
    @ApiResponse({ status: 200, description: 'Cards found successfully.' })
    @ApiResponse({ status: 500, description: 'Failed to find cards.' })
    async getCardsByPack(@Param('pack') pack: string) {
        return this.cardService.getCards(pack);
    }

    @Get("cards/:pack/:number")
    @ApiOperation({ summary: 'Get card by pack and number' })
    @ApiResponse({ status: 200, description: 'Card found successfully.' })
    @ApiResponse({ status: 500, description: 'Failed to find card.' })
    async getCardByNumber(@Param('pack') pack: string, @Param('number') number: number) {
        return this.cardService.getCard(pack, number);
    }

    @Post("user-cards")
    @ApiOperation({ summary: 'Get all cards for the authenticated user' })
    @ApiResponse({ status: 200, description: 'User cards found successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 500, description: 'Failed to find user cards.' })
    async getUserCards(@Body() user: { username: string }) {
        return await this.userCardService.getUserCards(user.username);
    }

    @Post("update-cards")
    @ApiOperation({ summary: 'Update multiple cards in the user\'s collection' })
    @ApiResponse({ status: 200, description: 'Cards updated successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 500, description: 'Failed to update cards.' })
    async updateUserCards(@Body() updateData: { username: string, updates: { expansion: string, cardNumber: number, packId: string, change: number }[] }) {
        console.log('Updating cards for user:', updateData);
        return this.userCardService.batchUpdateUserCards(updateData.username, updateData.updates);
    }

    @Post("best-pack")
    @ApiOperation({ summary: 'Get the best pack to pull for a new card' })
    @ApiResponse({ status: 200, description: 'Best pack found successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 500, description: 'Failed to find best pack.' })
    async getBestPack(@Body() user: { username: string }) {
        const result = await this.packService.getBestPackToPull(user.username);
        if (result.message) {
            return { message: result.message };
        }
        return result;
    }
    
    @Post("best-pack-for-expansion")
    @ApiOperation({ summary: 'Get the best pack to pull for a specific expansion' })
    @ApiResponse({ status: 200, description: 'Best pack for expansion found successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 500, description: 'Failed to find best pack for expansion.' })
    async getBestPackForExpansion(@Body() data: { username: string, eventName: string }) {
        const result = await this.packService.getBestPackForExpansion(data.username, data.eventName);
        if (result.message) {
            return { message: result.message };
        }
        return result;
    }
  
    @Post("best-pack-for-event")
    @ApiOperation({ summary: 'Get the best pack to pull for a specific event' })
    @ApiResponse({ status: 200, description: 'Best pack for event found successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 500, description: 'Failed to find best pack for event.' })
    async getBestPackForEvent(@Body() data: { username: string, eventName: string }) {
        const events = {
            mewQuest: {
                cards: [
                    "Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard", 
                    "Squirtle", "Wartortle", "Blastoise", "Caterpie", "Metapod", "Butterfree", 
                    "Weedle", "Kakuna", "Beedrill", "Pidgey", "Pidgeotto", "Pidgeot", 
                    "Rattata", "Raticate", "Spearow", "Fearow", "Ekans", "Arbok", 
                    "Pikachu", "Raichu", "Sandshrew", "Sandslash", "Nidoran♀", "Nidorina", 
                    "Nidoqueen", "Nidoran♂", "Nidorino", "Nidoking", "Clefairy", "Clefable", 
                    "Vulpix", "Ninetales", "Jigglypuff", "Wigglytuff", "Zubat", "Golbat", 
                    "Oddish", "Gloom", "Vileplume", "Paras", "Parasect", "Venonat", 
                    "Venomoth", "Diglett", "Dugtrio", "Meowth", "Persian", "Psyduck", 
                    "Golduck", "Mankey", "Primeape", "Growlithe", "Arcanine", "Poliwag", 
                    "Poliwhirl", "Poliwrath", "Abra", "Kadabra", "Alakazam", "Machop", 
                    "Machoke", "Machamp", "Bellsprout", "Weepinbell", "Victreebel", "Tentacool", 
                    "Tentacruel", "Geodude", "Graveler", "Golem", "Ponyta", "Rapidash", 
                    "Slowpoke", "Slowbro", "Magnemite", "Magneton", "Farfetch'd", "Doduo", 
                    "Dodrio", "Seel", "Dewgong", "Grimer", "Muk", "Shellder", 
                    "Cloyster", "Gastly", "Haunter", "Gengar", "Onix", "Drowzee", 
                    "Hypno", "Krabby", "Kingler", "Voltorb", "Electrode", "Exeggcute", 
                    "Exeggutor", "Cubone", "Marowak", "Hitmonlee", "Hitmonchan", "Lickitung", 
                    "Koffing", "Weezing", "Rhyhorn", "Rhydon", "Chansey", "Tangela", 
                    "Kangaskhan", "Horsea", "Seadra", "Goldeen", "Seaking", "Staryu", 
                    "Starmie", "Mr. Mime", "Scyther", "Jynx", "Electabuzz", "Magmar", 
                    "Pinsir", "Tauros", "Magikarp", "Gyarados", "Lapras", "Ditto", 
                    "Eevee", "Vaporeon", "Jolteon", "Flareon", "Porygon", "Omanyte", 
                    "Omastar", "Kabuto", "Kabutops", "Aerodactyl", "Snorlax", "Articuno", 
                    "Zapdos", "Moltres", "Dratini", "Dragonair", "Dragonite", "Mewtwo"
                ],
                expansion: "geneticapex"
            }
        };

        const event = events[data.eventName];
        if (!event) {
            return { message: "Event not found." };
        }

        const result = await this.packService.getBestPackForEvent(data.username, event.cards, event.expansion);
        if (result.message) {
            return { message: result.message };
        }
        return result;
    }

    @Get("pack-probabilities/:expansionId/:packId")
    @ApiOperation({ summary: 'Get individual probabilities for a specific pack' })
    @ApiResponse({ status: 200, description: 'Pack probabilities calculated successfully.' })
    @ApiResponse({ status: 404, description: 'Pack not found.' })
    @ApiResponse({ status: 500, description: 'Failed to calculate pack probabilities.' })
    async getPackProbabilities(@Param('expansionId') expansionId: string, @Param('packId') packId: string) {
        const result = await this.packService.calculateIndividualProbabilities(expansionId, packId);
        if ('message' in result) {
            throw new HttpException(result.message, HttpStatus.NOT_FOUND);
        }
        return result;
    }

    @Get("recent-updates")
    @ApiOperation({ summary: 'Get recent card updates for the user' })
    @ApiResponse({ status: 200, description: 'Recent updates found successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 500, description: 'Failed to find recent updates.' })
    async getRecentUpdates(
        @Query('username') username: string,
        @Query('limit') limit: string = "10",
        @Query('offset') offset: string = "0"
    ) {
        console.log('Getting recent updates for user:', username);
        const updates = await this.userCardService.getRecentCardUpdates(username, parseInt(limit), parseInt(offset));
        return updates;
    }

    @Get("battle-data/:id")
    @ApiOperation({ summary: 'Get battle data' })
    @ApiResponse({ status: 200, description: 'Battle data found successfully.' })
    @ApiResponse({ status: 500, description: 'Failed to find battle data.' })
    async getBattleData(@Param('id') id: string): Promise<any> {
        return this.battleService.getBattleData(`https://www.serebii.net/tcgpocket/solobattles/${id}.shtml`);
    }

    @Get("combate2/:id")
    @ApiOperation({ summary: 'Get battle data 2' })
    @ApiResponse({ status: 200, description: 'Battle data found successfully.' })
    @ApiResponse({ status: 500, description: 'Failed to find battle data.' })
    async getBattleData2(@Param('id') id: string): Promise<any> {
        const uri = path.join(process.cwd(), `public/data/tcgpocket/battles/${id}.json`);
        const data = await fsPromises.readFile(uri, 'utf8');
        const battleData = JSON.parse(data);
        return battleData;
    }

    @Get("scrapesolobattles")
    @ApiOperation({ summary: 'Scrape solo battles' })
    @ApiResponse({ status: 200, description: 'Solo battles scraped successfully.' })
    @ApiResponse({ status: 500, description: 'Failed to scrape solo battles.' })
    async getSoloBattles(): Promise<any> {
        return this.scraperService.scrapeSoloBattles();
    }

    @Get("solobattles")
    @ApiOperation({ summary: 'Get solo battles' })
    @ApiResponse({ status: 200, description: 'Solo battles found successfully.' })
    @ApiResponse({ status: 500, description: 'Failed to find solo battles.' })
    async getSoloBattles2(): Promise<any> {
        const battles = await fsPromises.readFile(path.join(process.cwd(),'public/data/tcgpocket/solobattles.json'), 'utf8');
        return JSON.parse(battles);
    }
}