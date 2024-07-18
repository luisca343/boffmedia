import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import *  as  path from 'path';
import Fuse from 'fuse.js'
import { google, sheets_v4 } from 'googleapis';
import { GenderProperties, Pokemon } from '@/types/pokemon';
import { getDeffensiveScore, getDeffensiveScoreRanking, getOffensiveScoreRanking, getOverallScoreRanking, wolfeyTypeRanking } from './utils/types';
import { PokemonData } from './utils/PokemonData';
import { MoveData } from './utils/MoveData';
import { SpawnData } from './utils/SpawnData';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { PokedexRegistry, pokedexRegistry } from '@/_db/schema/SmartRotomPokedex';
import { and, desc, eq } from 'drizzle-orm';
import { MySqlRawQueryResult } from 'drizzle-orm/mysql2';
import { spawn } from 'child_process';

@Injectable()
export class PokemonService {
    constructor(
        private db: MySQL2Service,
    ) {}
    pokemonData: PokemonData;
    moveData: MoveData;
    spawnData: SpawnData;
    dexCache = {} as {date: Date, data: any}

    async loadData(){
        const startingTime = Date.now();
        this.pokemonData = new PokemonData();
        this.moveData = new MoveData();
        this.spawnData = new SpawnData(this.pokemonData);

        await this.pokemonData.loadPokemonData();
        await this.moveData.loadMoveData();
        await this.spawnData.loadSpawnData();

        console.log(`Se han cacheado los datos de la Pokédex en ${Date.now() - startingTime}ms`);
        
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
                        if(!moveData) {
                            console.log(`Move ${attack} not found`)
                            return
                        }
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

    excludedForms = ['teras', 'terasmega', 'omnitrix']

    async getImage({pokemonId= 1, formName = "base", paletteName = 'none', uuid, type='img', hide} : {pokemonId?: number, formName: string, paletteName?: string,uuid:string, type?: string, hide?: number}) {
        const pokemon = this.pokemonData.speciesByDex[pokemonId] as Pokemon
        const form = pokemon.forms.find((f) => f.name === formName) || pokemon.forms[0]
        let status
        
        status = 0
        //this.excludedForms.includes(formName) ? status = 0 : status = 1

        if(pokemonId > 0) {
            if(!this.dexCache[uuid] || new Date().getTime() - this.dexCache[uuid].date.getTime() > 1000){
                const pokemonStatus = await this.db.getDrizzle()
                .select().from(pokedexRegistry)
                .where(and(
                    eq(pokedexRegistry.uuid, uuid),
                )).execute()
                this.dexCache[uuid] = {date: new Date(), data: pokemonStatus}
            } 
            const pokemonStatus = this.dexCache[uuid].data
            const pokemonStatusFiltered = hide == 1 
                ? pokemonStatus.filter((p) => p.pokemonId == pokemonId && p.formId === formName && p.paletteId === paletteName) 
                : pokemonStatus.filter((p) => p.pokemonId == pokemonId && p.formId === formName)

            if(pokemonStatusFiltered.length > 0) {
                status = pokemonStatusFiltered[0].caughtAt ? 2 : pokemonStatusFiltered[0].seenAt ? 1 : 0
            }


            /*
            const pokemonStatus = await this.db.getDrizzle()
                .select().from(pokedexRegistry)
                .where(and(
                    eq(pokedexRegistry.uuid, uuid),
                    eq(pokedexRegistry.pokemonId, pokemonId),
                    eq(pokedexRegistry.formId, formName || 'base'),
                    eq(pokedexRegistry.paletteId, paletteName || 'none')
                )).execute()*/

            //status = pokemonStatus.length > 0 ? 1 : 0
        }
        
        let showImg = status !== 0
        
        showImg = true
        //!this.excludedForms.includes(formName) && pokemonId < 2000 ? showImg = true : null

        if(type === 'img') {
            const imageFolder = paletteName === 'shiny' ? 'Front Shiny' : paletteName === 'none' ? 'Front' : ''
            const pokemonImageName = formName == "base" ? pokemon.name.toUpperCase() : `${pokemon.name.toUpperCase()}_${form.name.toUpperCase()}`
    
            const image = path.join(__dirname, '../../../', 'public/smartrotom/img/sprites', imageFolder, `${pokemonImageName}.png`);
            if(fs.existsSync(image)) return {url: path.join('/smartrotom/img/sprites', imageFolder, `${pokemonImageName}.png`), type:'image', status, showImg}
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
        

        const sprite = this.getSpriteURL(palette, pokemonId)
         
        const url = `assets/pixelmon/textures/${sprite.split(':')[1]}`
        const defaultDirDef = path.join(__dirname, '../../../', 'public/smartrotom/packs/default_resourcepack', url);
        const publicDir = path.join(__dirname, '../../../', 'public/smartrotom/packs/resourcepack', url);
        
        if(fs.existsSync(defaultDirDef))  return {url: path.join('/smartrotom/packs/default_resourcepack', url), type:'sprite', status, showImg}
        if(fs.existsSync(publicDir)) return {url: path.join('/smartrotom/packs/resourcepack', url), type:'sprite', status, showImg}
        return {url: '/smartrotom/packs/default_resourcepack/assets/pixelmon/textures/pokemon/000_missingno/all/base/none/sprite.png', status, showImg}
    }

    getSpriteURL(palette, pokemonId?: number){
        if(pokemonId == 774) return 'pixelmon:pokemon/774_minior/all/meteor/none/sprite.png'
        return palette?.sprite?.resource ? palette.sprite.resource : palette.sprite
    }

    getItemSprite(name: string){
        const itemFileName1 = name.replaceAll('_', '').toUpperCase()
        const itemFileName2 = name
        //console.log( path.join(__dirname, '../../../', 'public/smartrotom/img/sprites/items', itemFileName + '.png'))
        const sprite = path.join(__dirname, '../../../', 'public/smartrotom/img/sprites/items', itemFileName1 + '.png');
        const sprite2 = path.join(__dirname, '../../../', 'public/smartrotom/img/sprites/items/other', itemFileName2 + '.png');
        if(fs.existsSync(sprite)) return {url: path.join('/smartrotom/img/sprites/items', itemFileName1 + '.png')}
        if(fs.existsSync(sprite2)) return {url: path.join('/smartrotom/img/sprites/items/other', itemFileName2 + '.png')}
        return {url: '/smartrotom/img/sprites/items/000.png'}
    }

    getAllSpawns(){
        return this.spawnData.spawnByPokemonAndForm
    }

    getSpawns(name: string){
        return this.spawnData.spawnByPokemon[name.split('_')[0]] || []
        //return this.spawnData.spawnByPokemonAndForm[name] || this.spawnData.spawnByPokemon[name.split('_')[0]] || []
    }

    getAllSpawnsByPokemon(pokemon: string){
        return this.spawnData.spawnByPokemonAndForm[pokemon] || this.spawnData.spawnByPokemon[pokemon.split('_')[0]] || []
    }

    getPokemonNames() {
        return this.pokemonData.pokemonList;
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

    getPokemonByName(name: string, amount = 16) {
        // @ts-ignore
        const options: Fuse.IFuseOptions<any> = {
            includeScore: false,
            includeMatches: false,
            keys: ['name', 'nickname']
        }
        const fuse = new Fuse<any>(this.pokemonData.species, options);
        const result = fuse.search(name);
        return result.slice(0, amount)
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

    getOverallRanking() {
        return getOverallScoreRanking()
    }

    getPokemonNamePalette(){
        return this.pokemonData.speciesByNameFormPalette
    }

    getFormId(pokemonId: number, form: string){
        return this.pokemonData.speciesByDex[pokemonId].forms.find((f) => f.name === form).index
    }

    getPaletteId(pokemonId: number, form: string, palette: string){
        const formGenderProperties = this.pokemonData.speciesByDex[pokemonId].forms.find((f) => f.name === form).genderProperties as GenderProperties[]
        return formGenderProperties.find((g) => g.palettes.find((p) => p.name === palette)).palettes.findIndex((p) => p.name === palette)
    }

    getPokemonNameByDex(dex: number){
        return this.pokemonData.speciesByDex[dex].name
    }

    async registerPokemon(uuid: string, pokemonId: number, form: string, palette: string, status: number){
        // Al evolucionar solo se está regisstrando como capturado
        console.log('REGISTERING POKEMON')
        console.log(uuid, pokemonId, form, palette, status)
        
        const formId = form || 'base'
        const paletteId = palette || 'none'
        
        const res = await this.db.getDrizzle()
            .select({seenAt: pokedexRegistry.seenAt, caughtAt: pokedexRegistry.caughtAt})
            .from(pokedexRegistry)
            .where(and(
                eq(pokedexRegistry.uuid, uuid),
                eq(pokedexRegistry.pokemonId, pokemonId),
                eq(pokedexRegistry.formId, formId || 'base'),
                eq(pokedexRegistry.paletteId, paletteId || 'none')
            )).execute()
        
            console.log(res.length)
            if(res.length === 0){
                console.log('INSERTING')
                let caughtAt = status === 1 ? new Date() : null
                const result = await this.db.getDrizzle()
                .insert(pokedexRegistry)
                .values({uuid, pokemonId, formId, paletteId, seenAt: new Date(), caughtAt})
                .execute() as MySqlRawQueryResult
                if(result[0].affectedRows === 1) {
                    const pokemonName = this.getPokemonNameByDex(pokemonId)
                    return  {success: true, type:'pokedex_event', uuid, pokemonName, form, palette, status}
                }
            } 

            if(status === 1){
                console.log('INSERTING 2')
                const registry = res[0] as PokedexRegistry
                if(registry.caughtAt !== null) return {success: false, message: 'Pokemon already caught'}
                const result = await this.db.getDrizzle().update(pokedexRegistry).set({caughtAt: new Date()})
                    .where(and(
                        eq(pokedexRegistry.uuid, uuid),
                        eq(pokedexRegistry.pokemonId, pokemonId),
                        eq(pokedexRegistry.formId, formId),
                        eq(pokedexRegistry.paletteId, paletteId)
                    )).execute() as MySqlRawQueryResult

                if(result[0].affectedRows === 1) {
                    const pokemonName = this.getPokemonNameByDex(pokemonId)
                    return  {success: true, type:'pokedex_event', uuid, pokemonName, form, palette, status}
                }
            }
    }

    async getPokedex(uuid: string){
        const dex = await this.db.getDrizzle()
            .selectDistinct({pokemonId: pokedexRegistry.pokemonId, seenAt: pokedexRegistry.seenAt, caughtAt: pokedexRegistry.caughtAt, paletteId: pokedexRegistry.paletteId})
            .from(pokedexRegistry)
            .where(eq(pokedexRegistry.uuid, uuid))
            .execute()

        const seenUniquePokemonIds = new Set(dex.filter((p) => p.seenAt !== null).map((p) => p.pokemonId));    
        const caughtUniquePokemonIds = new Set(dex.filter((p) => p.caughtAt !== null).map((p) => p.pokemonId));

     

        const seenPokemon = seenUniquePokemonIds.size;
        const caughtPokemon = caughtUniquePokemonIds.size;

        const shinyPokemon = dex.filter((p) => p.paletteId === 'shiny' && p.caughtAt !== null).length 
        const totalPokemon = this.pokemonData.species.length
        const missingPokemon = totalPokemon - seenPokemon
        const missingCaugthPokemon = totalPokemon - caughtPokemon

        return {seenPokemon, caughtPokemon, totalPokemon, missingPokemon, missingCaugthPokemon, shinyPokemon}
    }

    async getRegistries(uuid: string){
        const dex = await this.db.getDrizzle()
            .select({pokemonId: pokedexRegistry.pokemonId, formId: pokedexRegistry.formId, paletteId: pokedexRegistry.paletteId, seenAt: pokedexRegistry.seenAt, caughtAt: pokedexRegistry.caughtAt})
            .from(pokedexRegistry)
            .where(eq(pokedexRegistry.uuid, uuid))
            .orderBy(desc(pokedexRegistry.id))
            .limit(20)
            .execute()
        return dex
    }

    async getBiomesByPokemonName(name: string){
        // @ts-ignore
        const options: Fuse.IFuseOptions<any> = {
            includeScore: false,
            includeMatches: false,
            keys: ['name', 'nickname']
        }
        const pkmName = await this.getPokemonByName(name, 1)[0].item.name
        const fuse = new Fuse<any>(Object.keys(this.spawnData.spawnByPokemonAndForm), options);
        const result = fuse.search(pkmName);
        const resName = result[0].item
        
        const biomes = []

        this.spawnData.spawnByPokemonAndForm[resName].forEach((spawn) => {
            spawn.condition?.stringBiomes?.forEach((biome) => {
                if(!biomes.includes(biome)) biomes.push(biome)
            })
        })
        

        return {biomes, name: pkmName}
    }

    async getPokemonSprite(spawn: any, total: number){
        const pkmName = spawn.pokemonName
        const pkmForm = spawn.pokemonForm
        const pkmPalette = spawn.pokemonPalette || 'none'
        const pkm = this.pokemonData.speciesByName[pkmName] as Pokemon

        return { dex: pkm.dex, species: pkm.name, form: pkmForm, palette: pkmPalette, rarity: spawn.rarity, percentage: (spawn.rarity / total) * 100}
    }
    
    async getPokemonByBiome(name: string){
        const biomeData = this.spawnData.spawnByBiome[name]
        const spawns = {}as {[key: string]: [{
            dex: number;
            species: string;
            form: string;
            palette: string;
            rarity: number;
            percentage: number;
        }]}

        const totals = {} as {[key: string]: number}
        const pokemonAcc = {} as {[key: string]: {
            dex: number;
            species: string;
            form: string;
            palette: string;
            rarity: number;
            percentage: number;
        }}

        biomeData.forEach(async (spawn) => {
            if(!totals[spawn.spawnType]) totals[spawn.spawnType] = 0
            totals[spawn.spawnType]+= spawn.rarity
        })
        

        for (const spawn of biomeData) {
            const id = `${spawn.spawnType}_${spawn.pokemonName}${spawn.pokemonForm}${spawn.pokemonPalette}`;
            if (!spawns[spawn.spawnType]) spawns[spawn.spawnType] = [] as any;
            if (!pokemonAcc[id]) {
                pokemonAcc[id] = await this.getPokemonSprite(spawn, totals[spawn.spawnType]);
            } else {
                pokemonAcc[id].rarity += spawn.rarity;
                pokemonAcc[id].percentage = (pokemonAcc[id].rarity / totals[spawn.spawnType]) * 100;
            }
        }

        // For each pokemonAcc, we need to add it to the spawns object
        for(const key in await pokemonAcc){
            spawns[key.split('_')[0]].push(pokemonAcc[key])
        }
        

        // Before returning the data, we need to sort it by rarity
        for(const key in await spawns){
            spawns[key] = spawns[key].sort((a, b) => b.rarity - a.rarity)
        }

        // Sort the spawn types by amount of pokemon
        const sortedSpawns = Object.keys(spawns).sort((a, b) => spawns[b].length - spawns[a].length)
        const sortedSpawnsObj = {} as {[key: string]: any}
        sortedSpawns.forEach((key) => {
            sortedSpawnsObj[key] = spawns[key]
        })

        
        return sortedSpawnsObj
    }

    // Get all the biomes, and the amount of pokemon that spawn in each biome, sorted by amount of pokemon
    async getBiomes(){
        const biomes = {} as {[key: string]: number}
        const biomeData = this.spawnData.spawnByBiome
        for(const key in biomeData){
            const pokemonInBiome = await this.getPokemonByBiome(key) as any

            let count = 0

            Object.entries(pokemonInBiome).forEach(([key, value]) => {
                count += Object.values(value).length
            })


            biomes[key] = count
        }

        const sortedBiomes = Object.keys(biomes).sort((a, b) => biomes[b] - biomes[a])
        const sortedBiomesObj = {} as {[key: string]: number}
        sortedBiomes.forEach((key) => {
            sortedBiomesObj[key] = biomes[key]
        })

        return sortedBiomesObj
    }

    async test(){
        // @ts-ignore
        const options: Fuse.IFuseOptions<any> = {
            includeScore: false,
            includeMatches: false,
            keys: ['name', 'nickname']
        }
        const pkmName = await this.getPokemonByName("Garganacl", 1)[0].item.name
        const fuse = new Fuse<any>(Object.keys(this.spawnData.spawnByPokemonAndForm), options);
        const result = fuse.search(pkmName);
        const resName = result[0].item
        
        const biomes = []

        this.spawnData.spawnByPokemonAndForm[resName].forEach((spawn) => {
            spawn.condition?.stringBiomes?.forEach((biome) => {
                if(!biomes.includes(biome)) biomes.push(biome)
            })
        })

        return biomes
    }
}