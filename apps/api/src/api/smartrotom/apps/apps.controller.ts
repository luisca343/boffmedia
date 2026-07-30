import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
} from '@nestjs/common';
import { Public } from '@api/_utils/decorators/public.decorator';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppsFacadeService } from './apps.facade.service';
import { UpdateAppDto } from './dto/update-app.dto';
import { CreateAppDto } from './dto/create-app.dto';
import { OrderAppDto } from './dto/order-apps.dto';
import { PlayerAppDto } from './dto/player-app.dto';
import { GetPlayerAppsDto } from './dto/get-player-apps.dto';
import { RotomApp } from './entities/app.entity';
import { SuccessResponse } from '@api/_utils/entities/common-response.entity';
import { Logger } from 'nestjs-pino';

@ApiTags('SmartRotom | Apps')
@Public()
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

  @Post('player')
  @ApiOperation({ summary: 'Get apps for a player' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Apps found for player successfully.',
    type: [RotomApp],
  })
  @ApiBody({ type: GetPlayerAppsDto })
  async getForPlayer(@Body() { uuid }: GetPlayerAppsDto): Promise<RotomApp[]> {
    this.logger.log('Fetching apps for player:', uuid);
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
    @Body() { uuid, id }: PlayerAppDto,
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
    @Body() { uuid, id }: PlayerAppDto,
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
  async order(@Body() orderDto: OrderAppDto): Promise<SuccessResponse> {
    this.logger.log('Ordering apps with data:', orderDto);
    const result = await this.appsFacadeService.orderApps(
      orderDto.order,
      orderDto.uuid,
    );
    return {
      success: result.success,
      message: 'Apps ordered successfully',
    };
  }
}
