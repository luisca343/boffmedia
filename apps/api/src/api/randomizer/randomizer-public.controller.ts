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
import { Public } from '@api/_utils/decorators/public.decorator';
import { EventsService } from './services/events.service';
import { AssignmentsService } from './services/assignments.service';
import {
  PublicConfigDto,
  PublicAssignmentDto,
} from './dto/randomizer.dto';
import {
  RandomizerConfigStatus,
  RandomizerAssignmentStatus,
} from '@/_db/schema/Randomizer';

/**
 * Public randomizer endpoints — NO AUTH REQUIRED.
 * Expose config listings, participant assignments, and settings/logs
 * only when the config is published (transparent, verifiable results).
 *
 * Security invariant: seeds, settings blobs, and logs are gated on
 * config.status === 'published' and enforced at the service layer (not just
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
   * GET /randomizer/public/events/:eventId/config
   *
   * Get the config for an event (public view).
   * Includes: id, eventId, gamePlatform, gameTitle, romHint, cleanRomSha512, fvxJarSha512, status.
   * ONLY when published: settingsBlobSha512.
   */
  @Public()
  @Get('events/:eventId/config')
  @ApiOperation({
    summary: 'Get randomizer config for an event (public)',
    description: 'No auth required. Settings blob hash only when published.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: PublicConfigDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'No config found for event' })
  async getEventConfig(
    @Param('eventId') eventId: string,
  ): Promise<PublicConfigDto> {
    const config = await this.events.getConfigByEventId(Number(eventId));
    if (!config) {
      throw new NotFoundException(
        `No randomizer config found for event ${eventId}`,
      );
    }

    return {
      id: config.id,
      eventId: config.eventId,
      gamePlatform: config.gamePlatform,
      gameTitle: config.gameTitle,
      cleanRomSha512: config.cleanRomSha512,
      romHint: config.romHint,
      fvxJarSha512: config.fvxJarSha512,
      status: config.status as RandomizerConfigStatus,
      createdAt: config.createdAt,
      // Include settings blob hash only when published
      ...(config.status === 'published' && { settingsBlobSha512: config.settingsBlobSha512 }),
    };
  }

  /**
   * GET /randomizer/public/events/:eventId/assignments
   *
   * List all assignments for an event's config (public view).
   * Includes: id, configId, displayName, status, outputSha512, claimedAt, patchedAt, verifiedAt, createdAt.
   * ONLY when config.status === 'published': seed.
   *
   * Enforced at the service layer to prevent accidental exposure.
   */
  @Public()
  @Get('events/:eventId/assignments')
  @ApiOperation({
    summary: 'List event assignments with status (public)',
    description: 'No auth required. Seed revealed only when config is published.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: [PublicAssignmentDto] })
  async listEventAssignments(
    @Param('eventId') eventId: string,
  ): Promise<PublicAssignmentDto[]> {
    const config = await this.events.getConfigByEventId(Number(eventId));
    const assignments = await this.assignments.listAssignmentsForPublic(config.id);
    return assignments;
  }

  /**
   * GET /randomizer/public/events/:eventId/settings
   *
   * Download the event's config settings .rnqs blob.
   * ONLY available when config.status === 'published'.
   * Returns 403 if not published, 404 if not found.
   */
  @Public()
  @Get('events/:eventId/settings')
  @ApiOperation({
    summary: 'Download event settings file (.rnqs)',
    description: 'Only available after config is published. Returns 403 if not published.',
  })
  @ApiResponse({ status: HttpStatus.OK })
  async getEventSettings(
    @Param('eventId') eventId: string,
  ): Promise<StreamableFile> {
    const config = await this.events.getConfigByEventId(Number(eventId));
    const blob = await this.assignments.getConfigSettingsBlob(config.id);

    return new StreamableFile(blob, {
      type: 'application/octet-stream',
      disposition: 'attachment; filename="settings.rnqs"',
    });
  }

  /**
   * GET /randomizer/public/events/:eventId/assignments/:assignmentId/log
   *
   * Stream the randomizer log for an assignment.
   * ONLY available when config.status === 'published'.
   * Returns 403 if not published, 404 if not found.
   */
  @Public()
  @Get('events/:eventId/assignments/:assignmentId/log')
  @ApiOperation({
    summary: 'Download assignment log file (public)',
    description: 'Only available after config is published. Returns 403 if not published.',
  })
  @ApiResponse({ status: HttpStatus.OK })
  async getAssignmentLog(
    @Param('eventId') eventId: string,
    @Param('assignmentId') assignmentId: string,
  ): Promise<StreamableFile> {
    const config = await this.events.getConfigByEventId(Number(eventId));
    const logBlob = await this.assignments.getPublicAssignmentLog(
      config.id,
      Number(assignmentId),
    );

    return new StreamableFile(logBlob, {
      type: 'application/octet-stream',
      disposition: 'attachment',
    });
  }
}
