import * as fs from 'fs';
import *  as  path from 'path';
import { promises as fsPromises } from 'fs';
import { wolfeyTypeRanking } from './types';
import { Attack } from '@/types/move';

export class MoveData {
    constructor() {}
    
    moveList = [];
    movesByName = {}
    movesByType = {}
    movesByCategory = {}
    

    async loadMoveData() {
        const startingTime = Date.now();
        const defaultDirDef = path.join(__dirname, '../../../../', 'public/smartrotom/packs/default_datapack/data/pixelmon/moves');
        const publicDir = path.join(__dirname, '../../../../', 'public/smartrotom/packs/datapack/data/pixelmon/moves');

        const defaultDir = await fsPromises.readdir(defaultDirDef);
        const dir = await fsPromises.readdir(publicDir);

        const fullDir = [...new Set([...defaultDir, ...dir])];

        let defaultCounter = 0;
        let terasCounter = 0;

        for (const file of fullDir) {
            if (!file || !file.includes(".json")) continue;
            let fileName = path.join(publicDir, file);
            let data: Attack
            if(fs.existsSync(fileName)) {
                data = JSON.parse(await fsPromises.readFile(fileName, 'utf8')) as Attack;
                terasCounter++;
            } else {
                fileName = path.join(defaultDirDef, file);
                data = JSON.parse(await fsPromises.readFile(fileName, 'utf8')) as Attack;
                defaultCounter++;
            }

            this.moveList.push(data);
            this.movesByName[data.attackName] = data;
            this.movesByType[data.attackType] = data;
            this.movesByCategory[data.attackCategory] = data;
            
        }

        console.log(`Cargados ${terasCounter} movimientos de Teras y ${defaultCounter} movimientos por defecto en ${Date.now() - startingTime}ms`);

    }

}