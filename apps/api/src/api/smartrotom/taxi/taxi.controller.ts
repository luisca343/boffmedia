import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Logger } from 'nestjs-pino';
import { Public } from '@api/_utils/decorators/public.decorator';
import { GameOrUserAuthGuard } from '@api/_utils/guards/game-or-user-auth.guard';
import { actingUuid, resolveActor } from '@api/_utils/auth/actor';
import { TaxiService } from './taxi.service';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { AdminTeleportDto, TakeTripDto } from './dto/taxi.dto';
import { TaxiConfig, TripResult } from './entities/taxi.entity';

@ApiTags('SmartRotom | Taxi')
@Controller('smartrotom/taxi')
export class TaxiController {
  constructor(
    private readonly logger: Logger,
    private readonly taxiService: TaxiService,
  ) {}

  @Get('config')
  @Public()
  @ApiOperation({
    summary: 'The fare model and the account fares are paid into',
    description:
      'Served so the web renders its estimate from the same numbers the server charges, and ' +
      'reads the travel history off the real service account instead of a hardcoded id.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: TaxiConfig })
  async getConfig(): Promise<TaxiConfig> {
    return this.taxiService.getConfig();
  }

  @Post('trip')
  @Public()
  @UseGuards(GameOrUserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Travel to a stop, then pay for it',
    description:
      'Teleports first and charges only on a confirmed arrival, so a failed trip costs ' +
      'nothing. The fare is computed here from the live position — any price in the body ' +
      'is ignored.',
  })
  @ApiBody({ type: TakeTripDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: TripResult })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The stop no longer exists.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'No safe arrival, or the player is in a dungeon run.',
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The player is not online.',
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description:
      'The game server did not confirm the trip. Nothing was charged.',
  })
  async takeTrip(
    @Body() dto: TakeTripDto,
    @Req() req: Request,
  ): Promise<TripResult> {
    // A signed-in caller always travels as themselves; `actingUuid` refuses a body uuid that
    // is not theirs. Only the trusted game server may name a passenger.
    const uuid = actingUuid(dto.uuid, resolveActor(req));
    if (!uuid) {
      throw new UnauthorizedException('A passenger uuid is required');
    }
    this.logger.log(`Taxi: ${uuid} is travelling to '${dto.stopId}'`);
    return this.taxiService.takeTrip(dto.stopId, uuid);
  }

  @Post('admin/teleport')
  @UseGuards(JwtAuthGuard, RolesGuard)
  // Administración surface: ROTOM_ADMIN (or a Boffmedia admin) only — a plain
  // GOBIERNO officer must not be able to teleport players.
  @Roles(USER_ROLES.ROTOM_ADMIN, USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Move a player to a stop, as a moderation action',
    description:
      'No fare and no ledger row — this is not a trip and never appears in the passport. ' +
      'Audited, and the player is told they were moved.',
  })
  @ApiBody({ type: AdminTeleportDto })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'The player is not online.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async adminTeleport(
    @Body() dto: AdminTeleportDto,
    @Req() req: Request & { user?: { mcUuid?: string } },
  ): Promise<void> {
    // The actor is taken from the token, never from the body: this route moves *other* people,
    // so the audit trail has to name whoever actually held the session.
    const actorUuid = req.user?.mcUuid;
    if (!actorUuid) {
      throw new UnauthorizedException('A linked Minecraft account is required');
    }
    this.logger.log(
      `Taxi: ${actorUuid} is moving ${dto.uuid} to '${dto.stopId}'`,
    );
    await this.taxiService.adminTeleport(
      dto.stopId,
      dto.uuid,
      actorUuid,
      dto.reason,
    );
  }
}
