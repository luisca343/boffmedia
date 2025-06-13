import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { AppsRepository } from '@api/_repositories/smartrotom/apps.repository';
import { SmartRotomApp } from '@/_db/schema/SmartRotom';

@Injectable()
export class UserAppsService {
  constructor(
    private readonly appsRepository: AppsRepository,
  ) {}

  async getAppsForPlayer(uuid: string): Promise<SmartRotomApp[]> {
    if (!uuid) {
      return [];
    }
    return this.appsRepository.getAppsForPlayer(uuid);
  }

  async addAppToPlayer(uuid: string, appId: number): Promise<{ success: boolean }> {
    if (!uuid || !appId) {
      throw new BadRequestException('Invalid uuid or appId');
    }

    // Check if the app exists and is active
    const app = await this.appsRepository.findActiveApp(appId);
    if (!app) {
      throw new NotFoundException('App not found or already active');
    }

    // Check if the app is already in the player's list
    const existingUserApp = await this.appsRepository.findUserApp(uuid, appId);
    if (existingUserApp) {
      throw new ConflictException('App already added to player');
    }

    // Add the app to the player
    await this.appsRepository.addUserApp({
      uuid,
      appId,
      order: 999,
    });

    return { success: true };
  }

  async removeAppFromPlayer(uuid: string, appId: number): Promise<{ success: boolean }> {
    if (!uuid || !appId) {
      throw new BadRequestException('Invalid uuid or appId');
    }

    const result = await this.appsRepository.removeUserApp(uuid, appId);
    if (result.affectedRows === 0) {
      throw new NotFoundException("App not found in player's list");
    }

    return { success: true };
  }

  async orderAppsForPlayer(
    order: { id: number | string; order: number }[], 
    uuid: string
  ): Promise<{ success: boolean }> {
    if (!uuid || !order?.length) {
      throw new BadRequestException('Invalid uuid or order data');
    }

    // Get existing apps for the player
    const existingApps = await this.appsRepository.findUserApps(uuid);
    const existingAppIds = new Set(existingApps.map(app => app.appId));

    // Filter out any apps that are not in the existing set
    const validOrder = order.filter(app => existingAppIds.has(Number(app.id)));

    // Update the order of existing apps
    for (const app of validOrder) {
      await this.appsRepository.updateUserAppOrder(
        uuid, 
        Number(app.id), 
        app.order
      );
    }

    // Reset order for apps not in the valid order list
    const validAppIds = validOrder.map(app => Number(app.id));
    await this.appsRepository.resetUserAppOrder(uuid, validAppIds);

    return { success: true };
  }
}