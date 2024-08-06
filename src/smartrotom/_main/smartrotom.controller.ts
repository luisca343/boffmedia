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

    @Post('stats')
    async getStats(@Body() {uuid}: {uuid: string}){
        return this.smartrotomService.getStats(uuid)
    }

    @Post('team')
    async getTeam(@Body() {uuid}: {uuid: string}){
        const team = await this.smartrotomService.getTeam(uuid)
        console.log('team',team)
        return team
    }

    @Post('achievements')
    async getAchievements(@Body() {uuid}: {uuid: string}){
        return this.smartrotomService.getAchievements(uuid)
    }

    @Get('achievement/:uuid/:achievementId')
    async getAchievementForPlayer(@Param('uuid') uuid: string, @Param('achievementId') achievementId: string){
        return this.smartrotomService.getAchievementForPlayer(uuid, achievementId)
    }
    

    @Post('battle')
    async addBattleAchievement(@Body() battleAchievement:  LogroCombate){
        return  await this.smartrotomService.addBattleAchievement(battleAchievement)
    }
}

interface SmartRotomPost {
    server: string;
    uuid: string;
}


interface PokemonData {
    dex: number;
    nature: string;
    species: string;
    form: string;
    palette: string;
    name: string;
    level: number;
    item: string;
    ability: string;
    moves: string[];
    ivs: number[];
    evs: number[];
    stats: number[];
}

export interface LogroCombate extends SmartRotomPost {
    npc: string;
    victoria: boolean;
    logro: string;
    equipo: PokemonData[];
    replay: string;
  }