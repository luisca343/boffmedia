import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MySQL2Service } from './_utils/MySQL2Service';
import { PokemonService } from './smartrotom/pokemon/pokemon.service';
import { LoggingUtil } from './_utils/LoggingUtils';

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
}
