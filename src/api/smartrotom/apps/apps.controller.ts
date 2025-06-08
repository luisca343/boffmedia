import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, UseInterceptors } from '@nestjs/common';
import { AppsService } from './apps.service';
import { UpdateAppDto } from './dto/update-app.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateAppDto } from './dto/create-app.dto';
import { OrderAppDto } from './dto/order-apps.dto';
import { PlayerAppDto } from './dto/player-app-dto';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';

@ApiTags('smartrotom/apps')
@Controller('/smartrotom/apps')
@UseInterceptors(ResponseInterceptor)
export class AppsController {
  constructor(
    private appsService: AppsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all apps' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Apps found successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to find apps.' })
  async findAll() {
    return await this.appsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new app' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'App created successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to create app.' })
  @ApiBody({ type: CreateAppDto })
  async create(@Body() createAppDto: CreateAppDto) {
    return await this.appsService.create(createAppDto);
  }

  @Post('order')
  @ApiOperation({ summary: 'Order the apps' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Apps ordered successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to order apps.' })
  async order(@Body() order: OrderAppDto) {
    return await this.appsService.order(order.newOrder, order.uuid);
  }

  @Post('player')
  @ApiOperation({ summary: 'Get apps for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Apps found for player successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to get apps for player.' })
  async getForPlayer(@Body() { uuid }: { uuid: string }) {
    return await this.appsService.getForPlayer(uuid);
  }

  @Post('player/add')
  @ApiOperation({ summary: 'Add an app to a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'App added to player successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid uuid or appId.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'App not found or not active.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'App already added to player.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to add app to player.' })
  @ApiBody({ type: PlayerAppDto })
  async addAppToPlayer(@Body() { uuid, appId }: { uuid: string, appId: number }) {
    return await this.appsService.addAppToPlayer(uuid, appId);
  }

  @Post('player/remove')
  @ApiOperation({ summary: 'Remove an app from a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'App removed from player successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid uuid or appId.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'App not found in player\'s list.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to remove app from player.' })
  @ApiBody({ type: PlayerAppDto })
  async removeAppFromPlayer(@Body() { uuid, appId }: { uuid: string, appId: number }) {
    return await this.appsService.removeAppFromPlayer(uuid, appId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an app by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'App found successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'App not found.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to find app.' })
  async findOne(@Param('id') id: number) {
    return await this.appsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an app by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'App updated successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'App not found.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to update app.' })
  async update(@Param('id') id: number, @Body() updateAppDto: UpdateAppDto) {
    return await this.appsService.update(id, updateAppDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an app by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'App deleted successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'App not found.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to delete app.' })
  async remove(@Param('id') id: number) {
    return await this.appsService.remove(id);
  }
}