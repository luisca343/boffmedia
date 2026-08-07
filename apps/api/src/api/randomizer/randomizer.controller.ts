import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Readable } from 'stream';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { EventsService } from './services/events.service';
import { AssignmentsService } from './services/assignments.service';
import { PresetsService } from './services/presets.service';
import {
  CreateEventDto,
  UpdateEventDto,
  EventResponseDto,
  AssignmentAdminDto,
  CreatePresetDto,
  UpdatePresetDto,
  PresetResponseDto,
  LockEventDto,
  FinishEventDto,
} from './dto/randomizer.dto';

// Admin panel for randomizer events, assignments, and presets.
// All routes require JWT + BOFF_ADMIN role.
@ApiTags('Randomizer | Admin')
@Controller('randomizer/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USER_ROLES.BOFF_ADMIN)
@ApiBearerAuth('JWT')
export class RandomizerController {
  constructor(
    private readonly events: EventsService,
    private readonly assignments: AssignmentsService,
    private readonly presets: PresetsService,
  ) {}

  private actorId(req: any): string | null {
    const userId = req?.user?.userId;
    return userId ? `user:${userId}` : null;
  }

  // ==================== EVENTS ====================

  @Post('events')
  @ApiOperation({ summary: 'Crear un evento de randomizer' })
  @ApiResponse({ status: HttpStatus.CREATED, type: EventResponseDto })
  async createEvent(@Body() dto: CreateEventDto): Promise<EventResponseDto> {
    return this.events.createEvent(dto) as Promise<EventResponseDto>;
  }

  @Get('events/:id')
  @ApiOperation({ summary: 'Obtener un evento por ID' })
  @ApiResponse({ status: HttpStatus.OK, type: EventResponseDto })
  async getEvent(@Param('id') id: string): Promise<EventResponseDto> {
    return this.events.getEvent(Number(id)) as Promise<EventResponseDto>;
  }

  @Get('tournaments/:tournamentId/events')
  @ApiOperation({ summary: 'Listar eventos de un torneo' })
  @ApiResponse({ status: HttpStatus.OK, type: [EventResponseDto] })
  async listEventsByTournament(
    @Param('tournamentId') tournamentId: string,
  ): Promise<EventResponseDto[]> {
    return this.events.listEventsByTournament(Number(tournamentId)) as Promise<
      EventResponseDto[]
    >;
  }

  @Patch('events/:id')
  @ApiOperation({ summary: 'Actualizar un evento (solo en draft)' })
  @ApiResponse({ status: HttpStatus.OK, type: EventResponseDto })
  async updateEvent(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
  ): Promise<EventResponseDto> {
    return this.events.updateEvent(
      Number(id),
      dto,
    ) as Promise<EventResponseDto>;
  }

  @Post('events/:id/lock')
  @ApiOperation({
    summary: 'Bloquear evento y generar seeds (draft → locked)',
  })
  @ApiResponse({ status: HttpStatus.OK, type: EventResponseDto })
  async lockEvent(
    @Param('id') id: string,
    @Body() dto: LockEventDto,
    @Req() req: any,
  ): Promise<EventResponseDto> {
    return this.events.lockEvent(
      Number(id),
      this.actorId(req) || undefined,
    ) as Promise<EventResponseDto>;
  }

  @Post('events/:id/finish')
  @ApiOperation({ summary: 'Finalizar evento (cualquier status → finished)' })
  @ApiResponse({ status: HttpStatus.OK, type: EventResponseDto })
  async finishEvent(
    @Param('id') id: string,
    @Body() dto: FinishEventDto,
    @Req() req: any,
  ): Promise<EventResponseDto> {
    return this.events.finishEvent(
      Number(id),
      this.actorId(req) || undefined,
    ) as Promise<EventResponseDto>;
  }

  @Post('events/:id/dry-run')
  @ApiOperation({
    summary: 'Randomizar una ROM sin guardarla (prueba)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: HttpStatus.OK })
  async dryRunRandomization(@Param('id') id: string): Promise<StreamableFile> {
    // TODO: Extract file from multipart form
    // For now, just call service with stub stream
    const stubStream = Readable.from(Buffer.alloc(0));
    const { randomizedRom } = await this.events.dryRunRandomization(
      Number(id),
      stubStream,
    );
    return new StreamableFile(randomizedRom);
  }

  // ==================== ASSIGNMENTS ====================

  @Get('events/:eventId/assignments')
  @ApiOperation({ summary: 'Listar todas las asignaciones de un evento' })
  @ApiResponse({ status: HttpStatus.OK, type: [AssignmentAdminDto] })
  async listAssignments(
    @Param('eventId') eventId: string,
  ): Promise<AssignmentAdminDto[]> {
    return this.assignments.listAssignmentsForAdmin(Number(eventId));
  }

  @Get('events/:eventId/assignments/:assignmentId/log')
  @ApiOperation({ summary: 'Ver el registro sellado de una asignación' })
  @ApiResponse({ status: HttpStatus.OK })
  async getAssignmentLog(
    @Param('eventId') eventId: string,
    @Param('assignmentId') assignmentId: string,
  ): Promise<StreamableFile> {
    const logBlob = await this.assignments.getAssignmentLog(
      Number(eventId),
      Number(assignmentId),
    );
    return new StreamableFile(logBlob, {
      type: 'application/octet-stream',
      disposition: 'attachment',
    });
  }

  // ==================== PRESETS ====================

  @Post('presets')
  @ApiOperation({ summary: 'Crear un preset de configuración' })
  @ApiResponse({ status: HttpStatus.CREATED, type: PresetResponseDto })
  async createPreset(
    @Body() dto: CreatePresetDto,
    @Req() req: any,
  ): Promise<PresetResponseDto> {
    return this.presets.createPreset({
      ...dto,
      updatedBy: req?.user?.userId,
    });
  }

  @Get('presets/:id')
  @ApiOperation({ summary: 'Obtener un preset por ID' })
  @ApiResponse({ status: HttpStatus.OK, type: PresetResponseDto })
  async getPreset(@Param('id') id: string): Promise<PresetResponseDto> {
    return this.presets.getPreset(Number(id));
  }

  @Get('presets')
  @ApiOperation({ summary: 'Listar todos los presets' })
  @ApiResponse({ status: HttpStatus.OK, type: [PresetResponseDto] })
  async listPresets(): Promise<PresetResponseDto[]> {
    return this.presets.listPresets();
  }

  @Patch('presets/:id')
  @ApiOperation({ summary: 'Actualizar un preset' })
  @ApiResponse({ status: HttpStatus.OK, type: PresetResponseDto })
  async updatePreset(
    @Param('id') id: string,
    @Body() dto: UpdatePresetDto,
    @Req() req: any,
  ): Promise<PresetResponseDto> {
    return this.presets.updatePreset(Number(id), {
      ...dto,
      updatedBy: req?.user?.userId,
    });
  }

  @Delete('presets/:id')
  @ApiOperation({ summary: 'Eliminar un preset' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async deletePreset(@Param('id') id: string): Promise<void> {
    await this.presets.deletePreset(Number(id));
  }

  @Post('presets/:id/export')
  @ApiOperation({ summary: 'Exportar preset como .rnqs' })
  @ApiResponse({ status: HttpStatus.OK })
  async exportPreset(@Param('id') id: string): Promise<StreamableFile> {
    const rnqs = await this.presets.exportPreset(Number(id));
    return new StreamableFile(rnqs, {
      type: 'application/octet-stream',
      disposition: 'attachment; filename="preset.rnqs"',
    });
  }

  @Post('presets/import')
  @ApiOperation({ summary: 'Importar preset desde .rnqs' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: HttpStatus.CREATED, type: PresetResponseDto })
  async importPreset(): Promise<PresetResponseDto> {
    // TODO: Extract file and metadata from multipart form
    throw new Error('Import not yet implemented (Phase 0 spike)');
  }
}
