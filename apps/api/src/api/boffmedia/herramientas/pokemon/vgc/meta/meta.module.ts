import { Module } from '@nestjs/common';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { ResponseModule } from '@api/_utils/response/response.module';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';

import { SmogonRepository } from './repositories/smogon.repository';
import { VgcPastesRepository } from './repositories/vgcpastes.repository';
import { PastesRepository } from './repositories/pastes.repository';
import { LimitlessRepository } from './repositories/limitless.repository';
import { VgcRegulationsRepository } from './repositories/regulations.repository';

import { SmogonService } from './services/smogon.service';
import { VgcPastesService } from './services/vgcpastes.service';
import { PokepasteService } from './services/pokepaste.service';
import { LimitlessService } from './services/limitless.service';
import { TeamsService } from './services/teams.service';
import { StatCalcService } from './services/stat-calc.service';

import { VgcMetaFacadeService } from './meta.facade.service';
import { VgcMetaController } from './meta.controller';

@Module({
  imports: [ResponseModule, LoggerModule, DrizzleModule],
  providers: [
    RolesGuard,
    SmogonRepository,
    VgcPastesRepository,
    PastesRepository,
    LimitlessRepository,
    VgcRegulationsRepository,
    SmogonService,
    VgcPastesService,
    PokepasteService,
    LimitlessService,
    TeamsService,
    StatCalcService,
    VgcMetaFacadeService,
  ],
  controllers: [VgcMetaController],
  exports: [VgcMetaFacadeService, StatCalcService, VgcRegulationsRepository],
})
export class VgcMetaModule {}
