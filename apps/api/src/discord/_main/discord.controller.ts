import { Controller } from '@nestjs/common';
import { SkipEnvelope } from '@/common/decorators/skip-envelope.decorator';

@Controller('discord')
@SkipEnvelope()
export class DiscordController {
  /*
    constructor(
    private readonly logger: Logger,
    private readonly discordService: DiscordService) {}
    @Post('resetCommands')
    async resetCommands() {
        this.logger.log('resetCommands');
        return  this.discordService.resetCommands();
    }*/
}
