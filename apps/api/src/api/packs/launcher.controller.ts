import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
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
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Public } from '@api/_utils/decorators/public.decorator';
import { DesktopThrottlerGuard } from '@api/_utils/guards/desktop-throttler.guard';
import { DesktopAuthGuard, DesktopRequest } from './guards/desktop-auth.guard';
import { PacksService } from './packs.service';
import type { PackPrincipal } from './packs.repository';
import {
  PacksDownloadsService,
  ProxiedDownload,
} from './packs-downloads.service';
import {
  DownloadQueryDto,
  ManifestQueryDto,
  PollDeviceAuthDto,
  RedeemInviteDto,
  StartDeviceAuthDto,
} from './dto/packs.dto';
import {
  DeviceAuthorizationEntity,
  DevicePollEntity,
  LauncherPackEntity,
  DesktopSessionUserEntity,
} from './entities/packs.entity';
import { DesktopDeviceService } from './desktop-device.service';
import { env } from '@/config/env';

// The launcher's entire surface. Identity is a BOFFMEDIA account, established
// by the device-authorization flow below — packs, events, entitlement and
// downloads are all Boffmedia-level facts, and requiring a paid Minecraft
// account to open an emulator pack had no product justification left.
//
// `@Public()` is applied PER ROUTE, never on the class: it exempts these from
// the global JwtAuthGuard (a launcher token is not a website session), and the
// DesktopAuthGuard below does the real authentication itself.
@ApiTags('Packs | Launcher')
@Controller('packs/launcher')
export class LauncherController {
  constructor(
    private readonly device: DesktopDeviceService,
    private readonly packs: PacksService,
    private readonly downloads: PacksDownloadsService,
  ) {}

  // Throttled by IP: these are unauthenticated and each one writes a row.
  @Post('auth/device')
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Paso 1: pedir un código para autorizar este launcher',
    description:
      'El jugador aprueba el código en la web, donde ya ha iniciado sesión. Sustituye al handshake de Mojang: el launcher se identifica con una cuenta de Boffmedia, no con una de Minecraft.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: DeviceAuthorizationEntity })
  async startDevice(
    @Body() dto: StartDeviceAuthDto,
  ): Promise<DeviceAuthorizationEntity> {
    return this.device.start(
      dto.clientLabel ?? null,
      `${env.WEB_URL}/app/autorizar`,
    );
  }

  @Post('auth/device/poll')
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Paso 2: esperar a que el jugador apruebe',
    description:
      'Devuelve `pending` hasta que alguien decide. Una aprobación se canjea una sola vez.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: DevicePollEntity })
  async pollDevice(@Body() dto: PollDeviceAuthDto): Promise<DevicePollEntity> {
    return this.device.poll(dto.deviceCode) as Promise<DevicePollEntity>;
  }

  /** The account is the principal; the Minecraft UUID rides along only so
   *  legacy pack_acl pre-grants keyed on it still resolve. */
  private principalOf(req: DesktopRequest): PackPrincipal {
    return {
      userId: req.desktopClient!.userId,
      mcUuid: req.desktopClient!.mcUuid ?? null,
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

  /**
   * A pack's shareable page — the one genuinely UNAUTHENTICATED read in this
   * file. Everything else here is `@Public()` only to get past the website's
   * JwtAuthGuard before `DesktopAuthGuard` does the real check; this one has no
   * guard at all, on purpose.
   *
   * That makes the access rule the whole of its security, so it is stated in one
   * place and it is absolute: PUBLIC PACKS ONLY. `password` and `allowlist`
   * exist so a pack's composition is not public, and they 404 rather than
   * returning a reduced page — a page that said "this pack exists but you cannot
   * see it" would still disclose the existence and the name of a private pack.
   *
   * Throttled by IP like the other unauthenticated routes: this one takes a slug
   * from the URL and hits the database with it, so an unthrottled version is a
   * free slug-enumeration oracle.
   */
  @Get('public/:slug')
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @ApiOperation({
    summary: 'La página pública de un pack',
    description:
      'Solo packs con acceso `public`. Los de contraseña y lista blanca devuelven 404: existen precisamente para que su composición no sea pública. No incluye `files[]` ni hashes — es un escaparate, no una fuente de instalación.',
  })
  @ApiResponse({ status: HttpStatus.OK })
  async publicPage(@Param('slug') slug: string) {
    const view = await this.packs.publicPage(slug);
    if (!view) throw new NotFoundException('Pack no encontrado');
    return view;
  }

  @Get('me')
  @Public()
  @UseGuards(DesktopAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'La cuenta de esta sesión',
    description:
      'El launcher lo llama al arrancar: una sesión de 30 días sobrevive a muchos motivos para revocarla, y enterarse al iniciar es mejor que enterarse a mitad de una instalación.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: DesktopSessionUserEntity })
  me(@Req() req: DesktopRequest): DesktopSessionUserEntity {
    return {
      id: req.desktopClient!.userId,
      username: req.desktopClient!.username,
      mcUuid: req.desktopClient!.mcUuid ?? null,
    };
  }

  @Get('packs')
  @Public()
  @UseGuards(DesktopAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Los packs a los que esta cuenta tiene acceso' })
  @ApiResponse({ status: HttpStatus.OK, type: [LauncherPackEntity] })
  async list(
    @Req() req: DesktopRequest,
    @Headers('x-boff-game-types') gameTypes?: string,
  ): Promise<LauncherPackEntity[]> {
    return this.packs.listForLauncher(
      this.principalOf(req),
      this.capabilitiesFrom(gameTypes),
    ) as Promise<LauncherPackEntity[]>;
  }

  @Get('packs/:id/manifest')
  @Public()
  @UseGuards(DesktopAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'El manifiesto a instalar',
    description:
      'Revalida el acceso: el listado y la descarga son peticiones distintas y el acceso puede revocarse entre ambas. Devuelve 409 si el pack usa un juego que este launcher no sabe interpretar (X-Boff-Game-Types).',
  })
  async manifest(
    @Param('id') id: string,
    @Query() query: ManifestQueryDto,
    @Req() req: DesktopRequest,
    @Headers('x-boff-game-types') gameTypes?: string,
  ): Promise<unknown> {
    return this.packs.manifestFor(
      this.principalOf(req),
      id,
      query.password ?? null,
      this.capabilitiesFrom(gameTypes),
    );
  }

  // ── Downloads (an install is blocked without these) ──────────────────────

  @Get('packs/:id/files/curseforge/:projectId/:fileId')
  @Public()
  @UseGuards(DesktopAuthGuard)
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
    @Req() req: DesktopRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    await this.packs.entitledFile(
      this.principalOf(req),
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
  @UseGuards(DesktopAuthGuard)
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
    @Req() req: DesktopRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const blob = sha512.toLowerCase();
    // includeWorlds: bundled worlds and initialFiles ride this route too; the
    // CurseForge route stays pinned to files[].
    await this.packs.entitledFile(
      this.principalOf(req),
      id,
      query.password ?? null,
      (file) =>
        file.source.kind === 'override' && file.source.blobSha512 === blob,
      { includeWorlds: true },
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

  // Per-account, not per-IP: redemption is the abuse surface once launcher
  // sessions stop costing a paid Minecraft account.
  @Post('invites/redeem')
  @Public()
  @UseGuards(DesktopAuthGuard, DesktopThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Canjear un código de invitación' })
  async redeem(
    @Body() dto: RedeemInviteDto,
    @Req() req: DesktopRequest,
  ): Promise<{ packId: string }> {
    return this.packs.redeemInvite(req.desktopClient!, dto.code);
  }
}
