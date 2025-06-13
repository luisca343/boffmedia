import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, UseInterceptors, ParseIntPipe } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppsFacadeService } from './apps.facade.service';
import { UpdateAppDto } from './dto/update-app.dto';
import { CreateAppDto } from './dto/create-app.dto';
import { OrderAppDto } from './dto/order-apps.dto';
import { PlayerAppDto, PlayerAppsDto } from './dto/player-app.dto';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { AppsExamples } from './examples/apps.examples';
import {
  AppResponse,
  PlayerAppResponse
} from './types/app.types';
import { SuccessResponse } from '@/types/request';

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
    example: AppsExamples.responses.findAll
  })
  async findAll(): Promise<AppResponse[]> {
    return this.appsFacadeService.getApps();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new app' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'App created successfully.',
    example: AppsExamples.responses.create
  })
  @ApiBody({ 
    type: CreateAppDto,
    examples: {
      createApp: {
        summary: 'Create a new app',
        value: AppsExamples.requests.createApp
      }
    }
  })
  async create(@Body() createAppDto: CreateAppDto): Promise<AppResponse> {
    return this.appsFacadeService.createApp(createAppDto);
  }

  @Post('order')
  @ApiOperation({ summary: 'Order the apps' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Apps ordered successfully.',
    example: AppsExamples.responses.order
  })
  @ApiBody({ 
    type: OrderAppDto,
    examples: {
      orderApps: {
        summary: 'Order apps for a player',
        value: AppsExamples.requests.orderApps
      }
    }
  })
  async order(@Body() order: OrderAppDto): Promise<SuccessResponse> {
    return this.appsFacadeService.orderApps(order.newOrder, order.uuid);
  }

  @Post('player')
  @ApiOperation({ summary: 'Get apps for a player' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Apps found for player successfully.',
    example: AppsExamples.responses.getForPlayer
  })
  @ApiBody({ 
    type: PlayerAppsDto,
    examples: {
      getPlayerApps: {
        summary: 'Get apps for a specific player',
        value: AppsExamples.requests.getPlayerApps
      }
    }
  })
  async getForPlayer(@Body() { uuid }: PlayerAppsDto): Promise<PlayerAppResponse[]> {
    return this.appsFacadeService.getAppsForPlayer(uuid);
  }

  @Post('player/add')
  @ApiOperation({ summary: 'Add an app to a player' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'App added to player successfully.',
    example: AppsExamples.responses.addAppToPlayer
  })
  @ApiBody({ 
    type: PlayerAppDto,
    examples: {
      addApp: {
        summary: 'Add app to player',
        value: AppsExamples.requests.addAppToPlayer
      }
    }
  })
  async addAppToPlayer(@Body() { uuid, id }: PlayerAppDto): Promise<SuccessResponse> {
    return this.appsFacadeService.addAppToPlayer(uuid, id);
  }

  @Post('player/remove')
  @ApiOperation({ summary: 'Remove an app from a player' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'App removed from player successfully.',
    example: AppsExamples.responses.removeAppFromPlayer
  })
  @ApiBody({ 
    type: PlayerAppDto,
    examples: {
      removeApp: {
        summary: 'Remove app from player',
        value: AppsExamples.requests.removeAppFromPlayer
      }
    }
  })
  async removeAppFromPlayer(@Body() { uuid, id }: PlayerAppDto): Promise<SuccessResponse> {
    return this.appsFacadeService.removeAppFromPlayer(uuid, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an app by ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'App found successfully.',
    example: AppsExamples.responses.findOne
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'App not found.',
    example: AppsExamples.responses.notFound
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<AppResponse> {
    return this.appsFacadeService.getApp(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an app by ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'App updated successfully.',
    example: AppsExamples.responses.update
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'App not found.',
    example: AppsExamples.responses.notFound
  })
  @ApiBody({
    type: UpdateAppDto,
    examples: {
      updateApp: {
        summary: 'Update app details',
        value: AppsExamples.requests.updateApp
      }
    }
  })
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateAppDto: UpdateAppDto
  ): Promise<AppResponse> {
    return this.appsFacadeService.updateApp(id, updateAppDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an app by ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'App deleted successfully.',
    example: AppsExamples.responses.remove
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'App not found.',
    example: AppsExamples.responses.notFound
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<SuccessResponse> {
    return this.appsFacadeService.deleteApp(id);
  }
}