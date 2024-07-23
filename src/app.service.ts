import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MySQL2Service } from './_utils/MySQL2Service';
import { PokemonService } from './smartrotom/pokemon/pokemon.service';
import { LoggingUtil } from './_utils/LoggingUtils';

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
}
