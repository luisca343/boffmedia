import { Controller, Get, Param } from '@nestjs/common';
import { LigaService } from './liga.service';

@Controller('/smartrotom/liga')
export class LigaController {
    constructor(
        private ligaService: LigaService,
    ) {}

    @Get('replay/:id')  
    async getReplay(@Param('id') id: number) {
        return await this.ligaService.getReplay(id);
    }
}
