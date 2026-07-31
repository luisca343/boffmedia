import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public } from '@api/_utils/decorators/public.decorator';
import { SkipEnvelope } from '@/common/decorators/skip-envelope.decorator';
import { env } from '@/config/env';
import { LauncherUpdatesService } from './launcher-updates.service';
import { UpdaterFeedEntity } from './entities/launcher-updates.entity';

/**
 * El feed de auto-actualización del Boff Launcher (plugin updater de Tauri v2).
 *
 * Todo aquí es PÚBLICO a propósito: el launcher comprueba si hay actualización
 * antes de que el usuario inicie sesión, así que exigir un token haría que un
 * launcher roto nunca pudiera arreglarse solo. Lo que protege la cadena no es
 * la autenticación sino la firma minisign: el updater rechaza cualquier
 * artefacto cuya firma no verifique contra la clave pública compilada en la app.
 */
@ApiTags('Launcher | Updates')
@Controller('launcher/updates')
export class LauncherUpdatesController {
  constructor(private readonly updates: LauncherUpdatesService) {}

  @Get(':target/:currentVersion')
  @Public()
  @SkipEnvelope()
  @ApiOperation({
    summary: 'Feed de actualización del launcher',
    description:
      'Configúralo en tauri.conf.json como `.../launcher/updates/{{target}}-{{arch}}/{{current_version}}`. Devuelve 204 sin cuerpo cuando ya está actualizado, y el JSON de Tauri v2 (version, notes, pub_date, platforms) cuando hay algo más nuevo. Sin sobre `{success,data}`: Tauri deserializa el cuerpo tal cual.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: UpdaterFeedEntity })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Ya está actualizado' })
  async feed(
    @Param('target') target: string,
    @Param('currentVersion') currentVersion: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UpdaterFeedEntity | undefined> {
    const feed = await this.updates.feed(target, currentVersion, baseUrl(req));
    if (!feed) {
      res.status(HttpStatus.NO_CONTENT);
      return undefined;
    }
    return feed;
  }

  @Get('download/:version/:target')
  @Public()
  @ApiOperation({
    summary: 'Descargar el bundle de una versión',
    description:
      'La URL que el feed publica en `platforms[].url`. Devuelve los bytes en crudo: StreamableFile atraviesa el ResponseInterceptor sin sobre, y el updater escribe el cuerpo directamente a disco.',
  })
  async download(
    @Param('version') version: string,
    @Param('target') target: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const artifact = await this.updates.artifact(version, target);
    res.setHeader('Content-Type', 'application/octet-stream');
    // Sin esto el updater no puede mostrar progreso, y un bundle de 100 MB
    // parece colgado en vez de descargándose.
    res.setHeader('Content-Length', String(artifact.contentLength));
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${artifact.filename.replace(/"/g, '')}"`,
    );
    return new StreamableFile(artifact.stream);
  }

  /** Alias sin versión: útil para enlazar «descargar el launcher» desde la web. */
  @Get('latest/:target')
  @Public()
  @SkipEnvelope()
  @ApiExcludeEndpoint()
  async latest(
    @Param('target') target: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UpdaterFeedEntity | undefined> {
    const feed = await this.updates.feed(target, '0.0.0', baseUrl(req));
    if (!feed) {
      res.status(HttpStatus.NO_CONTENT);
      return undefined;
    }
    return feed;
  }
}

/** Tauri descarga la URL del feed desde otro proceso, así que tiene que ser
 *  absoluta. LAUNCHER_UPDATE_BASE_URL manda; si no está, se deriva de las
 *  cabeceras del proxy, que es correcto en dev y detrás de un proxy bien
 *  configurado. */
function baseUrl(req: Request): string {
  if (env.LAUNCHER_UPDATE_BASE_URL) {
    return env.LAUNCHER_UPDATE_BASE_URL.replace(/\/+$/, '');
  }
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? req.protocol;
  const host = (req.headers['x-forwarded-host'] as string | undefined) ?? req.get('host');
  return `${proto.split(',')[0]}://${host}`;
}
