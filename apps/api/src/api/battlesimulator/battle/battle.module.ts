import { Module } from '@nestjs/common';
import { BattleGateway } from './battle.gateway';
import { MatchmakingService } from './matchmaking.service';
import { AchievementModule } from '@api/smartrotom/achievement/achievement.module';
import { ShowdownGateway } from '../showdown.gateway';
import { BattlesimController } from '../battlesim.controller';
import { BattlesimRepository } from '../battlesim.repository';
import { BattleTicketService } from '../battle-ticket.service';
import { PacksModule } from '@api/packs/packs.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { AuthModule } from '@api/auth/auth.module';
import { LigaModule } from '@api/smartrotom/liga/liga.module';

@Module({
  // PacksModule supplies PacksAuthService + PacksRepository, which
  // DesktopOrUserAuthGuard injects. Without it every guarded battlesim route
  // fails at RUNTIME with a DI error — it compiles perfectly either way, which
  // is why tcg.module.ts imports it for the same reason.
  // DrizzleModule provides Symbol(DRIZZLE), which BattlesimRepository injects.
  imports: [
    AchievementModule,
    // PacksAuthService + PacksRepository, injected by DesktopOrUserAuthGuard.
    PacksModule,
    // Symbol(DRIZZLE), injected by BattlesimRepository.
    DrizzleModule,
    // AuthModule re-exports JwtModule, which BattleTicketService signs with.
    // Registering a second JwtModule here would put two JwtService providers in
    // scope for the same secret — see the same note in packs.module.ts.
    AuthModule,
    // ReplayService, injected by BattlesimController for the league-replay
    // route (audit B14). LigaModule already exports it. Without this import the
    // app type-checks and then fails to BOOT on an unresolvable dependency —
    // the N19/A6 trap, which no gate in this repo can see.
    LigaModule,
  ],
  controllers: [BattlesimController],
  providers: [BattleGateway, MatchmakingService, ShowdownGateway, BattlesimRepository, BattleTicketService],
  exports: [MatchmakingService],
})
export class BattleModule {}
