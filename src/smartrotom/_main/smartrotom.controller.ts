import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SmartrotomService } from './smartrotom.service';
import fs from 'fs';

@Controller('smartrotom')
export class SmartrotomController {
    constructor(private smartrotomService: SmartrotomService) {}

    @Post("img/customNPC")
    async img(@Body() {npcName, image}: {npcName: string, image: string}){
        fs.writeFileSync(`./public/smartrotom/img/customNPC/renders/${npcName}.png`, image.replace(/^data:image\/png;base64,/, ""), 'base64')
        return {status: "OK"}
    }
    @Get("img/customNPC/:npcName")
    async get(@Param('npcName') npcName: string){
        const exists = fs.existsSync(`./public/smartrotom/img/customNPC/${npcName}.png`)
        if(!exists) return {status: 400, error: "No existe la imagen"}
        return {status: "OK"}
    }

    @Get("img/customNPC/render/:npcName")
    async getImg(@Param('npcName') npcName: string){
        const exists = fs.existsSync(`./public/smartrotom/img/customNPC/renders/${npcName}.png`)
        if(!exists) return {error: "No existe la imagen"}
        return {status: "OK"}
    }
}
