import { Controller, HttpStatus, Get, Param, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import axios from 'axios';
import { CharmRankExample } from './examples';
import * as path from 'path';
import { MhwildsService } from './mhwilds.service';

@ApiTags('tools/mhwilds')
@Controller('/tools/mhwilds')
export class MhwildsController {
    private readonly logger = new Logger(MhwildsController.name);
    
    constructor(
        private readonly wildsService: MhwildsService,
    ) {}
    
    @Get("/weapons")
    @ApiOperation({ summary: 'Get all weapons' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Weapons found successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to find weapons.' })
    async findAllWeapons() {
        const weapons = await this.wildsService.getWeapons();
        
        return {
            status: HttpStatus.OK,
            message: "Weapons found successfully",
            data: weapons
        }
    }

    @Get("/armor")
    @ApiOperation({ summary: 'Get all armor' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Armor found successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to find armor.' })
    async findAllArmor() {
        const armor = await this.wildsService.getArmor();
        
        return {
            status: HttpStatus.OK,
            message: "Armor found successfully",
            data: armor
        }
    }

    @Get("/decorations")
    @ApiOperation({ summary: 'Get all decorations' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Decorations found successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to find decorations.' })
    async findAllDecorations() {
        const decorations = await this.wildsService.getDecorations();
        
        return {
            status: HttpStatus.OK,
            message: "Decorations found successfully",
            data: decorations
        }
    }

    @Get("/charms")
    @ApiOperation({ summary: 'Get all charms' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Charms found successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to find charms.' })
    async findAllCharms() {
        const charms = await this.wildsService.getCharms();
        return {
            status: HttpStatus.OK,
            message: "Charms found successfully",
            data: charms[0]
        }
    }

    @Get("/skills")
    @ApiOperation({ summary: 'Get all skills' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Skills found successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to find skills.' })
    async findAllSkills() {
        const skills = await this.wildsService.getSkills();
        return {
            status: HttpStatus.OK,
            message: "Skills found successfully",
            data: skills
        }
    }

    @Get("/ranks")
    @ApiOperation({ summary: 'Get all charm ranks' })
    @ApiResponse({status: HttpStatus.OK, description: 'Charm ranks found successfully.',  example: CharmRankExample })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to find charm ranks.', example: { status: 500, message: "Failed to find charm ranks", error: "Error message" } })
    async findAllCharmRanks() {
        try {
            const ranks = await this.wildsService.getAllCharmRanks();
            return {
                status: HttpStatus.OK,
                message: "Charm ranks found successfully",
                data: ranks
            };
        } catch (error) {
            return {
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                message: "Failed to find charm ranks",
                error: error.message
            };
        }
    }
    
}