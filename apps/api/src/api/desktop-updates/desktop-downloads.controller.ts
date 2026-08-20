import { Controller, Get, HttpStatus, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '@api/_utils/decorators/public.decorator';
import { env } from '@/config/env';
import { DesktopUpdatesService } from './desktop-updates.service';
import { DesktopDownloadEntity } from './entities/desktop-updates.entity';

/**
 * Lo que consume la página pública /launcher de la web.
 *
 * Separado de DesktopUpdatesController porque el contrato es el contrario: ahí
 * manda Tauri (sin sobre, 204 cuando ya estás al día); aquí manda la web, que
 * espera el sobre `{success,data}` y quiere la lista completa siempre.
 */
@ApiTags('Desktop | Downloads')
@Controller('desktop/downloads')
export class DesktopDownloadsController {
  constructor(private readonly updates: DesktopUpdatesService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Descargas públicas de la app',
    description:
      'La build publicada más reciente de cada plataforma, con tamaño y SHA-512 para verificar el archivo descargado.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: [DesktopDownloadEntity] })
  async list(@Req() req: Request): Promise<DesktopDownloadEntity[]> {
    return this.updates.downloads(baseUrl(req));
  }
}

/** Igual que en el feed: la URL tiene que ser absoluta porque se pinta en un
 *  enlace de descarga y puede consumirse desde otro origen. */
function baseUrl(req: Request): string {
  if (env.DESKTOP_UPDATE_BASE_URL) {
    return env.DESKTOP_UPDATE_BASE_URL.replace(/\/+$/, '');
  }
  const proto =
    (req.headers['x-forwarded-proto'] as string | undefined) ?? req.protocol;
  const host =
    (req.headers['x-forwarded-host'] as string | undefined) ?? req.get('host');
  return `${proto.split(',')[0]}://${host}`;
}
