import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { StarbankService } from './starbank.service';

@Controller('smartrotom/starbank')
export class StarbankController {
    constructor(private readonly starbankService: StarbankService) {}
    @Get("balance/:uuid")
    getBalance(@Param("uuid") uuid: string){
        return this.starbankService.getBalance(uuid);
    }

    @Get("accounts")
    getAllAccounts(@Param("uuid") uuid: string){
        return this.starbankService.getAllAccounts();
    }
    @Get("accounts/:uuid")
    getAccounts(@Param("uuid") uuid: string){
        return this.starbankService.getAccounts(uuid);
    }

    @Post("trainerdefeat")
    trainerDefeat(@Body() body: {money: number, uuid: string}) {
        return this.starbankService.trainerDefeat(body.money, body.uuid);
    }

    @Post("shop")
    shop(@Body() body: {uuid: string, npcName: string, itemName: string, operation: string, unitPrice: number, count: number}){
        return this.starbankService.shop(body);
    }

    @Post("transfer")
    transfer(@Body() body: {from: number, to: number, amount: number, concept: string}){
        return this.starbankService.transfer(body.from, body.to, body.amount, body.concept);
    }

    @Get("transactions/:account")
    getTransactions(@Param("account") account: number, @Query("limit") limit: string){
        console.log(`Getting transactions for account ${account} with limit ${limit}`)
        return this.starbankService.getTransactions(account, parseInt(limit));
    }

    @Get("transfers/:account")
    getTransfers(@Param("uuid") account: number){
        return this.starbankService.getTransfers(account);
    }
    /*
    @Get("transfers/:uuid")
    getTransfers(@Param("uuid") uuid: string){
        return this.starbankService.getTransfers(uuid);
    }*/
}
