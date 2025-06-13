import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { AppsService } from './services/apps.service';
import { UserAppsService } from './services/user-apps.service';
import { SmartRotomApp } from '@/_db/schema/SmartRotom';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';

@Injectable()
export class AppsFacadeService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
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

  async deleteApp(id: number): Promise<{ success: boolean }> {
    return this.appsService.deleteApp(id);
  }

  // ==================== USER APP MANAGEMENT ====================
  async getAppsForPlayer(uuid: string): Promise<SmartRotomApp[]> {
    return this.userAppsService.getAppsForPlayer(uuid);
  }

  async addAppToPlayer(uuid: string, appId: number): Promise<{ success: boolean }> {
    return this.userAppsService.addAppToPlayer(uuid, appId);
  }

  async removeAppFromPlayer(uuid: string, appId: number): Promise<{ success: boolean }> {
    return this.userAppsService.removeAppFromPlayer(uuid, appId);
  }

async orderApps(
  order: { id: number | string; order: number }[], 
  uuid: string
): Promise<{ success: boolean }> {
  return this.db.transaction(async (tx) => {
    return this.userAppsService.orderAppsForPlayer(order, uuid);
  });
}
}