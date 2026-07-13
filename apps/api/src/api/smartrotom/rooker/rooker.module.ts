import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { NotificationsModule } from '../notifications/notifications.module';
// PokemonModule exports PokemonDataManagementService — the only source of the
// total species count that dexPct is a percentage of.
import { PokemonModule } from '../pokemon/pokemon.module';
import { RookerController } from './rooker.controller';
import { RookerRepository } from './rooker.repository';
import { RookerService } from './rooker.service';

@Module({
  imports: [DrizzleModule, NotificationsModule, PokemonModule],
  controllers: [RookerController],
  providers: [RookerRepository, RookerService],
  exports: [RookerService],
})
export class RookerModule {}
