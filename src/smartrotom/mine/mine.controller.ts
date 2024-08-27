import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MinaService } from './mine.service';

@Controller('smartrotom/mine')
export class MinaController {
    constructor(
        private minaService: MinaService,
        ) {}

    @Get('energy/:uuid')
    getEnergy(@Param('uuid') uuid: string) {
      return this.minaService.getEnergy(uuid);
    }

    @Post('play')
    play(@Body() body: {uuid: string}) {
      return this.minaService.play(body.uuid);
    }

    @Post('endgame')
    endGame(@Body() body: {uuid: string, rewards: {value:number, id: number}[]}) {
      console.log(body)
      return this.minaService.endGame(body.uuid, body.rewards);
    }

    @Get('rewards')
    getRewards() {
        return this.minaService.getRewards();
    }

    @Get('rewardsbytype')
    getRewardsByType() {
        return this.minaService.getRewardsByType();
    }

    @Get('history/:uuid')
    getHistory(@Param('uuid') uuid: string) {
        return this.minaService.getHistory(uuid);
    }

    @Get('ranking')
    async getRanking() {
      return await this.minaService.getRanking();
    }

    @Get('unclaimed/:uuid')
    async getUnclaimed(@Param('uuid') uuid: string) {
      return await this.minaService.getUnclaimed(uuid);
    }
  
}
