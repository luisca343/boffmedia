import { Controller, HttpStatus, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import axios from 'axios';
import { CharmRankExample } from './examples';

@ApiTags('tools/mhwilds')
@Controller('/tools/mhwilds')
export class MhwildsController {
    @Get("/weapons")
    @ApiOperation({ summary: 'Get all weapons' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Weapons found successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to find weapons.' })
    async findAllWeapons() {
        const data = await axios.get("https://api.ficuslab.es/data/mhwilds/weapons.json");
        return {
            status: HttpStatus.OK,
            message: "Weapons found successfully",
            data: data.data
        }
    }

    @Get("/armor")
    @ApiOperation({ summary: 'Get all armor' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Armor found successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to find armor.' })
    async findAllArmor() {
        const data = await axios.get("https://api.ficuslab.es/data/mhwilds/armor.json");
        return {
            status: HttpStatus.OK,
            message: "Armor found successfully",
            data: data.data
        }
    }

    @Get("/charms")
    @ApiOperation({ summary: 'Get all charms' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Charms found successfully.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to find charms.' })
    async findAllCharms() {
        const data = await axios.get("https://api.ficuslab.es/data/mhwilds/charms.json");
        return {
            status: HttpStatus.OK,
            message: "Charms found successfully",
            data: data.data
        }
    }

@Get("/ranks")
@ApiOperation({ summary: 'Get all charm ranks' })
@ApiResponse({ status: HttpStatus.OK, description: 'Charm ranks found successfully.', example: CharmRankExample })
@ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to find charm ranks.', example: { status: 500, message: "Failed to find charm ranks", error: "Error message" } })
async findAllCharmRanks() {
    try {
        const response = await axios.get("https://api.ficuslab.es/data/mhwilds/charms.json");
        const charms = response.data;
        
        // Flatten all ranks from all charms into a single array
        const allRanks = charms.reduce((ranks: any[], charm: any) => {
            return ranks.concat(charm.ranks.map((rank: any) => ({
                ...rank,
                charm: {
                    id: charm.id,
                    gameId: charm.gameId
                }
            })));
        }, []);

        return {
            status: HttpStatus.OK,
            message: "Charm ranks found successfully",
            data: allRanks
        };
    } catch (error) {
        return {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: "Failed to find charm ranks",
            error: error.message
        };
    }
}

    @Get("/charms/:charmId/ranks/:rankLevel")
    @ApiOperation({ summary: 'Get specific charm rank' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Charm rank found successfully.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Charm rank not found.' })
    @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to find charm rank.' })
    async findCharmRank(
        @Param('charmId') charmId: string,
        @Param('rankLevel') rankLevel: string
    ) {
        try {
            const response = await axios.get("https://api.ficuslab.es/data/mhwilds/charms.json");
            const charms = response.data;
            
            const charm = charms.find((c: any) => c.id === parseInt(charmId));
            if (!charm) {
                return {
                    status: HttpStatus.NOT_FOUND,
                    message: "Charm not found",
                    data: null
                };
            }

            const rank = charm.ranks.find((r: any) => r.level === parseInt(rankLevel));
            if (!rank) {
                return {
                    status: HttpStatus.NOT_FOUND,
                    message: "Charm rank not found",
                    data: null
                };
            }

            return {
                status: HttpStatus.OK,
                message: "Charm rank found successfully",
                data: rank
            };
        } catch (error) {
            return {
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                message: "Failed to find charm rank",
                error: error.message
            };
        }
    }
}


{
    
}