import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppsFacadeService } from './apps.facade.service';
import { UpdateAppDto } from './dto/update-app.dto';
import { CreateAppDto } from './dto/create-app.dto';
import { OrderAppDto } from './dto/order-apps.dto';
import { PlayerAppDto } from './dto/player-app.dto';
import { GetPlayerAppsDto } from './dto/get-player-apps.dto';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { App } from './entities/app.entity';
import { SuccessResponse } from '@api/_utils/entities/common-response.entity';

@ApiTags('SmartRotom | Apps')
@Controller('/smartrotom/apps')
@UseInterceptors(ResponseInterceptor)
export class AppsController {
  constructor(
    private readonly appsFacadeService: AppsFacadeService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all apps' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Apps found successfully.',
    type: [App]
  })
  async findAll(): Promise<App[]> {
    return this.appsFacadeService.getApps();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new app' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'App created successfully.',
    type: App
  })
  @ApiBody({ type: CreateAppDto })
  async create(@Body() createAppDto: CreateAppDto): Promise<App> {
    return this.appsFacadeService.createApp(createAppDto);
  }

  @Post('order')
  @ApiOperation({ summary: 'Order the apps' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Apps ordered successfully.',
    type: SuccessResponse
  })
  @ApiBody({ type: OrderAppDto })
  async order(@Body() orderDto: OrderAppDto): Promise<SuccessResponse> {
    const result = await this.appsFacadeService.orderApps(orderDto.order, orderDto.uuid);
    return {
      success: result.success,
      message: 'Apps ordered successfully'
    };
  }

  @Post('player')
  @ApiOperation({ summary: 'Get apps for a player' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Apps found for player successfully.',
    type: [App]
  })
  @ApiBody({ type: GetPlayerAppsDto })
  async getForPlayer(@Body() { uuid }: GetPlayerAppsDto): Promise<App[]> {
    return this.appsFacadeService.getAppsForPlayer(uuid);
  }

  @Post('player/add')
  @ApiOperation({ summary: 'Add an app to a player' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'App added to player successfully.',
    type: SuccessResponse
  })
  @ApiBody({ type: PlayerAppDto })
  async addAppToPlayer(@Body() { uuid, id }: PlayerAppDto): Promise<SuccessResponse> {
    return this.appsFacadeService.addAppToPlayer(uuid, id);
  }

  @Post('player/remove')
  @ApiOperation({ summary: 'Remove an app from a player' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'App removed from player successfully.',
    type: SuccessResponse
  })
  @ApiBody({ type: PlayerAppDto })
  async removeAppFromPlayer(@Body() { uuid, id }: PlayerAppDto): Promise<SuccessResponse> {
    return this.appsFacadeService.removeAppFromPlayer(uuid, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an app by ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'App found successfully.',
    type: App
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'App not found.'
  })
  async findOne(@Param('id') id: number): Promise<App> {
    return this.appsFacadeService.getApp(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an app by ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'App updated successfully.',
    type: App
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'App not found.'
  })
  @ApiBody({ type: UpdateAppDto })
  async update(@Param('id') id: number, @Body() updateAppDto: UpdateAppDto): Promise<App> {
    return this.appsFacadeService.updateApp(id, updateAppDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an app by ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'App deleted successfully.',
    type: SuccessResponse
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'App not found.'
  })
  async remove(@Param('id') id: number): Promise<SuccessResponse> {
    return this.appsFacadeService.deleteApp(id);
  }
}