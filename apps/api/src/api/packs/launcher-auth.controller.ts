import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { FullSessionGuard } from '@api/_utils/guards/full-session.guard';
import { UserThrottlerGuard } from '@api/_utils/guards/user-throttler.guard';
import { LauncherDeviceService } from './launcher-device.service';
import { DeviceRequestEntity } from './entities/packs.entity';
import { DeviceDecisionDto, DeviceLookupDto } from './dto/packs.dto';

/**
 * The website half of the launcher's device-authorization flow. The player is
 * already signed in here, which is the whole point: the launcher never sees a
 * password and never needs a browser it controls.
 *
 * FullSessionGuard on the decision routes: an in-game MCEF session proves only
 * a public Minecraft UUID, and must not be able to hand out a 30-day launcher
 * session for the account.
 */
@ApiTags('Packs | Launcher authorization')
@Controller('launcher/auth')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class LauncherAuthController {
  constructor(private readonly device: LauncherDeviceService) {}

  @Get('device')
  @ApiOperation({ summary: 'Qué launcher está pidiendo autorización' })
  @ApiResponse({ status: HttpStatus.OK, type: DeviceRequestEntity })
  async describe(@Query() query: DeviceLookupDto) {
    return this.device.describe(query.userCode);
  }

  @Post('device/approve')
  @UseGuards(FullSessionGuard, UserThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autorizar a este launcher a usar tu cuenta',
    description:
      'Requiere el correo verificado: aprobar es lo que convierte una cuenta gratuita en una sesión de launcher, y esa es la contrapartida de haber quitado el requisito de tener Minecraft comprado.',
  })
  async approve(
    @Body() dto: DeviceDecisionDto,
    @Req() req: { user: { userId: number } },
  ): Promise<{ success: true }> {
    await this.device.approve(dto.userCode, req.user.userId);
    return { success: true };
  }

  @Post('device/deny')
  @UseGuards(FullSessionGuard, UserThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rechazar la solicitud' })
  async deny(
    @Body() dto: DeviceDecisionDto,
    @Req() req: { user: { userId: number } },
  ): Promise<{ success: true }> {
    await this.device.deny(dto.userCode, req.user.userId);
    return { success: true };
  }
}
