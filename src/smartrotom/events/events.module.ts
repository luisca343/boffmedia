import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { ResponseModule } from '@/response/response.module';
import { LoggerModule } from '@/logger/logger.module';
import { DrizzleModule } from '@/drizzle/drizzle.module';

// Import all repositories
import { EventsRepository } from './repositories/events.repository';
import { GamesRepository } from './repositories/games.repository';
import { AchievementsRepository } from './repositories/achievements.repository';
import { ParticipantsRepository } from './repositories/participants.repository';
import { TeamsRepository } from './repositories/teams.repository';

// Import all domain services
import { EventsService } from './services/events.service';
import { GamesService } from './services/games.service';
import { AchievementsService } from './services/achievements.service';
import { ParticipantsService } from './services/participants.service';
import { TeamsService } from './services/teams.service';
import { ProgressService } from './services/progress.service';
import { LeaderboardsService } from './services/leaderboards.service';

// Import facade service
import { EventsFacadeService } from './events.facade.service';

@Module({
  providers: [
    // Repositories
    EventsRepository,
    GamesRepository,
    AchievementsRepository,
    ParticipantsRepository,
    TeamsRepository,
    
    // Domain services
    EventsService,
    GamesService,
    AchievementsService,
    ParticipantsService,
    TeamsService,
    ProgressService,
    LeaderboardsService,
    
    // Facade service
    EventsFacadeService,
  ],
  controllers: [EventsController],
  exports: [
    // Export facade service as the main interface
    EventsFacadeService,
    
    // Also export individual services for use by other modules if needed
    EventsService,
    GamesService,
    AchievementsService,
    ParticipantsService,
    TeamsService,
    ProgressService,
    LeaderboardsService,
  ],
  imports: [ResponseModule, LoggerModule, DrizzleModule],
})
export class EventsModule {}