import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import *  as  path from 'path';
import Fuse from 'fuse.js'
import { google, sheets_v4 } from 'googleapis';

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
        // @ts-ignore
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
        // @ts-ignore
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