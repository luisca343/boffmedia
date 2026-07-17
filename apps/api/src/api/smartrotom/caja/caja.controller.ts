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
   * The mod's grant route — the backend, never the page, decides what a player receives.
   * Load-bearing decorators: `GameServerAuthGuard` accepts only the mod's Bearer (NOT
   * `GameOrUserAuthGuard`, whose public MC_WORLD tripwire would let a stranger burn rewards);
   * `@SkipEnvelope()` keeps `objetos` at the root the mod parses; and it is on the
   * `MinecraftMiddleware` exclude list (app.module.ts) since the mod sends no `server` field.
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
   * Phase one of loss-safe delivery (DARCAJA.md §7): soft-locks the grant and returns it
   * with a `reservationId`, spending nothing. The mod delivers, then calls `confirm`; an
   * unconfirmed reservation expires and frees up. Same auth/envelope/exclude rules as `claim`.
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
