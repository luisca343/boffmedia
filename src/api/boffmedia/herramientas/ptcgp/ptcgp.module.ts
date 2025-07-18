import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PtcgpController } from './ptcgp.controller';
import { ConfigService } from '@api/config.service';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { PtcgpRepository } from './repositories/ptcgp.repository';
import { CardService } from './services/card.service';
import { PackService } from './services/pack.service';
import { UserCardService } from './services/user-card.service';
import { ScraperService } from './services/scraper.service';
import { PtcgpFacadeService } from './ptcgp.facade.service';
import { PTCGP_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

@Module({
  imports: [
    ConfigModule,
    DrizzleModule,
  ],
  controllers: [PtcgpController],
  providers: [
    // Repository Layer with Dependency Injection
    {
      provide: PTCGP_REPOSITORY_TOKEN,
      useClass: PtcgpRepository,
    },
    
    // Service Layer
    CardService,
    PackService,
    UserCardService,
    ScraperService,
    
    // Facade Layer
    PtcgpFacadeService,
    
    // Configuration
    ConfigService,
  ],
  exports: [
    // Facade Service for external modules
    PtcgpFacadeService,
    
    // Individual services for granular access
    CardService,
    PackService,
    UserCardService,
    ScraperService,
    
    // Repository token for other modules that might need direct access
    PTCGP_REPOSITORY_TOKEN,
  ],
})
export class PtcgpModule {}