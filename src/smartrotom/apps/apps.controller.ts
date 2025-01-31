import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { AppsService } from './apps.service';
import { UpdateAppDto } from './dto/update-app.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateAppDto } from './dto/create-app.dto';
import { ResponseService } from '@/response/response.service';
import { OrderAppDto } from './dto/order-apps.dto';
import { PlayerAppDto } from './dto/player-app-dto';

@ApiTags('smartrotom/apps')
@Controller('/smartrotom/apps')
export class AppsController {
  private readonly logger = new Logger(AppsController.name);
  constructor(
    private appsService: AppsService,
    private readonly responseService: ResponseService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all apps' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Apps found successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to find apps.' })
  async findAll() {
    const action = 'find all apps';
    try {
      this.responseService.logRequest(action, null);
      const apps = await this.appsService.findAll();
      this.responseService.logSuccess(action, apps);
      return this.responseService.createSuccessResponse('Apps found successfully', apps);
    } catch (error) {
      this.responseService.handleError(action, error);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new app' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'App created successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to create app.' })
  @ApiBody({ type: CreateAppDto })
  async create(@Body() createAppDto: CreateAppDto) {
    const action = 'create a new app';
    try {
      this.responseService.logRequest(action, createAppDto);
      const app = await this.appsService.create(createAppDto);
      this.responseService.logSuccess(action, app);
      return this.responseService.createSuccessResponse('App created successfully', app);
    } catch (error) {
      this.responseService.handleError(action, error);
    }
  }

  @ApiOperation({ summary: 'Order the apps' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Apps ordered successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to order apps.' })
  @Post('order')
  async order(@Body() order: OrderAppDto) {
    const action = 'order apps';
    try {
      this.responseService.logRequest(action, order);
      const apps = await this.appsService.order(order.newOrder, order.uuid);
      this.responseService.logSuccess(action, apps);
      return this.responseService.createSuccessResponse('Apps ordered successfully', apps);
    } catch (error) {
      this.responseService.handleError(action, error);
    }
  }

  @Post('player')
  @ApiOperation({ summary: 'Get apps for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Apps found for player successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to get apps for player.' })
  async getForPlayer(@Body() { uuid }: { uuid: string }) {
    const action = 'get apps for player';
    try {
      this.responseService.logRequest(action, { uuid });
      const apps = await this.appsService.getForPlayer(uuid);
      this.responseService.logSuccess(action, apps);
      return this.responseService.createSuccessResponse('Apps found for player successfully', apps);
    } catch (error) {
      this.responseService.handleError(action, error);
    }
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
    const action = 'add app to player';
    try {
      this.responseService.logRequest(action, { uuid, appId });
      const result = await this.appsService.addAppToPlayer(uuid, appId);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('App added to player successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error);
    }
  }

  @Post('player/remove')
  @ApiOperation({ summary: 'Remove an app from a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'App removed from player successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid uuid or appId.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'App not found in player\'s list.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to remove app from player.' })
  @ApiBody({ type: PlayerAppDto })
  async removeAppFromPlayer(@Body() { uuid, appId }: { uuid: string, appId: number }) {
    const action = 'remove app from player';
    try {
      this.responseService.logRequest(action, { uuid, appId });
      const result = await this.appsService.removeAppFromPlayer(uuid, appId);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('App removed from player successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an app by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'App found successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'App not found.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to find app.' })
  async findOne(@Param('id') id: number) {
    const action = 'find one app';
    try {
      this.responseService.logRequest(action, { id });
      const app = await this.appsService.findOne(id);
      if (!app) {
        throw new HttpException('App not found', HttpStatus.NOT_FOUND);
      }
      this.responseService.logSuccess(action, app);
      return this.responseService.createSuccessResponse('App found successfully', app);
    } catch (error) {
      this.responseService.handleError(action, error);
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an app by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'App updated successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'App not found.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to update app.' })
  async update(@Param('id') id: number, @Body() updateAppDto: UpdateAppDto) {
    const action = 'update app';
    try {
      this.responseService.logRequest(action, { id, updateAppDto });
      const app = await this.appsService.update(id, updateAppDto);
      if (!app) {
        throw new HttpException('App not found', HttpStatus.NOT_FOUND);
      }
      this.responseService.logSuccess(action, app);
      return this.responseService.createSuccessResponse('App updated successfully', app);
    } catch (error) {
      this.responseService.handleError(action, error);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an app by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'App deleted successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'App not found.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to delete app.' })
  async remove(@Param('id') id: number) {
    const action = 'remove app';
    try {
      this.responseService.logRequest(action, { id });
      const result = await this.appsService.remove(id);
      if (!result) {
        throw new HttpException('App not found', HttpStatus.NOT_FOUND);
      }
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('App deleted successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error);
    }
  }
}