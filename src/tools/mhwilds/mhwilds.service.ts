import { BaseDataService } from '@/smartrotom/pokemon/base-data.service';
import { Injectable } from '@nestjs/common';
import * as path from 'path';


@Injectable()
export class MhwildsService extends BaseDataService {
    
    async getWeapons() {
        const weaponsFile = path.join(process.cwd(), 'public/data/mhwilds/weapons.json');
        const weapons = await this.readJsonFile(weaponsFile);
        return weapons;
    }

    async getArmor() {
        const armorFile = path.join(process.cwd(), 'public/data/mhwilds/armor.json');
        const armor = await this.readJsonFile(armorFile);
        return armor;
    }

    async getCharms() {
        const charmsFile = path.join(process.cwd(), 'public/data/mhwilds/charms.json');
        const charms = await this.readJsonFile(charmsFile);
        return charms;
    }

    async getDecorations() {
        const decorationsFile = path.join(process.cwd(), 'public/data/mhwilds/decorations.json');
        const decorations = await this.readJsonFile(decorationsFile);
        return decorations;
    }

    async getSkills() {
        const skillsFile = path.join(process.cwd(), 'public/data/mhwilds/skills.json');
        const skills = await this.readJsonFile(skillsFile);
        return skills;
    }

    async getAllCharmRanks() {
        const charms = await this.getCharms();

        const allRanks = charms.reduce((ranks: any[], charm: any) => {
            return ranks.concat(charm.ranks.map((rank: any) => ({
                ...rank,
                charm: {
                    id: charm.id,
                    gameId: charm.gameId
                }
            })));
        }, []);

        return allRanks;
    }
}