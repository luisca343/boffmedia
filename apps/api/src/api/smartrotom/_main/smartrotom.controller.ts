import { SmartrotomService } from './smartrotom.service';
import { Public } from '@api/_utils/decorators/public.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  Post,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { TeleportPlayerDto } from '../_dto/teleport-player.dto';
import { WingullFacadeService } from '../wingull/wingull.facade.service';
import { ArceuSpeakEntity } from './entities/arceuspeak.entity';
import { ArceusspeakDto } from '../_dto/arceuspeak.dto';
import { CurrentMcUuid } from '@api/_utils/decorators/current-user.decorator';
import { RequireSession } from '@api/_utils/decorators/require-session.decorator';

@ApiTags('Smartrotom')
@Public()
@Controller('smartrotom')
export class SmartrotomController {
  constructor(
    private smartrotomService: SmartrotomService,
    private wingullService: WingullFacadeService,
  ) {}

  @Get('performance')
  @ApiOperation({ summary: 'Get performance' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve performance.',
  })
  async getPerformance() {
    return await this.wingullService.getPerformance();
  }

  @Get('arceuspeak')
  @ApiOperation({ summary: 'Get Arceuspeak available characters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Characters retrieved successfully.',
    type: ArceuSpeakEntity,
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve characters.',
  })
  async getArceuspeak() {
    return await this.smartrotomService.getArceuspeak();
  }

  // Only the gobierno admin UI (VozCreator) writes personas. The controller is
  // class-level @Public(), which would make a route-level @UseGuards(JwtAuthGuard)
  // a no-op — @RequireSession() is the only thing that restores authentication
  // here, and RolesGuard needs the `req.user` it populates.
  @RequireSession()
  @UseGuards(RolesGuard)
  @Roles(USER_ROLES.GOBIERNO, USER_ROLES.ROTOM_ADMIN)
  @Post('arceuspeak')
  @ApiOperation({ summary: 'Create or update Arceuspeak character (admin)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Character created or updated successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to create or update character.',
  })
  async createOrUpdateArceuspeak(
    @Body() { name, value, format }: ArceusspeakDto,
  ) {
    return await this.smartrotomService.createOrUpdateArceuspeak(
      name,
      value,
      format,
    );
  }

  @Get('taxi/stops')
  @ApiOperation({ summary: 'Get all taxi stops' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Taxi stops retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve taxi stops.',
  })
  async getTaxiStops() {
    return await this.wingullService.getTaxiStops();
  }

  @RequireSession()
  @Post('taxi/teleport')
  @ApiOperation({ summary: 'Teleport a player to a destination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Player teleported successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to teleport player.',
  })
  async teleportPlayer(
    @Body() body: TeleportPlayerDto,
    @CurrentMcUuid() uuid: string,
  ) {
    // Teleports the CALLER. The uuid used to come from the body on a public
    // route, so anyone could move any player anywhere.
    const result = await this.wingullService.teleportPlayer(body.id, uuid);
    return { success: result };
  }
}
