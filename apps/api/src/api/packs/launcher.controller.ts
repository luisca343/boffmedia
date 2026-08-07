import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '@api/_utils/decorators/public.decorator';
import {
  LauncherAuthGuard,
  LauncherRequest,
} from './guards/launcher-auth.guard';
import { PacksAuthService } from './packs-auth.service';
import { PacksService } from './packs.service';
import {
  PacksDownloadsService,
  ProxiedDownload,
} from './packs-downloads.service';
import {
  DownloadQueryDto,
  ManifestQueryDto,
  RedeemInviteDto,
  VerifyJoinDto,
} from './dto/packs.dto';
import {
  JoinChallengeEntity,
  LauncherPackEntity,
  LauncherSessionEntity,
} from './entities/packs.entity';

// The launcher's entire surface. HANDOFF §7.2 — identity is a Minecraft UUID
// proved through Mojang's hasJoined handshake, never a Boffmedia account, so a
// player who has never opened the website can still install a pack.
//
// `@Public()` is applied PER ROUTE, never on the class: it exempts these from
// the global JwtAuthGuard (a launcher token is not a website session), and the
// LauncherAuthGuard below does the real authentication itself.
@ApiTags('Packs | Launcher')
@Controller('packs/launcher')
export class LauncherController {
  constructor(
    private readonly auth: PacksAuthService,
    private readonly packs: PacksService,
    private readonly downloads: PacksDownloadsService,
  ) {}

  @Post('auth/challenge')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Paso 1: obtener un serverId para el handshake de Mojang',
  })
  @ApiResponse({ status: HttpStatus.OK, type: JoinChallengeEntity })
  challenge(): JoinChallengeEntity {
    return this.auth.createChallenge();
  }

  @Post('auth/verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Paso 3: canjear el desafío por una sesión de launcher',
    description:
      'Entre el paso 1 y este, el launcher debe llamar a sessionserver.mojang.com/session/minecraft/join con el serverId.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: LauncherSessionEntity })
  async verify(@Body() dto: VerifyJoinDto): Promise<LauncherSessionEntity> {
    const principal = await this.auth.verify(dto.username, dto.serverId);
    return {
      token: this.auth.signSession(principal),
      uuid: principal.uuid,
      username: principal.username,
    };
  }

  /** The launcher declares which game types it can parse via X-Boff-Game-Types
   *  (e.g. `minecraft,emulator`). Absent header (every launcher shipped before
   *  multi-game) → minecraft only: an old launcher can never list, or fetch the
   *  manifest of, a pack it cannot handle. Unknown values are ignored. */
  private capabilitiesFrom(header?: string): string[] {
    if (header === undefined) return ['minecraft'];
    return header
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }

  @Get('packs')
  @Public()
  @UseGuards(LauncherAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Los packs a los que este UUID tiene acceso' })
  @ApiResponse({ status: HttpStatus.OK, type: [LauncherPackEntity] })
  async list(
    @Req() req: LauncherRequest,
    @Headers('x-boff-game-types') gameTypes?: string,
  ): Promise<LauncherPackEntity[]> {
    return this.packs.listForLauncher(
      req.launcher!.uuid,
      this.capabilitiesFrom(gameTypes),
    ) as Promise<LauncherPackEntity[]>;
  }

  @Get('packs/:id/manifest')
  @Public()
  @UseGuards(LauncherAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'El manifiesto a instalar',
    description:
      'Revalida el acceso: el listado y la descarga son peticiones distintas y el acceso puede revocarse entre ambas. Devuelve 409 si el pack usa un juego que este launcher no sabe interpretar (X-Boff-Game-Types).',
  })
  async manifest(
    @Param('id') id: string,
    @Query() query: ManifestQueryDto,
    @Req() req: LauncherRequest,
    @Headers('x-boff-game-types') gameTypes?: string,
  ): Promise<unknown> {
    return this.packs.manifestFor(
      req.launcher!.uuid,
      id,
      query.password ?? null,
      this.capabilitiesFrom(gameTypes),
    );
  }

  // ── Downloads (§6 installs are blocked without these) ────────────────────

  @Get('packs/:id/files/curseforge/:projectId/:fileId')
  @Public()
  @UseGuards(LauncherAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Proxy de descarga de CurseForge',
    description:
      '§4.5 — la clave de CurseForge nunca sale del servidor: edge.forgecdn.net devuelve 401 sin x-api-key desde el 16/07/2026 y una clave incrustada acaba extraída. Revalida el acceso y exige que el archivo pertenezca a la versión publicada del pack.',
  })
  async curseforge(
    @Param('id') id: string,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('fileId', ParseIntPipe) fileId: number,
    @Query() query: DownloadQueryDto,
    @Req() req: LauncherRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    await this.packs.entitledFile(
      req.launcher!.uuid,
      id,
      query.password ?? null,
      (file) =>
        file.source.kind === 'curseforge' &&
        file.source.projectId === projectId &&
        file.source.fileId === fileId,
    );

    return this.stream(res, await this.downloads.curseforge(projectId, fileId));
  }

  @Get('packs/:id/files/override/:sha512')
  @Public()
  @UseGuards(LauncherAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Descargar un blob de override',
    description:
      '§7.2 pide una URL firmada de corta duración, lo que presupone almacenamiento de objetos; los blobs viven en disco (PACK_BLOB_DIR), así que no hay nada que firmar y se sirven aquí, detrás del mismo guard. Nunca hay una URL pública.',
  })
  async override(
    @Param('id') id: string,
    @Param('sha512') sha512: string,
    @Query() query: DownloadQueryDto,
    @Req() req: LauncherRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const blob = sha512.toLowerCase();
    await this.packs.entitledFile(
      req.launcher!.uuid,
      id,
      query.password ?? null,
      (file) =>
        file.source.kind === 'override' && file.source.blobSha512 === blob,
    );

    return this.stream(res, await this.downloads.override(blob));
  }

  /** The ResponseInterceptor passes a StreamableFile through untouched, so these
   *  routes return raw bytes rather than the usual `{ success, data }` envelope
   *  — the launcher writes them straight to disk and hashes them. */
  private stream(res: Response, download: ProxiedDownload): StreamableFile {
    res.setHeader('Content-Type', download.contentType);
    if (download.contentLength !== null) {
      // Without this the launcher cannot show a progress bar, which for a
      // 200 MB modpack is the whole difference between "working" and "frozen".
      res.setHeader('Content-Length', String(download.contentLength));
    }
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${download.filename.replace(/"/g, '')}"`,
    );
    return new StreamableFile(download.stream);
  }

  @Post('invites/redeem')
  @Public()
  @UseGuards(LauncherAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Canjear un código de invitación' })
  async redeem(
    @Body() dto: RedeemInviteDto,
    @Req() req: LauncherRequest,
  ): Promise<{ packId: string }> {
    return this.packs.redeemInvite(req.launcher!.uuid, dto.code);
  }
}
