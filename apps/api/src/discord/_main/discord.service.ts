import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DiscordService {
    private readonly logger = new Logger(DiscordService.name);

    constructor() {
        this.logger.log('DiscordService instantiated');
    }
}