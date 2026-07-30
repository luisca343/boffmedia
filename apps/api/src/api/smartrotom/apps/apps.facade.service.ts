import { Injectable } from '@nestjs/common';
import { AppsService } from './services/apps.service';
import { UserAppsService } from './services/user-apps.service';
import { RotomApp } from '@/_db/schema/SmartRotom';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';

@Injectable()
export class AppsFacadeService {
  constructor(
    private readonly appsService: AppsService,
    private readonly userAppsService: UserAppsService,
  ) {}

  // ==================== APP MANAGEMENT ====================
  async getApps(): Promise<RotomApp[]> {
    return this.appsService.getAllApps();
  }

  async getActiveApps(): Promise<RotomApp[]> {
    return this.appsService.getActiveApps();
  }

  async getInactiveApps(): Promise<RotomApp[]> {
    return this.appsService.getInactiveApps();
  }

  async getApp(id: number): Promise<RotomApp> {
    return this.appsService.getAppById(id);
  }

  async createApp(createAppDto: CreateAppDto): Promise<RotomApp> {
    return this.appsService.createApp(createAppDto);
  }

  async updateApp(id: number, updateAppDto: UpdateAppDto): Promise<RotomApp> {
    return this.appsService.updateApp(id, updateAppDto);
  }

  async deleteApp(id: number): Promise<{ success: boolean }> {
    return this.appsService.deleteApp(id);
  }

  // ==================== APP STATUS MANAGEMENT ====================

  async activateApp(id: number): Promise<RotomApp> {
    return this.appsService.activateApp(id);
  }

  async deactivateApp(id: number): Promise<RotomApp> {
    return this.appsService.deactivateApp(id);
  }

  // ==================== USER APP MANAGEMENT ====================
  async getAppsForPlayer(uuid: string): Promise<RotomApp[]> {
    return this.userAppsService.getAppsForPlayer(uuid);
  }

  async addAppToPlayer(
    uuid: string,
    appId: number,
  ): Promise<{ success: boolean }> {
    return this.userAppsService.addAppToPlayer(uuid, appId);
  }

  async removeAppFromPlayer(
    uuid: string,
    appId: number,
  ): Promise<{ success: boolean }> {
    return this.userAppsService.removeAppFromPlayer(uuid, appId);
  }

  async orderApps(
    order: { id: number | string; order: number }[],
    uuid: string,
  ): Promise<{ success: boolean }> {
    return this.userAppsService.orderAppsForPlayer(order, uuid);
  }
}
