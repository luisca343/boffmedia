import { Roles } from '@api/_utils/decorators/roles.decorator';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppsFacadeService } from './apps.facade.service';
import { UpdateAppDto } from './dto/update-app.dto';
import { CreateAppDto } from './dto/create-app.dto';
import { OrderAppDto } from './dto/order-apps.dto';
import { PlayerAppDto } from './dto/player-app.dto';
import { RotomApp } from './entities/app.entity';
import { SuccessResponse } from '@api/_utils/entities/common-response.entity';
import { Logger } from 'nestjs-pino';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { CurrentMcUuid } from '@api/_utils/decorators/current-user.decorator';

@ApiTags('SmartRotom | Apps')
// The app registry (create/rename/activate/delete) is an admin surface and is
// gated per method below; the four `player/*` routes are the caller's own dock
// and need only a session. The whole controller used to be @Public(), so anyone
// could delete an app for everyone or reorder another player's dock.
@Controller('/smartrotom/apps')
export class AppsController {
  constructor(
    private readonly logger: Logger,
    private readonly appsFacadeService: AppsFacadeService,
  ) {}

  // ==================== APP MANAGEMENT ====================

  @Get()
  @ApiOperation({ summary: 'Get all apps' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Apps found successfully.',
    type: [RotomApp],
  })
  async findAll(): Promise<RotomApp[]> {
    return this.appsFacadeService.getApps();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active apps' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active apps found successfully.',
    type: [RotomApp],
  })
  async findActive(): Promise<RotomApp[]> {
    return this.appsFacadeService.getActiveApps();
  }

  @Get('inactive')
  @ApiOperation({ summary: 'Get all inactive apps' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inactive apps found successfully.',
    type: [RotomApp],
  })
  async findInactive(): Promise<RotomApp[]> {
    return this.appsFacadeService.getInactiveApps();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an app by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'App found successfully.',
    type: RotomApp,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'App not found.',
  })
  async findOne(@Param('id') id: number): Promise<RotomApp> {
    return this.appsFacadeService.getApp(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ROTOM_ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new app' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'App created successfully.',
    type: RotomApp,
  })
  @ApiBody({ type: CreateAppDto })
  async create(@Body() createAppDto: CreateAppDto): Promise<RotomApp> {
    return this.appsFacadeService.createApp(createAppDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ROTOM_ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update an app by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'App updated successfully.',
    type: RotomApp,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'App not found.',
  })
  @ApiBody({ type: UpdateAppDto })
  async update(
    @Param('id') id: number,
    @Body() updateAppDto: UpdateAppDto,
  ): Promise<RotomApp> {
    return this.appsFacadeService.updateApp(id, updateAppDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ROTOM_ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an app by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'App deleted successfully.',
    type: SuccessResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'App not found.',
  })
  async remove(@Param('id') id: number): Promise<SuccessResponse> {
    return this.appsFacadeService.deleteApp(id);
  }

  // ==================== APP STATUS MANAGEMENT ====================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ROTOM_ADMIN)
  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate an app by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'App activated successfully.',
    type: RotomApp,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'App not found.',
  })
  async activate(@Param('id') id: number): Promise<RotomApp> {
    return this.appsFacadeService.activateApp(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.ROTOM_ADMIN)
  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate an app by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'App deactivated successfully.',
    type: RotomApp,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'App not found.',
  })
  async deactivate(@Param('id') id: number): Promise<RotomApp> {
    return this.appsFacadeService.deactivateApp(id);
  }

  // ==================== PLAYER APP MANAGEMENT ====================
  // These four are the player's own dock, not the registry: a session is
  // enough, and the owner comes from it. @Roles() with no argument clears the
  // class-level admin requirement for the handler.

  @Post('player')
  @ApiOperation({ summary: 'Get apps for a player' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Apps found for player successfully.',
    type: [RotomApp],
  })
  async getForPlayer(@CurrentMcUuid() uuid: string): Promise<RotomApp[]> {
    return this.appsFacadeService.getAppsForPlayer(uuid);
  }

  @Post('player/add')
  @ApiOperation({ summary: 'Add an app to a player' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'App added to player successfully.',
    type: SuccessResponse,
  })
  @ApiBody({ type: PlayerAppDto })
  async addAppToPlayer(
    @Body() { id }: PlayerAppDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<SuccessResponse> {
    return this.appsFacadeService.addAppToPlayer(uuid, id);
  }

  @Post('player/remove')
  @ApiOperation({ summary: 'Remove an app from a player' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'App removed from player successfully.',
    type: SuccessResponse,
  })
  @ApiBody({ type: PlayerAppDto })
  async removeAppFromPlayer(
    @Body() { id }: PlayerAppDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<SuccessResponse> {
    return this.appsFacadeService.removeAppFromPlayer(uuid, id);
  }

  // ==================== APP ORDERING ====================

  @Post('order')
  @ApiOperation({ summary: 'Order the apps for a player' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Apps ordered successfully.',
    type: SuccessResponse,
  })
  @ApiBody({ type: OrderAppDto })
  async order(
    @Body() orderDto: OrderAppDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<SuccessResponse> {
    const result = await this.appsFacadeService.orderApps(orderDto.order, uuid);
    return {
      success: result.success,
      message: 'Apps ordered successfully',
    };
  }
}
