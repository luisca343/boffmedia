import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import *  as  path from 'path';
import Fuse from 'fuse.js'
import { google, sheets_v4 } from 'googleapis';
import { promises as fsPromises } from 'fs';
import { Pokemon } from '@/types/pokemon';

@Injectable()
export class PokemonService {
    pokemonList = [];
    species = [];

    speciesByDex = {}
    speciesByForm = {}
    speciesByPalette = {}
    speciesByType = {}
    speciesByEggGroup = {}
    speciesByAbility = {}

    async loadData() {
        console.log("Loading pokemon data");
        const publicDir = path.join(__dirname, '../../../', 'public/smartrotom/data/species');
        const dir = await fsPromises.readdir(publicDir);
        for (const file of dir) {
            if (!file || !file.includes(".json")) continue;
            const fileName = path.join(publicDir, file);
            const data = JSON.parse(await fsPromises.readFile(fileName, 'utf8')) as Pokemon;
    
            this.pokemonList.push(file.split(".")[0].split("_")[1]);
            this.species.push(data);
            this.speciesByDex[data.dex] = data;
    
            data.forms?.forEach((form) => {
                if(!form) return;
                if (!this.speciesByForm[form.name]) {
                    this.speciesByForm[form.name] = [];
                }

                form.pkmDex = data.dex;
                form.pkmName = data.name;
                form.pkmGeneration = data.generation;

                this.speciesByForm[form.name].push(form);
    
                const genderProperties = form?.genderProperties && form.genderProperties.length > 0 ? form.genderProperties[0] : undefined;
                const palettes = genderProperties?.palettes;
    
                if(palettes){
                    palettes.forEach((palette) => {
                        if (!this.speciesByPalette[palette.name]) {
                            this.speciesByPalette[palette.name] = [];
                        }
                        this.speciesByPalette[palette.name].push(form);
                    });
                }

                const types = form?.types;
                if(types){
                    types.forEach((type) => {
                        if (!this.speciesByType[type]) {
                            this.speciesByType[type] = [];
                        }
                        this.speciesByType[type].push(form);
                    });
                }

                const eggGroups = form?.eggGroups;
                if(eggGroups){
                    eggGroups.forEach((eggGroup) => {
                        if (!this.speciesByEggGroup[eggGroup]) {
                            this.speciesByEggGroup[eggGroup] = [];
                        }
                        this.speciesByEggGroup[eggGroup].push(form);
                    });
                }

                const abilities = form?.abilities;
                if(abilities){
                    abilities.abilities.forEach((ability) => {
                        if (!this.speciesByAbility[ability]) {
                            this.speciesByAbility[ability] = [];
                        }
                        this.speciesByAbility[ability].push(form);
                    });

                    abilities.hiddenAbilities?.forEach((ability) => {
                        if (!this.speciesByAbility[ability]) {
                            this.speciesByAbility[ability] = [];
                        }
                        this.speciesByAbility[ability].push(form);
                    });
                }
            });
        }
    
        let totalForms = 0;
        Object.values(this.speciesByForm).forEach((forms: any[]) => {
            totalForms += forms.length;
        });
    
        console.log(`Cargadas ${this.species.length} especies y ${Object.keys(this.speciesByForm).length} formas diferentes, para un total de ${totalForms} Pokémon`);
    }
    

    getPokemonNames() {
        return this.pokemonList;
    }

    getAllPokemonByDex() {
        return this.speciesByDex;
    }

    getPokemonByDex(dex: number) {
        return this.speciesByDex[dex];
    }

    getManyPokemonByDex(dex: number[]) {
        return dex.map((d) => this.speciesByDex[d]);
    }
    

    getPokemon() {
        return this.species;
    }

    getPokemonByForm() {
        return this.speciesByForm;
    }

    getPokemonByPalette() {
        return this.speciesByPalette;
    }

    getPokemonByType() {
        return this.speciesByType;
    }

    getPokemonByEggGroup() {
        return this.speciesByEggGroup;
    }

    getPokemonByAbility() {
        return this.speciesByAbility;
    }

    countPokemon() {
        return this.species.length;
    }

    getPokemonByName(name: string) {
        // @ts-ignore
        const options: Fuse.IFuseOptions<any> = {
            includeScore: true,
            includeMatches: true,
            keys: ['name', 'nickname']
        }
        const fuse = new Fuse<any>(this.species, options);
        const result = fuse.search(name);
        return result;
    }


    getStatsByName(name: string) {
        // @ts-ignore
        const options: Fuse.IFuseOptions<string> = {
            includeScore: true,
            includeMatches: true,
            keys: ['name', 'nickname']
        }
        const fuse = new Fuse<any>(this.species, options);
        const result = fuse.search(name);
        const pkm = result[0].item;
        return pkm.forms[0].battleStats
    }
    async getFromGoogleSheets(name : string) {
        //AIzaSyCxjks7gBH5U1FtDd_Y1QOvOciSlr1XtQE
        const auth = new google.auth.GoogleAuth({
            keyFile: 'boffmedia-a39cdd7a63c7.json',
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
        
    
     
        const client = await auth.getClient() as any;
        const sheets = google.sheets({ version: 'v4', auth: client }) as sheets_v4.Sheets;
     
           const spreadsheetId = '1ypFa113-jMFGb26e2ZsGzas2_8Vvnv3mAE4cQXat2co';
        const range = `Pokemonchos!${name}:${name}`;
    
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });
    
        const firstCell = response.data.values;
        let max = 0;
        firstCell.forEach((cell) => {
            if(parseInt(cell[0]) > max) max = parseInt(cell[0]);
        });
   
        console.log(max); 
        return max;
    }

}