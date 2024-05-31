import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SmartrotomService } from './smartrotom.service';
import fs from 'fs';

@Controller('smartrotom')
export class SmartrotomController {
    constructor(private smartrotomService: SmartrotomService) {}

    @Post("img/customNPC")
    async img(@Body() {npcName, image}: {npcName: string, image: string}){
        console.log("Received image")
        fs.writeFileSync(`./public/smartrotom/img/customNPC/${npcName}.png`, image.replace(/^data:image\/png;base64,/, ""), 'base64')
    }

    @Get("img/customNPC/:npcName")
    async getImg(@Param('npcName') npcName: string){
        const exists = fs.existsSync(`./public/smartrotom/img/customNPC/${npcName}.png`)
        if(!exists) return {error: "No existe la imagen"}
        return {status: "OK"}
    }
}
