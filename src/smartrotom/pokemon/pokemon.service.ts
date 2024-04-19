import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import *  as  path from 'path';
import Fuse from 'fuse.js'
import { google, sheets_v4 } from 'googleapis';
import { promises as fsPromises } from 'fs';
import { Pokemon } from '@/types/pokemon';
import { getDeffensiveScore, getDeffensiveScoreRanking, getOffensiveScoreRanking, getOverallScoreRanking } from './utils/types';

@Injectable()
export class PokemonService {
    pokemonList = [];
    species = [];

    highestDex = 0;
    speciesByDex = {}
    speciesByName = {}
    speciesByNameWithForm = {}
    speciesByForm = {}
    speciesByPalette = {}
    speciesByType = {}
    speciesByEggGroup = {}
    speciesByAbility = {}
    finalForms = {}

    async loadData() {
        const defaultDirDef = path.join(__dirname, '../../../', 'public/smartrotom/packs/default_datapack/data/pixelmon/species');
        const publicDir = path.join(__dirname, '../../../', 'public/smartrotom/packs/datapack/data/pixelmon/species');

        const defaultDir = await fsPromises.readdir(defaultDirDef);
        const dir = await fsPromises.readdir(publicDir);
        
        const fullDir = [...new Set([...defaultDir, ...dir])];
        
        let defaultCounter = 0;
        let terasCounter = 0;

        const startingTime = Date.now();

        for (const file of fullDir) {
            if (!file || !file.includes(".json")) continue;
            let fileName = path.join(publicDir, file);
            let data: Pokemon;
            if(fs.existsSync(fileName)) {
                data = JSON.parse(await fsPromises.readFile(fileName, 'utf8')) as Pokemon;
                terasCounter++;
            } else {
                fileName = path.join(defaultDirDef, file);
                data = JSON.parse(await fsPromises.readFile(fileName, 'utf8')) as Pokemon;
                defaultCounter++;
            }
    
            this.pokemonList.push(file.split(".")[0].split("_")[1]);
            this.species.push(data);
            this.speciesByDex[data.dex] = data;
            this.speciesByName[data.name] = data;
            if (data.dex > this.highestDex) {
                this.highestDex = data.dex;
            }
    
            data.forms?.forEach((form) => {
                if(!form) return;
                let formName = form.name || 'base';
                if (!this.speciesByForm[formName]) {
                    this.speciesByForm[formName] = [];
                }

                const nameWithForm = `${data.name}_${formName}`;

      
                this.speciesByNameWithForm[nameWithForm] = form
            
                form.pkmDex = data.dex;
                form.pkmName = data.name;
                form.pkmGeneration = data.generation;

                this.speciesByForm[formName].push(form);
    
                const genderProperties = form?.genderProperties && form.genderProperties.length > 0 ? form.genderProperties[0] : undefined;
                const palettes = genderProperties?.palettes;

                if(!form.evolutions || form.evolutions.length === 0){
                    this.finalForms[data.name] = form;
                }
                
    
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
        console.log(`Cargadas ${Object.keys(this.finalForms).length} formas evolutivas finales`);
        console.log(`Cargados ${defaultCounter} archivos predeterminados y ${terasCounter} archivos modificados`);
        const endTime = Date.now();
        console.log(`Tiempo de carga: ${endTime - startingTime}ms`);
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
    
    getSpeciesByNameWithForm() {
        return this.speciesByNameWithForm;
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
        return result.slice(0, 10)
    }

    getPokemonByName2(name: string) {
        // @ts-ignore
        const options: Fuse.IFuseOptions<any> = {
            includeScore: true,
            includeMatches: true
        }

        const fuse = new Fuse<any>(Object.keys(this.speciesByNameWithForm), options);
        const result = fuse.search(name);
        return result.slice(0, 5).map((res) => {
            return res.item.toLowerCase()
        })
    }

    getNextPrev(id: number) {
        const currIndex = Object.keys(this.speciesByDex).findIndex((dex) => parseInt(dex) === id);

        const next = currIndex < Object.keys(this.speciesByDex).length - 1 ? this.speciesByDex[Object.keys(this.speciesByDex)[currIndex + 1]] : this.speciesByDex[1];
        const prev = currIndex > 1 ? this.speciesByDex[Object.keys(this.speciesByDex)[currIndex - 1]] : this.speciesByDex[this.highestDex];
        

        return { prev, next }
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
   
        return max;
    }

    getEvoTree(id: number) {
        const pkm = this.speciesByDex[id] as Pokemon;
        let preEvo = pkm
        while(preEvo.forms[0].preEvolutions?.length > 0){
            const preEvoName = preEvo.forms[0].preEvolutions[0]
            preEvo = this.speciesByName[preEvoName]
        }
        const evoTree = this.getEvos(preEvo, 'all')
        return evoTree

        
    }

    getEvos(pokemon: Pokemon, currentForm: string, evos = {} as any ){
        if(currentForm === '') currentForm = 'base'
        let index = 0
        for(const form of pokemon.forms){
            const formName = form.name || 'base'
            const pkmId = `${pokemon.name}_${formName}`
            let currentPokemon = evos[pkmId]
            if((currentForm !='all' || formName.includes('gmax')) && formName !== currentForm )  continue;
            

            if(Object.keys(evos).length === 0 || ! evos.pkm){
                evos[pkmId] = {pkm: pokemon.name, evos: {}, dex: pokemon.dex}
                currentPokemon = evos[pkmId]
            } else {
                currentPokemon = evos
            }

            if(!form.evolutions) {
                continue;
            }

            for (const evo of form.evolutions){
                const [evoPokemonName, evoFormName] = this.getFormName(evo.to)
                const evoId = `${evoPokemonName}_${evoFormName}`
                if(!currentPokemon.evos) currentPokemon.evos = {}
                const evoArray = currentPokemon.evos
                if(!evoArray[evoId]){
                    evoArray[evoId] = {pkm: evoPokemonName, evos: {}, dex: this.speciesByName[evoPokemonName].dex}
                }
                
                const thisEvo = evoArray[evoId]
                if(! evoArray[evoId].methods){
                    evoArray[evoId].methods = []
                }
                evoArray[evoId].methods.push(evo)

                const evoPkm = this.speciesByName[evoPokemonName]
                let evoEvo = this.getEvos(evoPkm, evoFormName, evoArray[evoId]) as any
                /*
                if (formName === currentForm || currentForm === 'all'){
                    const evoPkm = this.speciesByName[evoPokemonName]
                    let evoEvo = this.getEvos(evoPkm, evoFormName) as any
                    if(!evoEvo.methods){
                        evoEvo.methods = []
                    }
                    evoEvo.methods.push(evo)
                    
                    if (Object.keys(evoEvo).length === 0){
                        evoEvo = this.getEvos(evoPkm, 'all')
                        evos[pkmId].evos.push(evoEvo)
                        break;
                    }

                    evos[pkmId].evos.push(evoEvo)
                }*/
            }
            index++
        }
        return {depth: this.getEvoTreeDepth(evos), tree:evos }
    }

    getEvoTreeDepth(evos: any, depth = 0){
        let maxDepth = depth
        for(const evo in evos){
            const evoDepth = this.getEvoTreeDepth(evos[evo].evos, depth + 1)
            if(evoDepth > maxDepth) maxDepth = evoDepth
        }
        return maxDepth
    }

    getEvos2(pokemon: Pokemon, currentForm: string, evos = {}){
        if(currentForm === '') currentForm = 'base'
        let index = 0
        for(const form of pokemon.forms){
            const formName = form.name || 'base'
            const pkmId = `${pokemon.name}_${formName}`
            if((currentForm !='all' || formName.includes('gmax')) && formName !== currentForm )  continue;
            evos[pkmId] = {pkm: pokemon.name, evos: {}}

            if(!form.evolutions) {
                continue;
            }

            for (const evo of form.evolutions){
                const [evoPokemonName, evoFormName] = this.getFormName(evo.to)
                const evoId = `${evoPokemonName}_${evoFormName}`
                if(!evos[pkmId].evos) evos[pkmId].evos = {}
                const evoArray = evos[pkmId].evos
                if(!evoArray[evoId]){
                    evoArray[evoId] = {pkm: evoPokemonName, evos: {}}
                }
                const thisEvo = evoArray[evoId]
                if(! evoArray[evoId].methods){
                    evoArray[evoId].methods = []
                }
                evoArray[evoId].methods.push(evo)

                /*
                if (formName === currentForm || currentForm === 'all'){
                    const evoPkm = this.speciesByName[evoPokemonName]
                    let evoEvo = this.getEvos(evoPkm, evoFormName) as any
                    if(!evoEvo.methods){
                        evoEvo.methods = []
                    }
                    evoEvo.methods.push(evo)
                    
                    if (Object.keys(evoEvo).length === 0){
                        evoEvo = this.getEvos(evoPkm, 'all')
                        evos[pkmId].evos.push(evoEvo)
                        break;
                    }

                    evos[pkmId].evos.push(evoEvo)
                }*/
            }
            index++
        }
        return evos
    }
    
    getFormName(nombre:string){
        let [nombrePkm, forma] = [nombre, 'base']
        if(nombre.includes(' form:')){
            [nombrePkm, forma] = nombre.split(' form:')
        }
        if(nombre.includes(' f:')){
            [nombrePkm, forma] = nombre.split(' f:')
        }
        if(nombre.includes(' palette:')){
            [nombrePkm, forma] = nombre.split(' palette:')
        }
      
        return [nombrePkm, forma]
      }

      getDefensiveScore(type1: string, type2: string) {
        return getDeffensiveScore(type1, type2)
    }
    getDefensiveScoreRanking() {
        return getDeffensiveScoreRanking()
    }

    getOffensiveScoreRanking() {
        return getOffensiveScoreRanking()
    }

    getOverallRanking() {
        return getOverallScoreRanking()
    }

}