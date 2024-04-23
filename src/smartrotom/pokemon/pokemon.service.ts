import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import *  as  path from 'path';
import Fuse from 'fuse.js'
import { google, sheets_v4 } from 'googleapis';
import { promises as fsPromises } from 'fs';
import { Pokemon } from '@/types/pokemon';
import { getDeffensiveScore, getDeffensiveScoreRanking, getOffensiveScoreRanking, getOverallScoreRanking, wolfeyTypeRanking } from './utils/types';
import { PokemonData } from './utils/pokemonData';
import { MoveData } from './utils/MoveData';
import { SpawnData } from './utils/SpawnData';

@Injectable()
export class PokemonService {
    pokemonData: PokemonData;
    moveData: MoveData;
    spawnData: SpawnData;

    async loadData(){
        this.pokemonData = new PokemonData();
        await this.pokemonData.loadPokemonDataAsync();

        this.moveData = new MoveData();
        this.spawnData = new SpawnData(this.pokemonData);

        
    }

    getMoves(id:number, formIndex: number){
        const pkm = this.pokemonData.speciesByDex[id] as Pokemon;
        const moves = pkm.forms[formIndex].moves || pkm.forms[0].moves

        const moveDataSet = {}
        
        
        Object.keys(moves).forEach((key) => {
            if(key === 'levelUpMoves'){
                const levelUpMoves = moves[key]
                levelUpMoves.forEach((levelUpMove) => {
                    levelUpMove.attacks.forEach((attack) => {
                        const moveData = this.moveData.movesByName[attack]
                        const moveDataShort  = {
                            name: moveData.attackName, type: moveData.attackType, 
                            category: moveData.attackCategory, power: moveData.basePower, 
                            pp: `${moveData.ppBase} - ${moveData.ppMax}`, accuracy: moveData.accuracy
                        }
                        
                        if(!moveDataSet[attack]) moveDataSet[attack] = moveDataShort
                    })
                })
            } else {
                const movesArray = moves[key]
                movesArray.forEach((move) => {
                    const moveData = this.moveData.movesByName[move]
                    if(!moveData) {
                        console.log(`Move ${move} not found`)
                        return
                    }
                    const moveDataShort  = {
                        name: moveData.attackName, type: moveData.attackType, 
                        category: moveData.attackCategory, power: moveData.basePower, 
                        pp: `${moveData.ppBase} - ${moveData.ppMax}`, accuracy: moveData.accuracy
                    }
                    if(!moveDataSet[move]) moveDataSet[move] = moveDataShort
                })
            }
        })
        
        return moveDataSet 

    }

    getImage({pokemonId= 1, formName = "base", paletteName = 'none', type='img'} : {pokemonId?: number, formName: string, paletteName?: string, type?: string}){
        const pokemon = this.pokemonData.speciesByDex[pokemonId] as Pokemon
        const form = pokemon.forms.find((f) => f.name === formName) || pokemon.forms[0]
       
        
        if(type === 'img') {
            const imageFolder = paletteName === 'shiny' ? 'Front Shiny' : paletteName === 'none' ? 'Front' : ''
            const pokemonImageName = formName == "base" ? pokemon.name.toUpperCase() : `${pokemon.name.toUpperCase()}_${form.name.toUpperCase()}`
    
            const image = path.join(__dirname, '../../../', 'public/smartrotom/img/sprites', imageFolder, `${pokemonImageName}.png`);
            if(fs.existsSync(image)) return {url: path.join('/smartrotom/img/sprites', imageFolder, `${pokemonImageName}.png`), type:'image'}
        }

        let palette;
        Object.values(form.genderProperties).forEach((genderProperty) => {
            genderProperty.palettes.forEach((p) => {
                if(p.name === paletteName) palette = p
                return
            })
        })
        
        if(!palette) {
            palette = form.genderProperties[0].palettes[0]
        }

        const sprite = palette?.sprite
        
        if(!sprite) {
            console.log(`Sprite not found for ${pokemon.name} ${formName} ${paletteName}`)
            return {url: 'assets/pixelmon/textures/pokemon/000_missingno/all/base/none/sprite.png'}
        }
        const url = `assets/pixelmon/textures/${sprite.split(':')[1]}`
        const defaultDirDef = path.join(__dirname, '../../../', 'public/smartrotom/packs/default_resourcepack', url);
        const publicDir = path.join(__dirname, '../../../', 'public/smartrotom/packs/resourcepack', url);
        
        if(fs.existsSync(defaultDirDef))  return {url: path.join('/smartrotom/packs/default_resourcepack', url), type:'sprite'}
        return {url: path.join('/smartrotom/packs/resourcepack', url), type:'sprite'}
    }

    getItemSprite(name: string){
        const itemFileName = name.replaceAll('_', '').toUpperCase()
        //console.log( path.join(__dirname, '../../../', 'public/smartrotom/img/sprites/items', itemFileName + '.png'))
        const sprite = path.join(__dirname, '../../../', 'public/smartrotom/img/sprites/items', itemFileName + '.png');

        if(fs.existsSync(sprite)) return {url: path.join('/smartrotom/img/sprites/items', itemFileName + '.png')}
        return {url: '/smartrotom/img/sprites/items/000.png'}
    }

    getAllSpawns(){
        return this.spawnData.spawnByPokemonAndForm
    }

    getSpawns(name: string){
        return this.spawnData.spawnByPokemonAndForm[name] || this.spawnData.spawnByPokemon[name.split('_')[0]] || []
    }

    getPokemonNames() {
        return this.pokemonData.pokemonList;
    }

    getAllPokemonByDex() {
        return this.pokemonData.speciesByDex;
    }

    getPokemonByDex(dex: number) {
        return this.pokemonData.speciesByDex[dex];
    }

    getManyPokemonByDex(dex: number[]) {
        return dex.map((d) => this.pokemonData.speciesByDex[d]);
    }
    
    getSpeciesByNameWithForm() {
        return this.pokemonData.speciesByNameWithForm;
    }

    getPokemon() {
        return this.pokemonData.species;
    }

    getPokemonByForm() {
        return this.pokemonData.speciesByForm;
    }

    getPokemonByPalette() {
        return this.pokemonData.speciesByPalette;
    }

    getPokemonByType() {
        return this.pokemonData.speciesByType;
    }

    getPokemonByEggGroup() {
        return this.pokemonData.speciesByEggGroup;
    }

    getPokemonByAbility() {
        return this.pokemonData.speciesByAbility;
    }

    countPokemon() {
        return this.pokemonData.species.length;
    }

    getPokemonByName(name: string) {
        // @ts-ignore
        const options: Fuse.IFuseOptions<any> = {
            includeScore: true,
            includeMatches: true,
            keys: ['name', 'nickname']
        }
        const fuse = new Fuse<any>(this.pokemonData.species, options);
        const result = fuse.search(name);
        return result.slice(0, 10)
    }

    getPokemonByName2(name: string) {
        // @ts-ignore
        const options: Fuse.IFuseOptions<any> = {
            includeScore: true,
            includeMatches: true
        }

        const fuse = new Fuse<any>(Object.keys(this.pokemonData.speciesByNameWithForm), options);
        const result = fuse.search(name);
        return result.slice(0, 5).map((res) => {
            return res.item.toLowerCase()
        })
    }

    getNextPrev(id: number) {
        const currIndex = Object.keys(this.pokemonData.speciesByDex).findIndex((dex) => parseInt(dex) === id);

        const next = currIndex < Object.keys(this.pokemonData.speciesByDex).length - 1 ? this.pokemonData.speciesByDex[Object.keys(this.pokemonData.speciesByDex)[currIndex + 1]] : this.pokemonData.speciesByDex[1];
        const prev = currIndex > 1 ? this.pokemonData.speciesByDex[Object.keys(this.pokemonData.speciesByDex)[currIndex - 1]] : this.pokemonData.speciesByDex[this.pokemonData.highestDex];
        

        return { prev, next }
    }


    getStatsByName(name: string) {
        // @ts-ignore
        const options: Fuse.IFuseOptions<string> = {
            includeScore: true,
            includeMatches: true,
            keys: ['name', 'nickname']
        }
        const fuse = new Fuse<any>(this.pokemonData.species, options);
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
        const pkm = this.pokemonData.speciesByDex[id] as Pokemon;
        let preEvo = pkm
        while(preEvo.forms[0].preEvolutions?.length > 0){
            const preEvoName = preEvo.forms[0].preEvolutions[0].toLowerCase()
            preEvo = this.pokemonData.speciesByName[preEvoName]
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
                evos[pkmId] = {pkm: pokemon.name, evos: {}, dex: pokemon.dex, index: form.index + 1}
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
                const evoFormIndex = this.pokemonData.speciesByName[evoPokemonName].forms?.findIndex((f) => f.name === evoFormName) > -1 ? this.pokemonData.speciesByName[evoPokemonName].forms?.findIndex((f) => f.name === evoFormName) : 0
                if(!evoArray[evoId]){
                    evoArray[evoId] = {pkm: evoPokemonName, evos: {}, dex: this.pokemonData.speciesByName[evoPokemonName].dex, index: evoFormIndex + 1}
                }
                
                const thisEvo = evoArray[evoId]
                if(! evoArray[evoId].methods){
                    evoArray[evoId].methods = []
                }
                evoArray[evoId].methods.push(evo)

                const evoPkm = this.pokemonData.speciesByName[evoPokemonName]
                let evoEvo = this.getEvos(evoPkm, evoFormName, evoArray[evoId]) as any
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
        nombre = nombre.toLowerCase()
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

    getPokemonNamePalette(){
        return this.pokemonData.speciesByNameFormPalette
    }
}