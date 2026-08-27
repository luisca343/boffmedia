import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { NotificationsModule } from '@api/boffmedia/notifications/notifications.module';
import { OutboxModule } from '@api/outbox/outbox.module';
import { TournamentsController } from './tournaments.controller';
import { TournamentsFacadeService } from './tournaments.facade.service';
import { TournamentsRepository } from './repositories/tournaments.repository';
import { TournamentsService } from './services/tournaments.service';
import { RegistrationService } from './services/registration.service';
import { BracketService } from './services/bracket.service';
import { MatchesService } from './services/matches.service';
import { StandingsService } from './services/standings.service';
import { PhasesService } from './services/phases.service';
import { AdvancementService } from './services/advancement.service';
import { EntryService } from './services/entry.service';
import { MatchReportService } from './services/match-report.service';
import { TournamentNotificationsService } from './services/tournament-notifications.service';
import { TournamentAnnouncerService } from './services/tournament-announcer.service';

@Module({
  imports: [DrizzleModule, NotificationsModule, OutboxModule],
  controllers: [TournamentsController],
  providers: [
    TournamentsRepository,
    TournamentsService,
    RegistrationService,
    BracketService,
    MatchesService,
    StandingsService,
    PhasesService,
    AdvancementService,
    EntryService,
    MatchReportService,
    TournamentNotificationsService,
    TournamentAnnouncerService,
    TournamentsFacadeService,
  ],
  // EntryService is exported for the lifecycle sweeper, which resolves a
  // tournament's field when its entry deadline passes.
  exports: [TournamentsFacadeService, EntryService],
})
export class TournamentsModule {}
