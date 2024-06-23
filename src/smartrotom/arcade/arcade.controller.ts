import { Controller, Get } from '@nestjs/common';
import { ArcadeService } from './arcade.service';

@Controller('smartrotom/arcade')
export class ArcadeController {
    constructor(private readonly arcadeService: ArcadeService) {}

    @Get()
    async getArcade() {
        return "Arcade Controller"
    }

    @Get('wordle')
    async getWordle() {
        return this.arcadeService.getWordle();
    }

}
