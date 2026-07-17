import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '@api/_utils/decorators/public.decorator';
import { SkipEnvelope } from '@/common/decorators/skip-envelope.decorator';
import { GameServerAuthGuard } from '@api/_utils/guards/game-server-auth.guard';
import { CajaService } from './caja.service';
import { ClaimCajaDto } from './dto/claim-caja.dto';
import { ClaimCajaResponse } from './entities/objeto-mc.entity';

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
    summary: "Redeem a player's owed items for one source (mod only)",
  })
  @ApiResponse({ status: HttpStatus.OK, type: ClaimCajaResponse })
  async claim(@Body() body: ClaimCajaDto): Promise<ClaimCajaResponse> {
    return await this.cajaService.claim(body.uuid, body.source, body.ids);
  }
}
