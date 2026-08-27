import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { ResponseModule } from '@api/_utils/response/response.module';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { NotificationsModule } from '@api/boffmedia/notifications/notifications.module';
import { ScheduleModule } from '@nestjs/schedule';
import { LifecycleSweeperService } from '../lifecycle-sweeper.service';
import { LifecycleSweeperRepository } from '../lifecycle-sweeper.repository';
import { TournamentsModule } from '../tournaments/tournaments.module';

// Import all repositories
import { EventsRepository } from './repositories/events.repository';
import { EventInvitesRepository } from './repositories/event-invites.repository';
import { GamesRepository } from '../../_repositories/boffmedia/games.repository';
import { AchievementsRepository } from '../../_repositories/boffmedia/achievements.repository';
import { ParticipantsRepository } from '../../_repositories/boffmedia/participants.repository';
import { TeamsRepository } from '../../_repositories/boffmedia/teams.repository';
import { AuditRepository } from '../../_repositories/boffmedia/audit.repository';
import { AuditService } from '../../_repositories/audit.service';

// Import all domain services
import { EventsService } from './services/events.service';
import { GamesService } from './services/games.service';
import { AchievementsService } from './services/achievements.service';
import { ParticipantsService } from './services/participants.service';
import { EventInvitesService } from './services/event-invites.service';
import { TeamsService } from './services/teams.service';
import { ProgressService } from './services/progress.service';
import { LeaderboardsService } from './services/leaderboards.service';
import { ProfileService } from './services/profile.service';

// Import facade service
import { EventsFacadeService } from './events.facade.service';

@Module({
  providers: [
    // Unified audit service across all domains
    AuditService,

    // Repositories
    EventsRepository,
    EventInvitesRepository,
    GamesRepository,
    AchievementsRepository,
    ParticipantsRepository,
    TeamsRepository,
    AuditRepository,
    LifecycleSweeperRepository,

    // Domain services
    EventsService,
    GamesService,
    AchievementsService,
    ParticipantsService,
    EventInvitesService,
    TeamsService,
    ProgressService,
    LeaderboardsService,
    ProfileService,

    // Facade service
    EventsFacadeService,

    // The clock: activates dated events, closes elapsed windows, sweeps.
    LifecycleSweeperService,
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
    EventInvitesService,
    TeamsService,
    ProgressService,
    LeaderboardsService,
    ProfileService,
  ],
  imports: [
    ResponseModule,
    LoggerModule,
    DrizzleModule,
    NotificationsModule,
    ScheduleModule.forRoot(),
    // For EntryService: the sweeper freezes tournament fields at their deadline.
    TournamentsModule,
  ],
})
export class EventsModule {}
