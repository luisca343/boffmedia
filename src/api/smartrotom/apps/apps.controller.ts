import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  HttpStatus, 
  UseInterceptors, 
  ParseIntPipe 
} from '@nestjs/common';
import { 
  ApiBody, 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiQuery,
  ApiParam 
} from '@nestjs/swagger';
import { AppsFacadeService } from './apps.facade.service';
import { 
  UpdateAppDto, 
  CreateAppDto, 
  OrderAppDto, 
  PlayerAppDto, 
  GetPlayerAppsDto 
} from './dto';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { SmartRotomApp, SmartRotomUserApp } from './entities';

@ApiTags('SmartRotom | Apps')
@Controller('/smartrotom/apps')
@UseInterceptors(ResponseInterceptor)
export class AppsController {
  constructor(
    private readonly appsFacadeService: AppsFacadeService,
  ) {}

  // ==================== APP MANAGEMENT ====================
  @Get()
  @ApiOperation({ summary: 'Get all apps' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Apps retrieved successfully',
    type: [SmartRotomApp]
  })
  async findAll(): Promise<SmartRotomApp[]> {
    return this.appsFacadeService.getApps();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active apps' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Active apps retrieved successfully',
    type: [SmartRotomApp]
  })
  async getActiveApps(): Promise<SmartRotomApp[]> {
    return this.appsFacadeService.getActiveApps();
  }

  @Get('inactive')
  @ApiOperation({ summary: 'Get all inactive apps' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Inactive apps retrieved successfully',
    type: [SmartRotomApp]
  })
  async getInactiveApps(): Promise<SmartRotomApp[]> {
    return this.appsFacadeService.getInactiveApps();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search apps by name or URL' })
  @ApiQuery({ name: 'q', description: 'Search term', required: true })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Apps found successfully',
    type: [SmartRotomApp]
  })
  async searchApps(@Query('q') searchTerm: string): Promise<SmartRotomApp[]> {
    return this.appsFacadeService.searchApps(searchTerm);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get app usage statistics' })
  @ApiQuery({ name: 'appId', description: 'Specific app ID (optional)', required: false })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'App statistics retrieved successfully'
  })
  async getAppStatistics(@Query('appId') appId?: number): Promise<any[]> {
    return this.appsFacadeService.getAppUsageStatistics(appId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new app' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'App created successfully',
    type: SmartRotomApp
  })
  @ApiBody({ type: CreateAppDto })
  async create(@Body() createAppDto: CreateAppDto): Promise<SmartRotomApp> {
    return this.appsFacadeService.createApp(createAppDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an app by ID' })
  @ApiParam({ name: 'id', description: 'App ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'App retrieved successfully',
    type: SmartRotomApp
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'App not found'
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<SmartRotomApp> {
    return this.appsFacadeService.getApp(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an app by ID' })
  @ApiParam({ name: 'id', description: 'App ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'App updated successfully',
    type: SmartRotomApp
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'App not found'
  })
  @ApiBody({ type: UpdateAppDto })
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateAppDto: UpdateAppDto
  ): Promise<SmartRotomApp> {
    return this.appsFacadeService.updateApp(id, updateAppDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an app by ID' })
  @ApiParam({ name: 'id', description: 'App ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'App deleted successfully'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'App not found'
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.appsFacadeService.deleteApp(id);
  }

  // ==================== APP STATUS MANAGEMENT ====================
  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate an app' })
  @ApiParam({ name: 'id', description: 'App ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'App activated successfully',
    type: SmartRotomApp
  })
  async activateApp(@Param('id', ParseIntPipe) id: number): Promise<SmartRotomApp> {
    return this.appsFacadeService.activateApp(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate an app' })
  @ApiParam({ name: 'id', description: 'App ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'App deactivated successfully',
    type: SmartRotomApp
  })
  async deactivateApp(@Param('id', ParseIntPipe) id: number): Promise<SmartRotomApp> {
    return this.appsFacadeService.deactivateApp(id);
  }

  // ==================== PLAYER APP MANAGEMENT ====================
  @Post('player/apps')
  @ApiOperation({ summary: 'Get apps for a player' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Player apps retrieved successfully',
    type: [SmartRotomUserApp]
  })
  @ApiBody({ type: GetPlayerAppsDto })
  async getPlayerApps(@Body() { uuid }: GetPlayerAppsDto): Promise<SmartRotomUserApp[]> {
    console.log('Fetching apps for player:', uuid);
    return this.appsFacadeService.getAppsForPlayer(uuid);
  }

  @Get('player/:uuid/available')
  @ApiOperation({ summary: 'Get available apps for a player' })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Available apps retrieved successfully',
    type: [SmartRotomUserApp]
  })
  async getAvailableAppsForPlayer(@Param('uuid') uuid: string): Promise<SmartRotomUserApp[]> {
    return this.appsFacadeService.getAvailableAppsForPlayer(uuid);
  }

  @Get('player/:uuid/count')
  @ApiOperation({ summary: 'Get player app count' })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Player app count retrieved successfully'
  })
  async getPlayerAppCount(@Param('uuid') uuid: string) {
    return this.appsFacadeService.getPlayerAppCount(uuid);
  }

  @Get('player/:uuid/search')
  @ApiOperation({ summary: 'Search player apps' })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  @ApiQuery({ name: 'q', description: 'Search term', required: true })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Player apps found successfully',
    type: [SmartRotomUserApp]
  })
  async searchPlayerApps(
    @Param('uuid') uuid: string,
    @Query('q') searchTerm: string
  ): Promise<SmartRotomUserApp[]> {
    return this.appsFacadeService.searchUserApps(uuid, searchTerm);
  }

  @Post('player/add')
  @ApiOperation({ summary: 'Add an app to a player' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'App added to player successfully'
  })
  @ApiBody({ type: PlayerAppDto })
  async addAppToPlayer(@Body() { uuid, id }: PlayerAppDto) {
    return this.appsFacadeService.addAppToPlayer(uuid, id);
  }

  @Post('player/remove')
  @ApiOperation({ summary: 'Remove an app from a player' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'App removed from player successfully'
  })
  @ApiBody({ type: PlayerAppDto })
  async removeAppFromPlayer(@Body() { uuid, id }: PlayerAppDto) {
    return this.appsFacadeService.removeAppFromPlayer(uuid, id);
  }

  @Post('player/order')
  @ApiOperation({ summary: 'Order player apps' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Apps ordered successfully'
  })
  @ApiBody({ type: OrderAppDto })
  async orderPlayerApps(@Body() orderDto: OrderAppDto) {
    return this.appsFacadeService.orderApps(orderDto.order, orderDto.uuid);
  }

  @Post('player/:uuid/reset-order')
  @ApiOperation({ summary: 'Reset player app order' })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Player app order reset successfully'
  })
  async resetPlayerAppOrder(@Param('uuid') uuid: string) {
    return this.appsFacadeService.resetPlayerAppOrder(uuid);
  }
  
  // ==================== SYNC OPERATIONS ====================
  @Post('player/:uuid/sync')
  @ApiOperation({ summary: 'Sync player apps with active apps' })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Player apps synced successfully'
  })
  async syncPlayerApps(@Param('uuid') uuid: string) {
    return this.appsFacadeService.syncUserAppsWithActive(uuid);
  }

  @Post('player/:uuid/cleanup')
  @ApiOperation({ summary: 'Remove inactive apps from player' })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Inactive apps removed successfully'
  })
  async cleanupPlayerApps(@Param('uuid') uuid: string) {
    return this.appsFacadeService.removeInactiveAppsFromUser(uuid);
  }

  @Post('sync-all-users')
  @ApiOperation({ summary: 'Sync all users with active apps' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'All users synced successfully'
  })
  async syncAllUsers() {
    return this.appsFacadeService.syncAllUsersWithActiveApps();
  }

  // ==================== BULK OPERATIONS ====================
  @Post('player/bulk-add')
  @ApiOperation({ summary: 'Bulk add apps to a player' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Apps added to player successfully'
  })
  async bulkAddAppsToPlayer(
    @Body() { uuid, appIds }: { uuid: string; appIds: number[] }
  ) {
    return this.appsFacadeService.bulkAddAppsToPlayer(uuid, appIds);
  }

  @Post('player/bulk-remove')
  @ApiOperation({ summary: 'Bulk remove apps from a player' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Apps removed from player successfully'
  })
  async bulkRemoveAppsFromPlayer(
    @Body() { uuid, appIds }: { uuid: string; appIds: number[] }
  ) {
    return this.appsFacadeService.bulkRemoveAppsFromPlayer(uuid, appIds);
  }

  // ==================== ADMIN OPERATIONS ====================
  @Post('batch/status')
  @ApiOperation({ summary: 'Batch update app status' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'App statuses updated successfully'
  })
  async batchUpdateAppStatus(
    @Body() { appIds, status }: { appIds: number[]; status: number }
  ) {
    return this.appsFacadeService.batchUpdateAppStatus(appIds, status);
  }

  @Post('batch/delete')
  @ApiOperation({ summary: 'Batch delete apps' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Apps deleted successfully'
  })
  async batchDeleteApps(@Body() { appIds }: { appIds: number[] }) {
    return this.appsFacadeService.batchDeleteApps(appIds);
  }
}