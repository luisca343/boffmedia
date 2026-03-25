import { Controller, Post } from '@nestjs/common';
import { DiscordService } from './discord.service';

@Controller('discord')
export class DiscordController {
    /*
    constructor(private readonly discordService: DiscordService) {}
    @Post('resetCommands')
    async resetCommands() {
        console.log('resetCommands');
        return  this.discordService.resetCommands();
    }*/
}
