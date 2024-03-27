import { Controller, Get, Param } from '@nestjs/common';
import { StarbankService } from './starbank.service';

@Controller('smartrotom/starbank')
export class StarbankController {
    constructor(private readonly starbankService: StarbankService) {}
    @Get("balance/:uuid")
    getBalance(@Param("uuid") uuid: string){
        return this.starbankService.getBalance(uuid);
    }

    @Get("accounts/:uuid")
    getAccounts(@Param("uuid") uuid: string){
        return this.starbankService.getAccounts(uuid);
    }

    @Get("create/:uuid/:name")
    createAccount(@Param("uuid") uuid: string, @Param("name") name: string){
        return this.starbankService.createAccount(uuid, name);
    }

    @Get("createMain/:uuid")
    createMainAccount(@Param("uuid") uuid: string){
        return this.starbankService.createMainAccount(uuid);
    }
}
