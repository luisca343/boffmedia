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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { EventsService } from './services/events.service';
import { AssignmentsService } from './services/assignments.service';
import { PresetsService } from './services/presets.service';
import { RomsService } from './services/roms.service';
import {
  CreateConfigDto,
  UpdateConfigDto,
  ConfigResponseDto,
  AssignmentAdminDto,
  CreatePresetDto,
  UpdatePresetDto,
  PresetResponseDto,
  OpenConfigDto,
  CloseConfigDto,
  PublishConfigDto,
  QuickRandomizeDto,
  CreateRomDto,
  RomResponseDto,
} from './dto/randomizer.dto';

// Admin panel for randomizer configs, assignments, and presets.
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
    private readonly roms: RomsService,
  ) {}

  private actorId(req: any): string | null {
    const userId = req?.user?.userId;
    return userId ? `user:${userId}` : null;
  }

  // ==================== ROM LIBRARY ====================

  @Post('roms')
  @ApiOperation({
    summary: 'Upload a clean ROM to the central library',
    description:
      'Streams the ROM into the content-addressed blob store and registers it. Rejects a duplicate sha512.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: HttpStatus.CREATED, type: RomResponseDto })
  @UseInterceptors(FileInterceptor('rom'))
  async uploadRom(
    @UploadedFile() rom: Express.Multer.File,
    @Body() dto: CreateRomDto,
  ): Promise<RomResponseDto> {
    if (!rom?.buffer?.length) {
      throw new BadRequestException('ROM file is required (multipart field "rom")');
    }
    const created = await this.roms.uploadRom({
      name: dto.name,
      gamePlatform: dto.gamePlatform,
      romBuffer: rom.buffer,
    });
    return { ...created, referencedBy: 0 } as RomResponseDto;
  }

  @Get('roms')
  @ApiOperation({ summary: 'List library ROMs (with referenced-by counts)' })
  @ApiResponse({ status: HttpStatus.OK, type: [RomResponseDto] })
  async listRoms(): Promise<RomResponseDto[]> {
    return this.roms.listRoms() as Promise<RomResponseDto[]>;
  }

  @Delete('roms/:id')
  @ApiOperation({ summary: 'Delete a library ROM (409 if referenced by a config)' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async deleteRom(@Param('id') id: string): Promise<void> {
    await this.roms.deleteRom(Number(id));
  }

  // ==================== CONFIGS ====================

  @Post('configs')
  @ApiOperation({ summary: 'Create a randomizer config for an event' })
  @ApiResponse({ status: HttpStatus.CREATED, type: ConfigResponseDto })
  async createConfig(@Body() dto: CreateConfigDto): Promise<ConfigResponseDto> {
    return this.events.createConfig(dto) as Promise<ConfigResponseDto>;
  }

  @Get('configs/:id')
  @ApiOperation({ summary: 'Get a config by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: ConfigResponseDto })
  async getConfig(@Param('id') id: string): Promise<ConfigResponseDto> {
    return this.events.getConfig(Number(id)) as Promise<ConfigResponseDto>;
  }

  @Get('configs')
  @ApiOperation({ summary: 'List all configs' })
  @ApiResponse({ status: HttpStatus.OK, type: [ConfigResponseDto] })
  async listConfigs(): Promise<ConfigResponseDto[]> {
    return this.events.listConfigs() as Promise<ConfigResponseDto[]>;
  }

  @Patch('configs/:id')
  @ApiOperation({ summary: 'Update a config (only in draft)' })
  @ApiResponse({ status: HttpStatus.OK, type: ConfigResponseDto })
  async updateConfig(
    @Param('id') id: string,
    @Body() dto: UpdateConfigDto,
  ): Promise<ConfigResponseDto> {
    return this.events.updateConfig(
      Number(id),
      dto,
    ) as Promise<ConfigResponseDto>;
  }

  @Post('configs/:id/open')
  @ApiOperation({
    summary: 'Open config for claims (draft → open)',
  })
  @ApiResponse({ status: HttpStatus.OK, type: ConfigResponseDto })
  async openConfig(
    @Param('id') id: string,
    @Body() dto: OpenConfigDto,
    @Req() req: any,
  ): Promise<ConfigResponseDto> {
    return this.events.openConfig(
      Number(id),
      this.actorId(req) || undefined,
    ) as Promise<ConfigResponseDto>;
  }

  @Post('configs/:id/close')
  @ApiOperation({ summary: 'Close config (open → closed; stops new claims)' })
  @ApiResponse({ status: HttpStatus.OK, type: ConfigResponseDto })
  async closeConfig(
    @Param('id') id: string,
    @Body() dto: CloseConfigDto,
    @Req() req: any,
  ): Promise<ConfigResponseDto> {
    return this.events.closeConfig(
      Number(id),
      this.actorId(req) || undefined,
    ) as Promise<ConfigResponseDto>;
  }

  @Post('configs/:id/publish')
  @ApiOperation({ summary: 'Publish config (seeds/settings/logs become public)' })
  @ApiResponse({ status: HttpStatus.OK, type: ConfigResponseDto })
  async publishConfig(
    @Param('id') id: string,
    @Body() dto: PublishConfigDto,
    @Req() req: any,
  ): Promise<ConfigResponseDto> {
    return this.events.publishConfig(
      Number(id),
      this.actorId(req) || undefined,
    ) as Promise<ConfigResponseDto>;
  }

  @Post('configs/:id/reopen')
  @ApiOperation({ summary: 'Reopen config (closed → open; claims resume)' })
  @ApiResponse({ status: HttpStatus.OK, type: ConfigResponseDto })
  async reopenConfig(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<ConfigResponseDto> {
    return this.events.reopenConfig(
      Number(id),
      this.actorId(req) || undefined,
    ) as Promise<ConfigResponseDto>;
  }

  @Delete('configs/:id')
  @ApiOperation({
    summary: 'Delete a draft config and free its event’s pack',
  })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async deleteConfig(@Param('id') id: string, @Req() req: any): Promise<void> {
    await this.events.deleteConfig(Number(id), this.actorId(req) || undefined);
  }

  @Get('events/:eventId/config')
  @ApiOperation({
    summary: 'Get the config for an event (404 when not set up)',
  })
  @ApiResponse({ status: HttpStatus.OK, type: ConfigResponseDto })
  async getEventConfig(
    @Param('eventId') eventId: string,
  ): Promise<ConfigResponseDto> {
    return this.events.getConfigByEventId(
      Number(eventId),
    ) as Promise<ConfigResponseDto>;
  }

  @Post('quick-randomize')
  @ApiOperation({
    summary: 'Quick randomize ROM with preset (direct, no event)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: HttpStatus.OK })
  @UseInterceptors(FileInterceptor('rom'))
  async quickRandomize(
    @UploadedFile() rom: Express.Multer.File,
    @Body() dto: QuickRandomizeDto,
  ): Promise<StreamableFile> {
    if (!rom?.buffer?.length) {
      throw new BadRequestException('ROM file is required (multipart field "rom")');
    }

    const { romBytes, seed } = await this.events.quickRandomize({
      presetId: dto.presetId,
      gamePlatform: dto.gamePlatform as 'gba' | 'nds',
      romBuffer: rom.buffer,
      seed: dto.seed,
    });

    const ext = dto.gamePlatform === 'nds' ? 'nds' : 'gba';
    return new StreamableFile(romBytes, {
      type: 'application/octet-stream',
      disposition: `attachment; filename="randomized-${seed}.${ext}"`,
    });
  }

  // ==================== ASSIGNMENTS ====================

  @Get('configs/:configId/assignments')
  @ApiOperation({ summary: 'List all assignments for a config' })
  @ApiResponse({ status: HttpStatus.OK, type: [AssignmentAdminDto] })
  async listAssignments(
    @Param('configId') configId: string,
  ): Promise<AssignmentAdminDto[]> {
    return this.assignments.listAssignmentsForAdmin(Number(configId));
  }

  @Get('configs/:configId/assignments/:assignmentId/log')
  @ApiOperation({
    summary: 'Leer el registro (spoiler log) de una asignación',
    description:
      'Texto plano, NO el envoltorio { success, data }: el ResponseInterceptor deja pasar un StreamableFile tal cual. El panel de admin lo muestra en un modal, así que se sirve inline y declarado como texto en lugar de como descarga binaria.',
  })
  @ApiResponse({ status: HttpStatus.OK })
  async getAssignmentLog(
    @Param('configId') configId: string,
    @Param('assignmentId') assignmentId: string,
  ): Promise<StreamableFile> {
    const logBlob = await this.assignments.getAssignmentLog(
      Number(configId),
      Number(assignmentId),
    );
    return new StreamableFile(logBlob, {
      type: 'text/plain; charset=utf-8',
      disposition: 'inline',
    });
  }

  // ==================== PRESETS ====================

  @Post('presets')
  @ApiOperation({ summary: 'Create a preset' })
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
  @ApiOperation({ summary: 'Get a preset by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: PresetResponseDto })
  async getPreset(@Param('id') id: string): Promise<PresetResponseDto> {
    return this.presets.getPreset(Number(id));
  }

  @Get('presets')
  @ApiOperation({ summary: 'List all presets' })
  @ApiResponse({ status: HttpStatus.OK, type: [PresetResponseDto] })
  async listPresets(): Promise<PresetResponseDto[]> {
    return this.presets.listPresets();
  }

  @Patch('presets/:id')
  @ApiOperation({ summary: 'Update a preset' })
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
  @ApiOperation({ summary: 'Delete a preset' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async deletePreset(@Param('id') id: string): Promise<void> {
    await this.presets.deletePreset(Number(id));
  }

  @Post('presets/:id/export')
  @ApiOperation({ summary: 'Export preset as .rnqs file' })
  @ApiResponse({ status: HttpStatus.OK })
  async exportPreset(@Param('id') id: string): Promise<StreamableFile> {
    const rnqs = await this.presets.exportPreset(Number(id));
    return new StreamableFile(rnqs, {
      type: 'application/octet-stream',
      disposition: 'attachment; filename="preset.rnqs"',
    });
  }

  @Post('presets/import')
  @ApiOperation({ summary: 'Import preset from .rnqs file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: HttpStatus.CREATED, type: PresetResponseDto })
  async importPreset(): Promise<PresetResponseDto> {
    // TODO: Extract file and metadata from multipart form
    throw new Error('Import not yet implemented (Phase 0 spike)');
  }
}
