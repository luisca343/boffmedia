import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject } from '@nestjs/common';
import { SmartRotomApp } from '@/_db/schema/SmartRotom';
import { IUserAppsRepository } from '../repositories/interfaces/user-apps-repository.interface';
import { IAppsRepository } from '../repositories/interfaces/apps-repository.interface';
import { APPS_REPOSITORY_TOKEN, USER_APPS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { AppStatus } from '../enums/app-status.enum';

@Injectable()
export class UserAppsService {
  constructor(
    @Inject(USER_APPS_REPOSITORY_TOKEN)
    private readonly userAppsRepository: IUserAppsRepository,
    @Inject(APPS_REPOSITORY_TOKEN)
    private readonly appsRepository: IAppsRepository,
  ) {}

  // ==================== PLAYER APP MANAGEMENT ====================

  async getAppsForPlayer(uuid: string): Promise<SmartRotomApp[]> {
    this.validateUuid(uuid);
    return this.userAppsRepository.getAppsForPlayer(uuid);
  }

  async addAppToPlayer(uuid: string, appId: number): Promise<{ success: boolean }> {
    this.validateUuid(uuid);
    this.validateAppId(appId);

    const app = await this.appsRepository.findById(appId);
    if (!app) {
      throw new NotFoundException('App not found');
    }

    if (app.active == AppStatus.INACTIVE) {
      throw new BadRequestException('App is inactive');
    }

    const existingUserApp = await this.userAppsRepository.findUserApp(uuid, appId);
    if (existingUserApp) {
      throw new ConflictException('App already added to player');
    }

    await this.userAppsRepository.addUserApp(uuid, appId);
    
    return { success: true };
  }

  async removeAppFromPlayer(uuid: string, appId: number): Promise<{ success: boolean }> {
    this.validateUuid(uuid);
    this.validateAppId(appId);

    const removed = await this.userAppsRepository.removeUserApp(uuid, appId);
    if (!removed) {
      throw new NotFoundException("App not found in player's list");
    }

    return { success: true };
  }

  // ==================== APP ORDERING ====================

  async orderAppsForPlayer(
    order: { id: number | string; order: number }[], 
    uuid: string
  ): Promise<{ success: boolean }> {
    this.validateUuid(uuid);
    
    if (!order?.length) {
      throw new BadRequestException('Order data is required');
    }

    // Get existing apps for the player
    const existingApps = await this.userAppsRepository.findByPlayerUuid(uuid);
    const existingAppIds = new Set(existingApps.map(app => app.appId));

    // Filter out any apps that are not in the existing set
    const validOrder = order.filter(app => existingAppIds.has(Number(app.id)));

    // Update the order of existing apps
    for (const app of validOrder) {
      await this.userAppsRepository.updateOrder(uuid, Number(app.id), app.order);
    }

    // Reset order for apps not in the valid order list
    const validAppIds = validOrder.map(app => Number(app.id));
    const appsToReset = Array.from(existingAppIds).filter(id => !validAppIds.includes(id));
    
    if (appsToReset.length > 0) {
      await this.userAppsRepository.resetOrderExcept(uuid, appsToReset);
    }

    return { success: true };
  }

  // ==================== VALIDATION HELPERS ====================

  private validateUuid(uuid: string): void {
    if (!uuid) {
      throw new BadRequestException('UUID is required');
    }
  }

  private validateAppId(appId: number): void {
    if (!appId || appId <= 0) {
      throw new BadRequestException('Valid App ID is required');
    }
  }
}