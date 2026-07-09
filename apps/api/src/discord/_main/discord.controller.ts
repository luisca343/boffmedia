import { Controller } from '@nestjs/common';
import { Public } from '@api/_utils/decorators/public.decorator';
import { SkipEnvelope } from '@/common/decorators/skip-envelope.decorator';

@Public()
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
