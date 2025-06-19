import { Injectable } from '@nestjs/common';
import { AppsService } from './services/apps.service';
import { UserAppsService } from './services/user-apps.service';
import { CreateAppDto, UpdateAppDto } from './dto';
import { SmartRotomApp, SmartRotomUserApp } from './entities';

@Injectable()
export class AppsFacadeService {
  constructor(
    private readonly appsService: AppsService,
    private readonly userAppsService: UserAppsService,
  ) {}

  // ==================== APP MANAGEMENT ====================
  async getApps(): Promise<SmartRotomApp[]> {
    return this.appsService.getAllApps();
  }

  async getApp(id: number): Promise<SmartRotomApp> {
    return this.appsService.getAppById(id);
  }

  async createApp(createAppDto: CreateAppDto): Promise<SmartRotomApp> {
    return this.appsService.createApp(createAppDto);
  }

  async updateApp(id: number, updateAppDto: UpdateAppDto): Promise<SmartRotomApp> {
    return this.appsService.updateApp(id, updateAppDto);
  }

  async deleteApp(id: number): Promise<{ deleted: boolean; appId: number }> {
    return this.appsService.deleteApp(id);
  }

  // ==================== USER APP MANAGEMENT ====================
  async getAppsForPlayer(uuid: string): Promise<SmartRotomUserApp[]> {
    return this.userAppsService.getAppsForPlayer(uuid);
  }

  async addAppToPlayer(uuid: string, appId: number): Promise<{ added: boolean; appId: number; uuid: string }> {
    return this.userAppsService.addAppToPlayer(uuid, appId);
  }

  async removeAppFromPlayer(uuid: string, appId: number): Promise<{ removed: boolean; appId: number; uuid: string }> {
    return this.userAppsService.removeAppFromPlayer(uuid, appId);
  }

  async orderApps(
    order: { id: number | string; order: number }[], 
    uuid: string
  ): Promise<{ updated: boolean; totalApps: number; uuid: string }> {
    return this.userAppsService.orderAppsForPlayer(order, uuid);
  }
  
  // ==================== NEW SYNC METHODS ====================
  async syncUserAppsWithActive(uuid: string): Promise<{ syncedCount: number }> {
    return this.userAppsService.syncUserAppsWithActive(uuid);
  }

  async syncAllUsersWithActiveApps(): Promise<{ totalSynced: number; usersAffected: number }> {
    return this.userAppsService.syncAllUsersWithActiveApps();
  }

  async removeInactiveAppsFromUser(uuid: string): Promise<{ removedCount: number }> {
    return this.userAppsService.removeInactiveAppsFromUser(uuid);
  }

  // ==================== ADDITIONAL FEATURES ====================
  async getActiveApps(): Promise<SmartRotomApp[]> {
    return this.appsService.getActiveApps();
  }

  async getInactiveApps(): Promise<SmartRotomApp[]> {
    return this.appsService.getInactiveApps();
  }

  async searchApps(searchTerm: string): Promise<SmartRotomApp[]> {
    return this.appsService.searchApps(searchTerm);
  }

  async getAvailableAppsForPlayer(uuid: string): Promise<SmartRotomUserApp[]> {
    return this.userAppsService.getAvailableAppsForPlayer(uuid);
  }

  async getPlayerAppCount(uuid: string): Promise<{ count: number; uuid: string }> {
    return this.userAppsService.getPlayerAppCount(uuid);
  }

  async resetPlayerAppOrder(uuid: string): Promise<{ reset: boolean; uuid: string }> {
    return this.userAppsService.resetPlayerAppOrder(uuid);
  }

  async searchUserApps(uuid: string, searchTerm: string): Promise<SmartRotomUserApp[]> {
    return this.userAppsService.searchUserApps(uuid, searchTerm);
  }

  async bulkAddAppsToPlayer(uuid: string, appIds: number[]): Promise<{ addedCount: number; uuid: string }> {
    return this.userAppsService.bulkAddAppsToPlayer(uuid, appIds);
  }

  async bulkRemoveAppsFromPlayer(uuid: string, appIds: number[]): Promise<{ removedCount: number; uuid: string }> {
    return this.userAppsService.bulkRemoveAppsFromPlayer(uuid, appIds);
  }

  // ==================== ADMIN FEATURES ====================
  async getAppUsageStatistics(appId?: number): Promise<any[]> {
    return this.appsService.getAppUsageStatistics(appId);
  }

  async activateApp(id: number): Promise<SmartRotomApp> {
    return this.appsService.activateApp(id);
  }

  async deactivateApp(id: number): Promise<SmartRotomApp> {
    return this.appsService.deactivateApp(id);
  }

  async batchUpdateAppStatus(appIds: number[], status: number): Promise<{ updatedCount: number }> {
    return this.appsService.batchUpdateAppStatus(appIds, status);
  }

  async batchDeleteApps(appIds: number[]): Promise<{ deletedCount: number }> {
    return this.appsService.batchDeleteApps(appIds);
  }
}