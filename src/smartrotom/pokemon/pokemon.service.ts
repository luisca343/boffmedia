import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import *  as  path from 'path';
import Fuse from 'fuse.js'

@Injectable()
export class PokemonService {
    pokemonList = [];
    especies = [];

    loadData(){
        console.log("Loading pokemon data");
        const publicDir = path.join(__dirname, '../../../', 'public/smartrotom/data/species');
        let dir = fs.readdirSync(publicDir);
        dir.forEach((file) => {
            if(!file || !file.includes(".json")) return;
            const fileName = `public/smartrotom/data/species/${file}`;
            const data = JSON.parse(fs.readFileSync(fileName, 'utf8'));
            this.especies.push(data);

            this.pokemonList.push(file.split(".")[0].split("_")[1]);
        });
    }

    getPokemonNames() {
        const publicDir = path.join(__dirname, '../../../', 'public/smartrotom/data/species');
        let dir = fs.readdirSync(publicDir);
        let pokemon = [];
        dir.forEach((file) => {
            pokemon.push(file.split(".")[0].split("_")[1]);
        });
        return pokemon;
    }

    getPokemon() {
        return this.especies;
    }

    countPokemon() {
        return this.especies.length;
    }

    getPokemonByName(name: string) {
        const options: Fuse.IFuseOptions<any> = {
            includeScore: true,
            includeMatches: true,
            keys: ['name', 'nickname']
        }
        const fuse = new Fuse<any>(this.especies, options);
        const result = fuse.search(name);
        return result;
    }

    getStatsByName(name: string) {
        const options: Fuse.IFuseOptions<string> = {
            includeScore: true,
            includeMatches: true,
            keys: ['name', 'nickname']
        }
        const fuse = new Fuse<any>(this.especies, options);
        const result = fuse.search(name);
        const pkm = result[0].item;
        return pkm.forms[0].battleStats
    }

}