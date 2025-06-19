import { Injectable, Inject } from '@nestjs/common';
import { IAppsRepository } from '../repositories/apps.repository.interface';
import { IUserAppsRepository } from '../repositories/user-apps.repository.interface';
import { IUserAppsSyncRepository } from '../repositories/user-apps-sync.repository.interface';
import { IAppsAnalyticsRepository } from '../repositories/apps-analytics.repository.interface';
import { CreateAppDto, UpdateAppDto } from '../dto';
import { 
  EntityNotFoundException, 
  BusinessRuleViolationException,
  DuplicateEntityException 
} from '@/api/_shared/exceptions';
import { ErrorCodes, AppStatus } from '@/api/_shared/constants/app.constants';
import { SmartRotomApp } from '../entities';

@Injectable()
export class AppsService {
  constructor(
    @Inject('IAppsRepository') private readonly appsRepository: IAppsRepository,
    @Inject('IUserAppsRepository') private readonly userAppsRepository: IUserAppsRepository,
    @Inject('IUserAppsSyncRepository') private readonly userAppsSyncRepository: IUserAppsSyncRepository,
    @Inject('IAppsAnalyticsRepository') private readonly appsAnalyticsRepository: IAppsAnalyticsRepository,
  ) {}

  // ==================== PUBLIC METHODS ====================
  async getAllApps(): Promise<SmartRotomApp[]> {
    const apps = await this.appsRepository.findAll();
    return SmartRotomApp.fromEntities(apps);
  }

  async getAppById(id: number): Promise<SmartRotomApp> {
    const app = await this.appsRepository.findByIdOrThrow(id, 'App');
    return SmartRotomApp.fromEntity(app);
  }

  async createApp(createAppDto: CreateAppDto): Promise<SmartRotomApp> {
    // Validate URL uniqueness if provided
    if (createAppDto.url) {
      await this.validateUrlIsUnique(createAppDto.url);
    }

    const result = await this.appsRepository.create({
      ...createAppDto,
      active: AppStatus.ACTIVE, // Default to active
    });
    
    return this.getAppById(result.insertId);
  }

  async updateApp(id: number, updateAppDto: UpdateAppDto): Promise<SmartRotomApp> {
    // Validate app exists
    await this.appsRepository.findByIdOrThrow(id, 'App');
    
    // Validate URL uniqueness if being updated
    if (updateAppDto.url) {
      await this.validateUrlIsUnique(updateAppDto.url, id);
    }
    
    // Update
    await this.appsRepository.update(id, updateAppDto);
    
    // Return updated entity
    return this.getAppById(id);
  }

  async deleteApp(id: number): Promise<{ deleted: boolean; appId: number }> {
    // Validate existence
    await this.appsRepository.findByIdOrThrow(id, 'App');
    
    // Check if app has users (business rule)
    const users = await this.userAppsRepository.getUsersWithApp(id);
    
    if (users.length > 0) {
      throw new BusinessRuleViolationException(
        'Cannot delete app that has users',
        ErrorCodes.APP_HAS_USERS,
        { appId: id, userCount: users.length }
      );
    }
    
    // Delete
    const result = await this.appsRepository.delete(id);
    
    return { 
      deleted: result.affectedRows > 0, 
      appId: id 
    };
  }

  // ==================== VALIDATION METHODS ====================
  async validateAppExists(appId: number): Promise<void> {
    const exists = await this.appsRepository.exists(appId);
    if (!exists) {
      throw new EntityNotFoundException('App', appId);
    }
  }

  async validateAppIsActive(appId: number): Promise<void> {
    const isActive = await this.appsRepository.validateAppIsActive(appId);
    
    if (!isActive) {
      throw new BusinessRuleViolationException(
        'App is not active',
        ErrorCodes.APP_INACTIVE,
        { appId }
      );
    }
  }

  async validateUrlIsUnique(url: string, excludeId?: number): Promise<void> {
    const isUnique = await this.appsRepository.validateUrlUniqueness(url, excludeId);
    
    if (!isUnique) {
      const existingApp = await this.appsRepository.findByUrl(url);
      throw new DuplicateEntityException(
        'App URL',
        url,
        { url, existingAppId: existingApp?.id }
      );
    }
  }

  // ==================== HELPER METHODS ====================
  async getActiveApps(): Promise<SmartRotomApp[]> {
    const apps = await this.appsRepository.findByStatus(AppStatus.ACTIVE);
    return SmartRotomApp.fromEntities(apps);
  }

  async getInactiveApps(): Promise<SmartRotomApp[]> {
    const apps = await this.appsRepository.findByStatus(AppStatus.INACTIVE);
    return SmartRotomApp.fromEntities(apps);
  }

  async activateApp(id: number): Promise<SmartRotomApp> {
    await this.validateAppExists(id);
    await this.appsRepository.update(id, { active: AppStatus.ACTIVE });
    await this.userAppsSyncRepository.syncAllUsersWithActiveApps();
    return this.getAppById(id);
  }

  async deactivateApp(id: number): Promise<SmartRotomApp> {
    await this.validateAppExists(id);
    await this.appsRepository.update(id, { active: AppStatus.INACTIVE });
    await this.userAppsRepository.removeInactiveAppFromAllUsers(id);
    return this.getAppById(id);
  }

  async searchApps(searchTerm: string): Promise<SmartRotomApp[]> {
    const apps = await this.appsRepository.searchApps(searchTerm);
    return SmartRotomApp.fromEntities(apps);
  }

  async getAppUsageStatistics(appId?: number): Promise<any[]> {
    return this.appsAnalyticsRepository.getAppUsageStatistics(appId);
  }

  async getMostPopularApps(limit: number = 10): Promise<any[]> {
    return this.appsAnalyticsRepository.getMostPopularApps(limit);
  }

  async getAppsWithUserCounts(): Promise<any[]> {
    return this.appsAnalyticsRepository.getAppsWithUserCounts();
  }

  async getAppsWithoutUsers(): Promise<SmartRotomApp[]> {
    const apps = await this.appsAnalyticsRepository.getAppsWithoutUsers();
    return SmartRotomApp.fromEntities(apps);
  }

  async batchUpdateAppStatus(appIds: number[], status: AppStatus): Promise<{ updatedCount: number }> {
    if (appIds.length === 0) {
      return { updatedCount: 0 };
    }

    // Validate all apps exist
    for (const appId of appIds) {
      await this.validateAppExists(appId);
    }

    const result = await this.appsRepository.batchUpdateAppStatus(appIds, status);
    
    if (status === AppStatus.ACTIVE) {
      await this.userAppsSyncRepository.syncAllUsersWithActiveApps();
    } else {
      await this.userAppsRepository.removeAppsFromAllUsers(appIds);
    }

    return result;
  }

  async batchDeleteApps(appIds: number[]): Promise<{ deletedCount: number }> {
    // Validate all apps exist and have no users
    for (const appId of appIds) {
      await this.validateAppExists(appId);
      
      const users = await this.userAppsRepository.getUsersWithApp(appId);
      if (users.length > 0) {
        throw new BusinessRuleViolationException(
          `Cannot delete app ${appId} that has users`,
          ErrorCodes.APP_HAS_USERS,
          { appId, userCount: users.length }
        );
      }
    }

    return this.appsRepository.batchDeleteApps(appIds);
  }
}