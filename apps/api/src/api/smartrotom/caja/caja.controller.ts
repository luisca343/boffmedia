import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '@api/_utils/decorators/public.decorator';
import { SkipEnvelope } from '@/common/decorators/skip-envelope.decorator';
import { GameServerAuthGuard } from '@api/_utils/guards/game-server-auth.guard';
import { CajaService } from './caja.service';
import { ClaimCajaDto, ConfirmCajaDto } from './dto/claim-caja.dto';
import {
  ClaimCajaResponse,
  ConfirmCajaResponse,
  ReserveCajaResponse,
} from './entities/objeto-mc.entity';

@ApiTags('SmartRotom | Caja')
@Controller('smartrotom/caja')
export class CajaController {
  constructor(private readonly cajaService: CajaService) {}

  /**
   * The mod's grant route. The backend — never the page — decides what a player
   * receives, which is what makes a modified client unable to mint items.
   *
   * Three things this route depends on, each one load-bearing:
   *  - `@Public()` bypasses the global JwtAuthGuard; `GameServerAuthGuard` then
   *    accepts only the mod's opaque Bearer (`TERAS_API_TOKEN`). Deliberately NOT
   *    `GameOrUserAuthGuard`: that one still honours the `body.server`/MC_WORLD
   *    tripwire while `ENFORCE_MONEY_AUTH` is false, and MC_WORLD is public — on a
   *    route that spends, that would let a stranger burn a player's rewards.
   *  - `@SkipEnvelope()` keeps `objetos` at the response root. The mod parses it
   *    from there; re-enveloping this route silently makes every claim grant nothing.
   *  - It is on the `MinecraftMiddleware` exclude list in app.module.ts, because
   *    the mod sends no `server` field. Without that it 403s before routing.
   */
  @Post('claim')
  @Public()
  @UseGuards(GameServerAuthGuard)
  @SkipEnvelope()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Redeem a player's owed items for one source, one-shot (mod only)",
    description:
      'Spends and returns in one step — the caller MUST deliver what it gets, or ' +
      'the reward is lost. Prefer reserve + confirm for deliveries that can drop.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: ClaimCajaResponse })
  async claim(@Body() body: ClaimCajaDto): Promise<ClaimCajaResponse> {
    return await this.cajaService.claim(body.uuid, body.source, body.ids);
  }

  /**
   * Phase one of loss-safe delivery (DARCAJA.md §7). Soft-locks the grant and
   * returns it with a `reservationId`, spending nothing. The mod delivers, then
   * calls `confirm`. A reservation never confirmed expires and the rows free up, so
   * a dropped connection between reserve and confirm loses no reward. Same auth,
   * envelope and exclude-list rules as `claim` — see that handler.
   */
  @Post('reserve')
  @Public()
  @UseGuards(GameServerAuthGuard)
  @SkipEnvelope()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Reserve a player's owed items without spending them (mod only)",
  })
  @ApiResponse({ status: HttpStatus.OK, type: ReserveCajaResponse })
  async reserve(@Body() body: ClaimCajaDto): Promise<ReserveCajaResponse> {
    return await this.cajaService.reserve(body.uuid, body.source, body.ids);
  }

  /**
   * Phase two: finalize a reservation once its items are in the player's hands.
   * Idempotent — replaying, or confirming an expired reservation, spends nothing.
   */
  @Post('confirm')
  @Public()
  @UseGuards(GameServerAuthGuard)
  @SkipEnvelope()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm a delivered reservation, spending it (mod only)' })
  @ApiResponse({ status: HttpStatus.OK, type: ConfirmCajaResponse })
  async confirm(@Body() body: ConfirmCajaDto): Promise<ConfirmCajaResponse> {
    return await this.cajaService.confirm(body.uuid, body.reservationId);
  }
}
