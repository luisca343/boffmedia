import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { PacksService } from './packs.service';
import {
  CreateInviteDto,
  CreatePackDto,
  CreateVersionDto,
  GrantAccessDto,
  UpdatePackDto,
} from './dto/packs.dto';
import {
  AccessRowEntity,
  AdminPackEntity,
  InviteCodeEntity,
  PackIdEntity,
  PackVersionEntity,
} from './entities/packs.entity';

// The dashboard's surface — HANDOFF §4.1 puts pack authoring in the web app,
// not the launcher. Every route is admin-only and carries its own
// @UseGuards(JwtAuthGuard, RolesGuard); there is no class-level @Public() here,
// which is exactly what keeps the guards effective.
@ApiTags('Packs | Admin')
@Controller('packs/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USER_ROLES.BOFF_ADMIN)
@ApiBearerAuth('JWT')
export class PacksController {
  constructor(private readonly packs: PacksService) {}

  private actorId(req: { user?: { userId?: number } }): number | null {
    return req.user?.userId ?? null;
  }

  @Get()
  @ApiOperation({ summary: 'Todos los packs' })
  @ApiResponse({ status: HttpStatus.OK, type: [AdminPackEntity] })
  async list(@Query('archived') archived?: string): Promise<AdminPackEntity[]> {
    return this.packs.listForAdmin(archived === 'true') as Promise<AdminPackEntity[]>;
  }

  @Post()
  @ApiOperation({ summary: 'Crear un pack' })
  @ApiResponse({ status: HttpStatus.CREATED, type: PackIdEntity })
  async create(
    @Body() dto: CreatePackDto,
    @Req() req: { user?: { userId?: number } },
  ): Promise<PackIdEntity> {
    return this.packs.createPack(dto, this.actorId(req));
  }

  @Patch(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Actualizar un pack' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePackDto,
    @Req() req: { user?: { userId?: number } },
  ): Promise<void> {
    await this.packs.updatePack(id, dto, this.actorId(req));
  }

  // ── Versions ─────────────────────────────────────────────────────────────

  @Get(':id/versions')
  @ApiOperation({ summary: 'Versiones de un pack' })
  @ApiResponse({ status: HttpStatus.OK, type: [PackVersionEntity] })
  async versions(@Param('id') id: string): Promise<PackVersionEntity[]> {
    return this.packs.listVersions(id) as Promise<PackVersionEntity[]>;
  }

  @Post(':id/versions')
  @ApiOperation({
    summary: 'Crear una versión (borrador)',
    description:
      'Valida el manifiesto completo con @boffmedia/pack-schema, el mismo esquema del que el launcher genera sus tipos de Rust.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: PackIdEntity })
  async createVersion(
    @Param('id') id: string,
    @Body() dto: CreateVersionDto,
    @Req() req: { user?: { userId?: number } },
  ): Promise<PackIdEntity> {
    return this.packs.createVersion(id, dto, this.actorId(req));
  }

  @Post(':id/versions/:versionId/publish')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Publicar una versión',
    description: 'La hace visible a los launchers y la marca como la última del pack.',
  })
  async publish(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Req() req: { user?: { userId?: number } },
  ): Promise<void> {
    await this.packs.publishVersion(id, versionId, this.actorId(req));
  }

  // ── Access ───────────────────────────────────────────────────────────────

  @Get(':id/access')
  @ApiOperation({ summary: 'UUIDs con acceso' })
  @ApiResponse({ status: HttpStatus.OK, type: [AccessRowEntity] })
  async access(@Param('id') id: string): Promise<AccessRowEntity[]> {
    return this.packs.listAccess(id);
  }

  @Post(':id/access')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Conceder acceso a un UUID' })
  async grant(
    @Param('id') id: string,
    @Body() dto: GrantAccessDto,
    @Req() req: { user?: { userId?: number } },
  ): Promise<void> {
    await this.packs.grant(id, dto.uuid, this.actorId(req));
  }

  @Delete(':id/access/:uuid')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revocar el acceso de un UUID' })
  async revoke(
    @Param('id') id: string,
    @Param('uuid') uuid: string,
    @Req() req: { user?: { userId?: number } },
  ): Promise<void> {
    await this.packs.revoke(id, uuid, this.actorId(req));
  }

  // ── Invites ──────────────────────────────────────────────────────────────

  @Get(':id/invites')
  @ApiOperation({ summary: 'Invitaciones de un pack' })
  async invites(@Param('id') id: string) {
    return this.packs.listInvites(id);
  }

  @Post(':id/invites')
  @ApiOperation({ summary: 'Crear una invitación' })
  @ApiResponse({ status: HttpStatus.CREATED, type: InviteCodeEntity })
  async createInvite(
    @Param('id') id: string,
    @Body() dto: CreateInviteDto,
    @Req() req: { user?: { userId?: number } },
  ): Promise<InviteCodeEntity> {
    return this.packs.createInvite(
      id,
      dto.maxUses ?? 1,
      dto.expiresAt ?? null,
      this.actorId(req),
    );
  }

  @Delete('invites/:code')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revocar una invitación' })
  async revokeInvite(@Param('code') code: string): Promise<void> {
    await this.packs.revokeInvite(code);
  }

  // ── Audit ────────────────────────────────────────────────────────────────

  @Get(':id/audit')
  @ApiOperation({ summary: 'Registro de auditoría del pack' })
  async audit(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.packs.listAudit(id, limit ? Number(limit) : 50);
  }
}
