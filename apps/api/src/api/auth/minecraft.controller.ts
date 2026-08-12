import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Public } from '@api/_utils/decorators/public.decorator';
import { FullSessionGuard } from '@api/_utils/guards/full-session.guard';
import { UserThrottlerGuard } from '@api/_utils/guards/user-throttler.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import { MinecraftHandshakeService } from './minecraft-handshake.service';
import { MinecraftLinkService } from './minecraft-link.service';
import { BoffMediaUsersFacadeService } from '@api/boffmedia/users/users.facade.service';
import {
  McLinkPollDto,
  McSessionDto,
} from './dto/minecraft-link.dto';
import {
  McDeviceCodeEntity,
  McLinkPollEntity,
  McJoinChallengeEntity,
} from './entities/minecraft-link.entity';

/**
 * Everything that attaches a Minecraft identity to a Boffmedia account, or
 * exchanges one for a session.
 *
 * Both routes here PROVE the identity — one through Microsoft, one through
 * Mojang. The paths they replace trusted the `MC_WORLD` string, which is
 * documented as non-secret and ships inside the browser bundle, so knowing a
 * player's UUID was enough to take their account over.
 */
@ApiTags('BoffMedia | Minecraft')
@Controller('auth/minecraft')
export class MinecraftController {
  /**
   * Pending Microsoft device flows, keyed by the account that started one.
   *
   * In memory, like the Mojang challenge and for the same reason: the API runs
   * as a single container and a code lives ten minutes. Keyed by user id rather
   * than handed to the browser so the Microsoft device code — which is a
   * bearer credential for the whole flow — never leaves the server. If the API
   * is ever scaled horizontally this must move to the database.
   */
  private readonly pendingLinks = new Map<
    number,
    { deviceCode: string; expiresAt: number }
  >();

  constructor(
    private readonly link: MinecraftLinkService,
    private readonly handshake: MinecraftHandshakeService,
    private readonly users: BoffMediaUsersFacadeService,
    private readonly auth: AuthService,
  ) {}

  // ── Linking, via Microsoft ────────────────────────────────────────────────

  @Post('link/start')
  @UseGuards(JwtAuthGuard, FullSessionGuard, UserThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Empezar a vincular una cuenta de Minecraft',
    description:
      'Devuelve un código que el jugador introduce en microsoft.com/link. Se usa el flujo de código de dispositivo porque no necesita ni URI de redirección registrada ni secreto de cliente: web y launcher comparten el mismo registro público ya aprobado.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: McDeviceCodeEntity })
  async startLink(
    @Req() req: { user: { userId: number } },
  ): Promise<McDeviceCodeEntity> {
    this.sweep();
    const code = await this.link.requestDeviceCode();
    this.pendingLinks.set(req.user.userId, {
      deviceCode: code.deviceCode,
      expiresAt: Date.now() + code.expiresIn * 1000,
    });

    return {
      userCode: code.userCode,
      verificationUri: code.verificationUri,
      expiresIn: code.expiresIn,
      intervalSeconds: code.intervalSeconds,
    };
  }

  @Post('link/poll')
  @UseGuards(JwtAuthGuard, FullSessionGuard, UserThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 120 } })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Comprobar si el jugador ya ha autorizado en Microsoft',
    description:
      'Cada llamada consulta a Microsoft una sola vez y vuelve; el navegador marca el ritmo. Un poll que durmiera los diez minutos del código dejaría un worker bloqueado por petición.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: McLinkPollEntity })
  async pollLink(
    @Body() _dto: McLinkPollDto,
    @Req() req: { user: { userId: number } },
  ): Promise<McLinkPollEntity> {
    const pending = this.pendingLinks.get(req.user.userId);
    if (!pending || pending.expiresAt < Date.now()) {
      this.pendingLinks.delete(req.user.userId);
      return { status: 'expired' };
    }

    const result = await this.link.poll(pending.deviceCode);
    if (result.status !== 'ready') {
      if (result.status !== 'pending') {
        this.pendingLinks.delete(req.user.userId);
      }
      return { status: result.status };
    }

    this.pendingLinks.delete(req.user.userId);
    await this.users.linkProvenMinecraftAccount(req.user.userId, {
      uuid: result.profile.uuid,
      username: result.profile.username,
    });

    return {
      status: 'linked',
      uuid: result.profile.uuid,
      username: result.profile.username,
    };
  }

  // ── In-game session, via Mojang ───────────────────────────────────────────

  @Post('challenge')
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Paso 1: obtener un serverId para el handshake de Mojang',
    description:
      'Para el mod cliente, que posee el token de sesión de la partida en curso y puede por tanto completar session/minecraft/join.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: McJoinChallengeEntity })
  challenge(): McJoinChallengeEntity {
    return this.handshake.createChallenge();
  }

  @Post('session')
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Paso 3: canjear el desafío por una sesión in-game',
    description:
      'Única vía para obtener una sesión in-game. Sustituyó a /auth/loginmc, que aceptaba un UUID público sin prueba alguna y ya no existe. La sesión sigue estando limitada a `ingame`: probar la identidad de Minecraft no es lo mismo que iniciar sesión en la web.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Sesión in-game.' })
  async session(@Body() dto: McSessionDto) {
    const profile = await this.handshake.verify(dto.username, dto.serverId);
    return this.auth.loginProvenMinecraft(profile.uuid);
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, value] of this.pendingLinks) {
      if (value.expiresAt < now) this.pendingLinks.delete(key);
    }
  }
}
