import {
  Controller,
  Get,
  Param,
  NotFoundException,
  ForbiddenException,
  HttpStatus,
  StreamableFile,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EventsService } from './services/events.service';
import { AssignmentsService } from './services/assignments.service';
import {
  PublicEventDto,
  PublicAssignmentDto,
} from './dto/randomizer.dto';
import {
  RandomizerEventStatus,
  RandomizerAssignmentStatus,
} from '@/_db/schema/Randomizer';

/**
 * Public randomizer endpoints — NO AUTH REQUIRED.
 * Expose tournament event listings, participant assignments, and settings/logs
 * only when the event is finished (transparent, verifiable tournament results).
 *
 * Security invariant: seeds, settings blobs, and logs are gated on
 * event.status === 'finished' and enforced at the service layer (not just
 * the DTO layer).
 */
@ApiTags('Randomizer | Public')
@Controller('randomizer/public')
export class RandomizerPublicController {
  constructor(
    private readonly events: EventsService,
    private readonly assignments: AssignmentsService,
  ) {}

  /**
   * GET /randomizer/public/tournaments/:tournamentId/events
   *
   * List all events for a tournament (public view).
   * Includes: id, gamePlatform, gameTitle, romHint, cleanRomSha512, fvxJarSha512,
   *           status, packId, createdAt.
   * ONLY when finished: settingsBlobSha512.
   */
  @Get('tournaments/:tournamentId/events')
  @ApiOperation({
    summary: 'List tournament randomizer events (public)',
    description: 'No auth required. Returns event list; settings blob hash only when finished.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: [PublicEventDto] })
  async listTournamentEvents(
    @Param('tournamentId') tournamentId: string,
  ): Promise<PublicEventDto[]> {
    const events = await this.events.listEventsByTournament(
      Number(tournamentId),
    );

    return events.map((e) => ({
      id: e.id,
      tournamentId: e.tournamentId,
      gamePlatform: e.gamePlatform,
      gameTitle: e.gameTitle,
      cleanRomSha512: e.cleanRomSha512,
      romHint: e.romHint,
      fvxJarSha512: e.fvxJarSha512,
      status: e.status as RandomizerEventStatus,
      packId: e.packId,
      createdAt: e.createdAt,
      // Include settings blob hash only when finished
      ...(e.status === 'finished' && { settingsBlobSha512: e.settingsBlobSha512 }),
    }));
  }

  /**
   * GET /randomizer/public/events/:eventId/assignments
   *
   * List all assignments for an event (public view).
   * Includes: id, eventId, participantName, status, outputSha512, claimedAt, patchedAt, verifiedAt, createdAt.
   * ONLY when event.status === 'finished': seed.
   *
   * Enforced at the service layer to prevent accidental exposure.
   */
  @Get('events/:eventId/assignments')
  @ApiOperation({
    summary: 'List event assignments with participant status (public)',
    description: 'No auth required. Seed revealed only when event is finished.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: [PublicAssignmentDto] })
  async listEventAssignments(
    @Param('eventId') eventId: string,
  ): Promise<PublicAssignmentDto[]> {
    const assignments =
      await this.assignments.listAssignmentsForPublic(Number(eventId));

    return assignments;
  }

  /**
   * GET /randomizer/public/events/:eventId/settings
   *
   * Download the event's settings .rnqs blob.
   * ONLY available when event.status === 'finished'.
   * Returns 403 if not finished, 404 if not found.
   */
  @Get('events/:eventId/settings')
  @ApiOperation({
    summary: 'Download event settings file (.rnqs)',
    description: 'Only available after event is finished. Returns 403 if not finished.',
  })
  @ApiResponse({ status: HttpStatus.OK })
  async getEventSettings(
    @Param('eventId') eventId: string,
  ): Promise<StreamableFile> {
    const blob = await this.assignments.getEventSettingsBlob(
      Number(eventId),
    );

    return new StreamableFile(blob, {
      type: 'application/octet-stream',
      disposition: 'attachment; filename="settings.rnqs"',
    });
  }

  /**
   * GET /randomizer/public/events/:eventId/assignments/:assignmentId/log
   *
   * Stream the randomizer log for an assignment.
   * ONLY available when event.status === 'finished'.
   * Returns 403 if not finished, 404 if not found.
   */
  @Get('events/:eventId/assignments/:assignmentId/log')
  @ApiOperation({
    summary: 'Download assignment log file (public)',
    description: 'Only available after event is finished. Returns 403 if not finished.',
  })
  @ApiResponse({ status: HttpStatus.OK })
  async getAssignmentLog(
    @Param('eventId') eventId: string,
    @Param('assignmentId') assignmentId: string,
  ): Promise<StreamableFile> {
    const logBlob = await this.assignments.getPublicAssignmentLog(
      Number(eventId),
      Number(assignmentId),
    );

    return new StreamableFile(logBlob, {
      type: 'application/octet-stream',
      disposition: 'attachment',
    });
  }
}
