import {
  BadRequestException,
  Body,
  Controller,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '@api/_utils/decorators/public.decorator';
import { UploadFacadeService } from '../boffmedia/util/upload/upload.facade.service';
import {
  CreatePackDto,
  CreatePackVersionDto,
  UpdatePackDto,
} from './dto/packs.dto';
import { BlobUploadEntity, PackIdEntity } from './entities/packs.entity';
import { DesktopAdminGuard } from './guards/desktop-admin.guard';
import type { DesktopRequest } from './guards/desktop-auth.guard';
import { PacksDownloadsService } from './packs-downloads.service';
import { PacksService } from './packs.service';

/**
 * Publishing a pack from the desktop app.
 *
 * This reverses a stated decision, and it is worth saying so plainly: the
 * dashboard controller carries the comment "pack authoring lives in the web app,
 * not the launcher". It is reversed as narrowly as it can be — a new DOOR, not
 * new logic. Every route below hands straight to the same `PacksService` and
 * `PacksDownloadsService` methods `packs/admin` calls, unchanged, and the guard
 * requires the same BOFF_ADMIN role. What changes is only which credential opens
 * it: a desktop session instead of a website one.
 *
 * `@Public()` is what lets the desktop Bearer through the global JwtAuthGuard,
 * which would otherwise reject it as an invalid website session. The real gate
 * is `DesktopAdminGuard` on the class — the same shape `DesktopAuthGuard` uses,
 * and the reason that guard verifies its own token rather than reading
 * `req.user`.
 *
 * Naming follows the three-words rule: `desktop`, because this says WHICH CLIENT
 * is talking. `launcher` names the launching function (which this is not) and
 * `app` is what a user calls the product.
 */
@ApiTags('Packs | Desktop')
@Controller('packs/desktop')
@Public()
@UseGuards(DesktopAdminGuard)
@ApiBearerAuth('Desktop')
export class PacksDesktopController {
  constructor(
    private readonly packs: PacksService,
    private readonly downloads: PacksDownloadsService,
    private readonly uploads: UploadFacadeService,
  ) {}

  /** The Boffmedia account behind the desktop session. Every write is attributed
   *  to it, so the audit trail does not care which client made the change. */
  private actorId(req: DesktopRequest): number | null {
    return req.desktopClient?.userId ?? null;
  }

  // ── Packs ────────────────────────────────────────────────────────────────

  @Post('packs')
  @ApiOperation({ summary: 'Crear un pack desde la app' })
  @ApiResponse({ status: HttpStatus.CREATED, type: PackIdEntity })
  async createPack(
    @Body() dto: CreatePackDto,
    @Req() req: DesktopRequest,
  ): Promise<PackIdEntity> {
    return this.packs.createPack(dto, this.actorId(req));
  }

  @Patch('packs/:id')
  @ApiOperation({ summary: 'Actualizar un pack desde la app' })
  async updatePack(
    @Param('id') id: string,
    @Body() dto: UpdatePackDto,
    @Req() req: DesktopRequest,
  ): Promise<{ success: true }> {
    await this.packs.updatePack(id, dto, this.actorId(req));
    return { success: true };
  }

  // ── Override blobs ───────────────────────────────────────────────────────
  // The launcher already keeps its override bytes in a content-addressed local
  // store, under exactly the sha512 the server wants — so the upload plan is
  // "ask which of these you already have, send the rest". Blobs first and the
  // version last: a version referencing a blob that was never uploaded is the
  // precise failure the admin controller's comment calls out.

  @Post('blobs/:sha512/status')
  @ApiOperation({
    summary: '¿Está ya este blob en el servidor?',
    description:
      'POST y no GET porque el cliente pregunta por lotes de cientos de hashes en un solo despliegue; ver `blobsPresent`.',
  })
  async blobStatus(
    @Param('sha512') sha512: string,
  ): Promise<{ present: boolean; sizeBytes: number | null }> {
    const size = await this.downloads.blobSize(sha512.toLowerCase());
    return { present: size !== null, sizeBytes: size };
  }

  @Post('blobs/present')
  @ApiOperation({
    summary: 'Cuáles de estos blobs faltan',
    description:
      'Una llamada en lugar de una por archivo: un pack con 400 overrides son 400 peticiones, y la respuesta útil es la lista corta de los que faltan.',
  })
  async blobsPresent(
    @Body() body: { sha512: string[] },
  ): Promise<{ missing: string[] }> {
    const hashes = Array.isArray(body?.sha512) ? body.sha512 : [];
    if (hashes.length > 2000) {
      throw new BadRequestException('Demasiados hashes en una sola consulta');
    }
    const missing: string[] = [];
    for (const raw of hashes) {
      if (typeof raw !== 'string') continue;
      const sha512 = raw.toLowerCase();
      if ((await this.downloads.blobSize(sha512)) === null)
        missing.push(sha512);
    }
    return { missing };
  }

  @Post('blobs')
  @ApiOperation({
    summary: 'Subir un blob de override desde la app',
    description:
      'Cuerpo binario en crudo (application/octet-stream). El sha512 lo calcula el servidor a partir de los bytes recibidos; no se acepta el del cliente.',
  })
  @ApiConsumes('application/octet-stream')
  @ApiResponse({ status: HttpStatus.CREATED, type: BlobUploadEntity })
  async uploadBlob(@Req() req: Request): Promise<BlobUploadEntity> {
    return this.downloads.storeBlob(req);
  }

  // ── Icon and gallery images (D2) ─────────────────────────────────────────
  // A local pack keeps its icon as a file on disk, but `CreatePackDto` takes a
  // URL — so without this a pack published from the launcher would arrive
  // without the artwork its author had been looking at all along, and they would
  // have to open the web admin to finish a job the app told them was done.
  //
  // Delegates to the SAME UploadFacadeService the web `/upload/image` route
  // uses, so the type allowlist, the size ceiling and the storage layout are one
  // implementation rather than two that drift. Only the credential differs,
  // which is the whole shape of this controller.

  @Post('images')
  @ApiOperation({
    summary: 'Subir un icono o una imagen de galería',
    description:
      'Devuelve la URL pública que se guarda en `iconUrl` o en `gallery[]`.',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      // 5 MB, matching /upload/image. A pack icon is a 512px PNG; anything near
      // this ceiling is a mistake worth refusing early.
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string; filename: string }> {
    if (!file) throw new BadRequestException('No se recibió ninguna imagen');
    const result = await this.uploads.uploadImage({
      file,
      path: 'packs',
      maxSizeInMB: 5,
    });
    return { url: result.url, filename: result.filename };
  }

  // ── Versions ─────────────────────────────────────────────────────────────

  @Post('packs/:id/versions')
  @ApiOperation({
    summary: 'Crear una versión (borrador) desde la app',
    description:
      'Valida el manifiesto completo con @boffmedia/pack-schema — el mismo esquema que la app ya ejecuta localmente antes de subir nada, así que un pack inválido falla en el escritorio y no tras una subida de varios megabytes.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: PackIdEntity })
  async createVersion(
    @Param('id') id: string,
    @Body() dto: CreatePackVersionDto,
    @Req() req: DesktopRequest,
  ): Promise<PackIdEntity> {
    return this.packs.createVersion(id, dto, this.actorId(req));
  }

  @Post('packs/:id/versions/:versionId/publish')
  @ApiOperation({
    summary: 'Publicar una versión',
    description:
      'Un acto aparte de crearla: una versión nace como borrador, invisible para los launchers, y publicarla es lo que la convierte en la última del pack.',
  })
  async publish(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Req() req: DesktopRequest,
    @Query('allowRollback') allowRollback?: string,
  ): Promise<{ success: true }> {
    await this.packs.publishVersion(
      id,
      versionId,
      this.actorId(req),
      allowRollback === 'true',
    );
    return { success: true };
  }
}
