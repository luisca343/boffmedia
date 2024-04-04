import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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

    @Post("shop")
    shop(@Body() body: {uuid: string, npcName: string, itemName: string, operation: string, unitPrice: number, count: number}){
        return this.starbankService.shop(body);
    }

    @Get("transactions/:uuid")
    getTransactions(@Param("uuid") uuid: string){
        return this.starbankService.getTransactions(uuid);
    }
}
