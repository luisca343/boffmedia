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
    
    @Get("/weapons/:locale")
    @ApiOperation({ summary: 'Get all weapons' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Weapons found successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to find weapons.' })
    async findAllWeapons(@Param('locale') locale: string) {
        const weapons = await this.wildsService.getWeapons(locale);
        
        return {
            status: HttpStatus.OK,
            message: "Weapons found successfully",
            data: weapons
        }
    }

    @Get("/armor/:locale")
    @ApiOperation({ summary: 'Get all armor' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Armor found successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to find armor.' })
    async findAllArmor(@Param('locale') locale: string) {
        const armor = await this.wildsService.getArmor(locale);
        
        return {
            status: HttpStatus.OK,
            message: "Armor found successfully",
            data: armor
        }
    }

    @Get("/decorations/:locale")
    @ApiOperation({ summary: 'Get all decorations' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Decorations found successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to find decorations.' })
    async findAllDecorations(@Param('locale') locale: string) {
        const decorations = await this.wildsService.getDecorations(locale);
        
        return {
            status: HttpStatus.OK,
            message: "Decorations found successfully",
            data: decorations
        }
    }

    @Get("/charms/:locale")
    @ApiOperation({ summary: 'Get all charms' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Charms found successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to find charms.' })
    async findAllCharms(@Param('locale') locale: string) {
        const charms = await this.wildsService.getCharms(locale);
        return {
            status: HttpStatus.OK,
            message: "Charms found successfully",
            data: charms[0]
        }
    }

    @Get("/skills/:locale")
    @ApiOperation({ summary: 'Get all skills' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Skills found successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to find skills.' })
    async findAllSkills(@Param('locale') locale: string) {
        const skills = await this.wildsService.getSkills(locale);
        return {
            status: HttpStatus.OK,
            message: "Skills found successfully",
            data: skills
        }
    }

    @Get("/ranks/:locale")
    @ApiOperation({ summary: 'Get all charm ranks' })
    @ApiResponse({status: HttpStatus.OK, description: 'Charm ranks found successfully.',  example: CharmRankExample })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to find charm ranks.', example: { status: 500, message: "Failed to find charm ranks", error: "Error message" } })
    async findAllCharmRanks(@Param('locale') locale: string) {
        try {
            const ranks = await this.wildsService.getAllCharmRanks(locale);
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

    @Get("/weapon-tree/:locale")
    @ApiOperation({ summary: 'Get weapon tree structure' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Weapon tree created successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to create weapon tree.' })
    async getWeaponTree(@Param('locale') locale: string) {
        try {
            const weaponTree = await this.wildsService.createWeaponTree(locale);
            return {
                status: HttpStatus.OK,
                message: "Weapon tree created successfully",
                data: weaponTree
            };
        } catch (error) {
            this.logger.error(`Failed to create weapon tree: ${error.message}`);
            return {
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                message: "Failed to create weapon tree",
                error: error.message
            };
        }
    }

}