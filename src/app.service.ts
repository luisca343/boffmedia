import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MySQL2Service } from './_utils/MySQL2Service';
import { PokemonService } from './smartrotom/pokemon/pokemon.service';
import { LoggingUtil } from './_utils/LoggingUtils';

import { google, sheets_v4 } from 'googleapis';

import fs from 'fs/promises';
import path from 'path';

@Injectable()
export class AppService {
  constructor(
    private configService: ConfigService,
    private db: MySQL2Service,
    private pokemonService: PokemonService,
  ) {
    db.migrar();
    pokemonService.loadData();
  }

  getDBPort(): number {
    return this.configService.get<number>('DB_PORT');
  }

  uploadFile(file: Express.Multer.File) {
    console.log(file);
  }

  toggleLogging() {
    return LoggingUtil.getInstance().toggleLogging();
  }

  async blogicons() {
    const iconsFolderPath = path.join(process.cwd(), 'public/blog', 'icons');

    console.log('Reading files from:', iconsFolderPath);
    try {
      const files = await fs.readdir(iconsFolderPath);
      const filesObj = files.reduce((acc, file) => {
        acc[file.split('.')[0]] = `https://api.boffmedia.es/blog/icons/${file}`;
        return acc;
      }, {});
      console.log('Files:', filesObj);
      return filesObj;
    } catch (error) {
      console.error('Error reading the icons folder:', error);
      console.error('Error reading the icons folder:', error);
      return []; // Return an empty array in case of an error
    }
  }

  async steamKeys() {
        //AIzaSyCxjks7gBH5U1FtDd_Y1QOvOciSlr1XtQE
        const auth = new google.auth.GoogleAuth({
          keyFile: 'boffmedia-a39cdd7a63c7.json',
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
      
  
   
      const client = await auth.getClient() as any;
      const sheets = google.sheets({ version: 'v4', auth: client }) as sheets_v4.Sheets;
   
         const spreadsheetId = '1mQopLvsmDuz5iHJ9WVN5NLH78UsKrK6E364v3i8a00c';
          const range = 'A2:D';
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
          });

          const rows = response.data.values;
          // We send everything except the "key" column
          return rows.map((row) => {
            return {
              name: row[0],
              source: row[1],
              claimed: row[3],
            };
          });
  }
}
