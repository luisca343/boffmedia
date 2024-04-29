import { Controller, Get } from '@nestjs/common';
import { NetfluisService } from './netfluis.service';

@Controller('smartrotom/netfluis')
export class NetfluisController {
    constructor(private readonly netfluisService: NetfluisService) {}

    @Get("test")
    test(){
        return this.netfluisService.test();
    }
}
