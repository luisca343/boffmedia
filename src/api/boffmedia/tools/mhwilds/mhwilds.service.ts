import { BaseDataService } from '@api/smartrotom/pokemon/services/data/base-data.service';
import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import axios from 'axios';

@Injectable()
export class MhwildsService extends BaseDataService {
    private readonly logger = new Logger(MhwildsService.name);
    private readonly API_BASE_URL = 'https://wilds.mhdb.io';
    private readonly CACHE_DURATION_MS = 86400000; // 1 day in milliseconds
    
    /**
     * Generic method to get data with caching and remote fetching if needed
     * @param resourceType Type of resource (weapons, armor, etc)
     * @param locale Locale for the resource
     * @param subPath Optional sub-path for the file structure
     * @returns The fetched data
     */
    private async getResourceData(resourceType: string, locale: string = 'es', subPath?: string): Promise<any> {
        // Determine file paths
        const filePath = path.join(process.cwd(), `public/data/mhwilds/${locale}/${resourceType}.json`)
        const dirPath = path.dirname(filePath);
        
        try {
            // Check if directory exists, create it if not
            try {
                await fs.access(dirPath);
            } catch {
                await fs.mkdir(dirPath, { recursive: true });
                this.logger.log(`Created directory: ${dirPath}`);
            }
            
            let shouldFetch = false;
            
            // Check if file exists and its modification time
            try {
                const stats = await fs.stat(filePath);
                const fileDate = stats.mtime;
                const now = new Date();
                
                // If file is older than cache duration, fetch new data
                if (now.getTime() - fileDate.getTime() > this.CACHE_DURATION_MS) {
                    this.logger.log(`${resourceType} data${locale ? ` for locale ${locale}` : ''} is older than 1 day, fetching fresh data...`);
                    shouldFetch = true;
                }
            } catch (err) {
                // File doesn't exist, need to fetch it
                this.logger.log(`${resourceType} data${locale ? ` for locale ${locale}` : ''} doesn't exist, fetching...`);
                shouldFetch = true;
            }
            
            // Fetch and save new data if needed
            if (shouldFetch) {
                // Construct API URL based on whether locale is provided
                const apiUrl = locale 
                    ? `${this.API_BASE_URL}/${locale}/${resourceType}`
                    : `${this.API_BASE_URL}/en/${resourceType}`;
                
                this.logger.log(`Fetching ${resourceType} data from: ${apiUrl}`);
                
                const response = await axios.get(apiUrl);
                const data = response.data;
                
                // Save the data to the file
                await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
                this.logger.log(`Successfully saved ${resourceType} data${locale ? ` for locale ${locale}` : ''}`);
                
                return data;
            } else {
                // Use the existing file
                this.logger.log(`Using cached ${resourceType} data${locale ? ` for locale ${locale}` : ''}`);
                return this.readJsonFile(filePath);
            }
        } catch (error) {
            this.logger.error(`Error fetching ${resourceType} data: ${error.message}`);
            
            // Try to read the cached file as fallback if it exists
            try {
                return this.readJsonFile(filePath);
            } catch {
                // If everything fails, return an empty array
                this.logger.error(`Failed to read cached ${resourceType} data, returning empty array`);
                return [];
            }
        }
    }
    
    async getWeapons(locale?: string) {
        return this.getResourceData('weapons', locale);
    }

    async getArmor(locale?: string) {
        return this.getResourceData('armor', locale);
    }

    async getCharms(locale?: string) {
        return this.getResourceData('charms', locale);
    }

    async getDecorations(locale?: string) {
        return this.getResourceData('decorations', locale);
    }

    async getSkills(locale?: string) {
        return this.getResourceData('skills', locale);
    }

    async getAllCharmRanks(locale?: string) {
        const charms = await this.getCharms(locale);

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

        /**
     * Creates a weapon tree structure and saves it as a JSON file
     * @param locale Locale for the weapons data
     * @returns The created weapon tree structure
     */
        async createWeaponTree(locale?: string): Promise<any> {
            try {
                const weapons = await this.getWeapons(locale);
                
                const weaponsById = weapons.reduce((map, weapon) => {
                    map[weapon.id] = weapon;
                    return map;
                }, {});
                
                const rootWeapons = weapons.filter(weapon => 
                    weapon.crafting?.craftable === true && 
                    !weapon.crafting?.previous
                );
                
                const weaponTree = rootWeapons.map(rootWeapon => 
                    this.buildWeaponBranch(rootWeapon, weaponsById)
                );
                
                const weaponTreeByKind = weapons.reduce((tree, weapon) => {
                    const kind = weapon.kind;
                    if (!tree[kind]) {
                        tree[kind] = [];
                    }
                    
                    if (weapon.crafting?.craftable === true && !weapon.crafting?.previous) {
                        tree[kind].push(this.buildWeaponBranch(weapon, weaponsById));
                    }
                    
                    return tree;
                }, {});
                
                const treeFilePath = path.join(process.cwd(), `public/data/mhwilds/${locale || 'en'}/weapon-tree.json`);
                const treeByKindFilePath = path.join(process.cwd(), `public/data/mhwilds/${locale || 'en'}/weapon-tree-by-kind.json`);
                
                await fs.writeFile(treeFilePath, JSON.stringify(weaponTree, null, 2), 'utf8');
                await fs.writeFile(treeByKindFilePath, JSON.stringify(weaponTreeByKind, null, 2), 'utf8');
                
                this.logger.log(`Successfully created and saved weapon trees for locale ${locale || 'en'}`);
                
                return {
                    tree: weaponTree,
                    treeByKind: weaponTreeByKind
                };
            } catch (error) {
                this.logger.error(`Error creating weapon tree: ${error.message}`);
                throw error;
            }
        }
        
        /**
         * Recursively builds a weapon branch starting from a given weapon
         * @param weapon The current weapon node
         * @param weaponsById Map of all weapons by their id
         * @returns A tree structure for the current weapon and its branches
         */
        private buildWeaponBranch(weapon, weaponsById): any {
            if (!weapon) return null;
            
            // Create node with essential weapon information
            const node = {
                id: weapon.id,
                name: weapon.name,
                rarity: weapon.rarity,
                kind: weapon.kind,
                damage: weapon.damage,
                specials: weapon.specials,
                craftingMaterials: weapon.crafting.craftingMaterials,
                craftingZennyCost: weapon.crafting.craftingZennyCost,
                upgradeMaterials: weapon.crafting.upgradeMaterials,
                upgradeZennyCost: weapon.crafting.upgradeZennyCost,
                
                children: []
            };
            
            
            // Add all branches as children
            if (weapon.crafting?.branches && weapon.crafting.branches.length > 0) {
                node.children = weapon.crafting.branches
                    .map(branch => {
                        const branchWeapon = weaponsById[branch.id];
                        return this.buildWeaponBranch(branchWeapon, weaponsById);
                    })
                    .filter(Boolean); // Remove null entries
            }
            
            return node;
        }
}