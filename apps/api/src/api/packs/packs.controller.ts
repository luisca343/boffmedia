import {
  Body,
  Controller,
  Delete,
  Get,
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
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { PacksDownloadsService } from './packs-downloads.service';
import { PacksService } from './packs.service';
import { PacksCatalogService } from './packs-catalog.service';
import {
  CatalogFilesQueryDto,
  CatalogSearchQueryDto,
  CreateInviteDto,
  CreatePackDto,
  CreateVersionDto,
  GrantAccessDto,
  ResolveFileDto,
  UpdatePackDto,
} from './dto/packs.dto';
import {
  AccessRowEntity,
  AdminPackEntity,
  BlobUploadEntity,
  InviteCodeEntity,
  ModFileEntity,
  ModSearchHitEntity,
  PackIdEntity,
  PackVersionEntity,
  ResolvedFileEntity,
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
  constructor(
    private readonly packs: PacksService,
    private readonly downloads: PacksDownloadsService,
    private readonly catalog: PacksCatalogService,
  ) {}

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
  @ApiOperation({ summary: 'Actualizar un pack' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePackDto,
    @Req() req: { user?: { userId?: number } },
  ): Promise<{ success: true }> {
    await this.packs.updatePack(id, dto, this.actorId(req));
    return { success: true };
  }

  // ── Override blobs ───────────────────────────────────────────────────────
  // Content-addressed and deliberately NOT scoped to a pack: two packs shipping
  // the same config file are the same bytes, and the launcher only ever asks
  // for a sha512. A version manifest referencing a blob that was never uploaded
  // is what made `override` files 404 at install time.

  @Get('blobs/:sha512')
  @ApiOperation({
    summary: '¿Está ya este blob en el servidor?',
    description: 'Permite al dashboard saltarse la subida de un archivo ya presente.',
  })
  async blobStatus(
    @Param('sha512') sha512: string,
  ): Promise<{ present: boolean; sizeBytes: number | null }> {
    const size = await this.downloads.blobSize(sha512.toLowerCase());
    return { present: size !== null, sizeBytes: size };
  }

  @Post('blobs')
  @ApiOperation({
    summary: 'Subir un blob de override',
    description:
      'Cuerpo binario en crudo (application/octet-stream). El sha512 lo calcula el servidor a partir de los bytes recibidos; no se acepta el del cliente.',
  })
  @ApiConsumes('application/octet-stream')
  @ApiResponse({ status: HttpStatus.CREATED, type: BlobUploadEntity })
  async uploadBlob(@Req() req: Request): Promise<BlobUploadEntity> {
    return this.downloads.storeBlob(req);
  }

  // ── Mod catalog ──────────────────────────────────────────────────────────

  @Get('catalog/search')
  @ApiOperation({ summary: 'Buscar mods en CurseForge o Modrinth' })
  @ApiResponse({ status: HttpStatus.OK, type: [ModSearchHitEntity] })
  async catalogSearch(
    @Query() query: CatalogSearchQueryDto,
  ): Promise<ModSearchHitEntity[]> {
    return this.catalog.search(query);
  }

  @Get('catalog/curseforge/:projectId/files')
  @ApiOperation({
    summary: 'Archivos de un mod de CurseForge',
    description:
      'downloadable=false significa que el autor no permite distribución por terceros: ese archivo no se puede instalar automáticamente.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: [ModFileEntity] })
  async curseforgeFiles(
    @Param('projectId') projectId: string,
    @Query() query: CatalogFilesQueryDto,
  ): Promise<ModFileEntity[]> {
    return this.catalog.curseforgeFiles(
      projectId,
      query.gameVersion,
      query.loader,
      query.pageSize ?? 30,
    );
  }

  @Get('catalog/modrinth/:projectId/versions')
  @ApiOperation({ summary: 'Versiones de un proyecto de Modrinth' })
  @ApiResponse({ status: HttpStatus.OK, type: [ModFileEntity] })
  async modrinthVersions(
    @Param('projectId') projectId: string,
    @Query() query: CatalogFilesQueryDto,
  ): Promise<ModFileEntity[]> {
    return this.catalog.modrinthVersions(projectId, query.gameVersion, query.loader);
  }

  @Post('catalog/resolve')
  @ApiOperation({
    summary: 'Resolver un origen a sha512 + tamaño',
    description:
      'PackFile.sha512 es obligatorio, pero CurseForge solo publica sha1/md5: para esos orígenes (y para url) el servidor descarga los bytes y los hashea. Puede tardar en archivos grandes.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: ResolvedFileEntity })
  async resolveFile(@Body() dto: ResolveFileDto): Promise<ResolvedFileEntity> {
    return this.catalog.resolve(dto);
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
  @ApiOperation({
    summary: 'Publicar una versión',
    description: 'La hace visible a los launchers y la marca como la última del pack.',
  })
  async publish(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Req() req: { user?: { userId?: number } },
  ): Promise<{ success: true }> {
    await this.packs.publishVersion(id, versionId, this.actorId(req));
    return { success: true };
  }

  // ── Access ───────────────────────────────────────────────────────────────

  @Get(':id/access')
  @ApiOperation({ summary: 'UUIDs con acceso' })
  @ApiResponse({ status: HttpStatus.OK, type: [AccessRowEntity] })
  async access(@Param('id') id: string): Promise<AccessRowEntity[]> {
    return this.packs.listAccess(id);
  }

  @Post(':id/access')
  @ApiOperation({ summary: 'Conceder acceso a un UUID' })
  async grant(
    @Param('id') id: string,
    @Body() dto: GrantAccessDto,
    @Req() req: { user?: { userId?: number } },
  ): Promise<{ success: true }> {
    await this.packs.grant(id, dto.uuid, this.actorId(req));
    return { success: true };
  }

  @Delete(':id/access/:uuid')
  @ApiOperation({ summary: 'Revocar el acceso de un UUID' })
  async revoke(
    @Param('id') id: string,
    @Param('uuid') uuid: string,
    @Req() req: { user?: { userId?: number } },
  ): Promise<{ success: true }> {
    await this.packs.revoke(id, uuid, this.actorId(req));
    return { success: true };
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
  @ApiOperation({ summary: 'Revocar una invitación' })
  async revokeInvite(@Param('code') code: string): Promise<{ success: true }> {
    await this.packs.revokeInvite(code);
    return { success: true };
  }

  // ── Audit ────────────────────────────────────────────────────────────────

  @Get(':id/audit')
  @ApiOperation({ summary: 'Registro de auditoría del pack' })
  async audit(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.packs.listAudit(id, limit ? Number(limit) : 50);
  }
}
