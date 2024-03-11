import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import *  as  path from 'path';

@Injectable()
export class PokemonService {
    getPokemon() {
        const publicDir = path.join(__dirname, '../../../', 'public/smartrotom/data/species');
        let dir = fs.readdirSync(publicDir);
        let pokemon = [];
        dir.forEach((file) => {
            pokemon.push(file.split(".")[0].split("_")[1]);
        });
        return pokemon;
    }
}