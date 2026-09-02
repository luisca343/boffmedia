import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '@api/_utils/decorators/public.decorator';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { DesktopOrUserAuthGuard } from '@api/packs/guards/desktop-or-user-auth.guard';
import { AppService } from './app.service';
import { promises as fs } from 'fs';
import { join } from 'path';
import { SkipEnvelope } from './common/decorators/skip-envelope.decorator';

/**
 * Auth here is per route and must stay that way. JwtAuthGuard resolves
 * IS_PUBLIC_KEY from the handler first and the controller class second and
 * takes the first defined value, so a class-level @Public() would neuter
 * @UseGuards on every guarded route below.
 */
@ApiTags('Boffmedia')
@Controller()
@SkipEnvelope()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('zomboid')
  async zomboid() {
    const filePath = join(process.cwd(), 'data', 'zomboid', 'data.txt');
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const lines = data.split('\n');
      const result: Record<string, any> = {};

      lines.forEach((line) => {
        const [key, value] = line.split('=');
        if (key && value) {
          const baseKey = key.replace(/Date$/, '');
          if (!result[baseKey]) {
            result[baseKey] = {};
          }
          if (key.endsWith('Date')) {
            result[baseKey].date = Number(value);
          } else {
            result[baseKey].value = Number(value);
          }
        }
      });

      return result;
    } catch (_err: any) {
      return { error: 'Failed to read file' };
    }
  }

  /**
   * The container HEALTHCHECK and any external prober call this unauthenticated,
   * so it must stay @Public(). It answers 200 even when a dependency is down —
   * `status` carries the degradation — so a database blip cannot restart-loop
   * the container. Only returns minimal status; detailed diagnostics require
   * admin role (see GET /health/admin).
   */
  @Public()
  @Get('health')
  async getHealth() {
    return this.appService.getHealth();
  }

  /**
   * Admin-only health diagnostics: memory usage, connection latencies, uptime,
   * response times, and per-service status. Gated behind admin role because
   * these details could aid reconnaissance (e.g. "process is low on memory",
   * "database connection is slow", "Wingull API is unreachable").
   */
  @Get('health/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  async getHealthAdmin() {
    return this.appService.getHealthAdmin();
  }

  /**
   * Service banner for the API root. Deliberately carries no configuration:
   * anything reachable without a token answers only with what it already
   * announces about itself.
   */
  @Public()
  @Get()
  getRoot(): { service: string; status: string } {
    return { service: 'boffmedia-api', status: 'ok' };
  }

  /**
   * Flips production log verbosity for the whole process, so it is an
   * admin-only switch: left open it is a disk-fill vector.
   */
  @Get('togglelogging')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  toggleLogging() {
    return { logging: this.appService.toggleLogging() };
  }

  @Public()
  @Get('blogicons')
  async blogicons() {
    return await this.appService.blogicons();
  }

  /**
   * El inventario de claves de Steam de Boffmedia. Solo BOFF_ADMIN.
   *
   * `@Public()` se queda: marca la ruta como exenta del `JwtAuthGuard` GLOBAL,
   * que rechaza un token de la app por su claim `typ` antes de que ningún guard
   * de aquí llegue a ejecutarse. La autenticación real son los dos guards de
   * debajo — mismo patrón que `packs/launcher/me`.
   *
   * `DesktopOrUserAuthGuard` acepta las dos credenciales (sesión web y sesión de
   * la app) y rellena `req.user.roles` en ambos casos, que es lo que
   * `RolesGuard` lee. Las dos superficies muestran esta herramienta, así que
   * las dos tienen que poder autenticarse contra ella.
   */
  @Public()
  @UseGuards(DesktopOrUserAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @Get('steamkeys')
  async steamkeys() {
    return await this.appService.steamKeys();
  }

  @Public()
  @Get('steamdata/:steamID')
  async steamData(@Param('steamID') steamID: string) {
    return await this.appService.getSteamData(steamID);
  }

  /**
   * Games that are 100 % off on Steam right now — the API-side mirror of
   * store.steampowered.com/search/?maxprice=free&category1=998&specials=1.
   * The lang query is the UI locale (es|en); prices are always quoted in EUR.
   */
  @Public()
  @Get('steamfree')
  async steamFree(@Query('lang') lang?: string) {
    return await this.appService.getSteamFreeGames(lang);
  }
}
