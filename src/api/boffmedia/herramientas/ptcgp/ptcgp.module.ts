import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PtcgpController } from './ptcgp.controller';
import { ConfigService } from '@api/config.service';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { PtcgpRepository } from '@api/_repositories/ptcgp.repository';
import { CardService } from './services/card.service';
import { PackService } from './services/pack.service';
import { UserCardService } from './services/user-card.service';
import { ScraperService } from './services/scraper.service';
import { PtcgpFacadeService } from './ptcgp.facade.service';

@Module({
  imports: [
    ConfigModule,
    DrizzleModule,
  ],
  controllers: [PtcgpController],
  providers: [
    PtcgpRepository,
    
    // Service Layer
    CardService,
    PackService,
    UserCardService,
    ScraperService,
    
    PtcgpFacadeService,
    
    ConfigService,
  ],
  exports: [
    PtcgpFacadeService,
    
    CardService,
    PackService,
    UserCardService,
    ScraperService,
  ],
})
export class PtcgpModule {}