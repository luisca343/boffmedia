import { Module, forwardRef } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { NotificationsModule } from '@api/boffmedia/notifications/notifications.module';
import { OutboxModule } from '@api/outbox/outbox.module';
import { TournamentsController } from './tournaments.controller';
import { TournamentsFacadeService } from './tournaments.facade.service';
import { TournamentsRepository } from './repositories/tournaments.repository';
import { AuditRepository } from '@api/_repositories/boffmedia/audit.repository';
import { AuditService } from '@api/_repositories/audit.service';
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
  // forwardRef on OutboxModule: it forwardRefs this module back, and a direct
  // import here means whichever of the two is reached first sees `undefined` in
  // the other's imports array.
  imports: [
    DrizzleModule,
    NotificationsModule,
    forwardRef(() => OutboxModule),
  ],
  controllers: [TournamentsController],
  providers: [
    TournamentsRepository,
    // MatchesService and MatchReportService write audit rows for score changes.
    // Both are declared here rather than imported from a shared module because
    // that is how EventsModule already wires the same pair; AuditService is
    // stateless, so the second instance costs nothing.
    AuditService,
    AuditRepository,
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
