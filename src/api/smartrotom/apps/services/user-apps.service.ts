import { Injectable, Inject } from '@nestjs/common';
import { IAppsRepository } from '../repositories/apps.repository.interface';
import { 
  EntityNotFoundException, 
  BusinessRuleViolationException,
  ValidationException 
} from '@/api/_shared/exceptions';
import { 
  ErrorCodes, 
  DefaultValues, 
  ValidationRules,
  AppStatus 
} from '@/api/_shared/constants/app.constants';
import { SmartRotomUserApp } from '../entities';

@Injectable()
export class UserAppsService {
  constructor(
    @Inject('IAppsRepository') private readonly appsRepository: IAppsRepository,
  ) {}

  // ==================== PUBLIC METHODS ====================
  async getAppsForPlayer(uuid: string): Promise<SmartRotomUserApp[]> {
    this.validateUuid(uuid);
    
    await this.syncUserAppsWithActive(uuid);
    
    const queryResults = await this.appsRepository.getAppsForPlayer(uuid);
    return SmartRotomUserApp.fromPlayerAppsQuery(queryResults);
  }

  async addAppToPlayer(uuid: string, appId: number): Promise<{ added: boolean; appId: number; uuid: string }> {
    this.validateUuid(uuid);
    this.validateAppId(appId);

    // Validate app exists
    await this.validateAppExists(appId);

    // Check if user already has the app
    await this.validateUserDoesNotHaveApp(uuid, appId);

    // Get max order for this user
    const maxOrder = await this.appsRepository.getMaxUserAppOrder(uuid);

    // Add the app to the player
    await this.appsRepository.addUserApp(uuid, appId, maxOrder + 1);

    return { 
      added: true, 
      appId, 
      uuid 
    };
  }

  async removeAppFromPlayer(uuid: string, appId: number): Promise<{ removed: boolean; appId: number; uuid: string }> {
    this.validateUuid(uuid);
    this.validateAppId(appId);

    // Validate user has the app
    await this.validateUserHasApp(uuid, appId);

    // Remove the app
    const result = await this.appsRepository.removeUserApp(uuid, appId);

    return { 
      removed: result.affectedRows > 0, 
      appId, 
      uuid 
    };
  }

  async orderAppsForPlayer(
    orderData: { id: number | string; order: number }[], 
    uuid: string
  ): Promise<{ updated: boolean; totalApps: number; uuid: string }> {
    this.validateUuid(uuid);
    this.validateOrderData(orderData);
    

    // Get existing apps for the player
    const existingApps = await this.appsRepository.getAppsForPlayer(uuid);
    const existingAppIds = new Set(existingApps.map(app => app.id));

    // Filter and validate order items
    const validOrderItems = this.filterValidOrderItems(orderData, existingAppIds);

    if (validOrderItems.length === 0) {
      throw new BusinessRuleViolationException(
        'No valid apps found in order data',
        ErrorCodes.INVALID_APP_ORDER,
        { uuid, providedApps: orderData.length, validApps: 0 }
      );
    }

    // Validate order sequence (no duplicates, positive numbers)
    this.validateOrderSequence(validOrderItems);

    // Update orders
    await this.updateAppOrders(uuid, validOrderItems);

    // Reset order for apps not in the list
    const validAppIds = validOrderItems.map(item => Number(item.id));
    const appsToReset = Array.from(existingAppIds).filter(id => !validAppIds.includes(id));
    if (appsToReset.length > 0) {
      await this.appsRepository.resetUserAppOrder(uuid, appsToReset);
    }
    
    return { 
      updated: true, 
      totalApps: validOrderItems.length, 
      uuid 
    };
  }

  async resetPlayerAppOrder(uuid: string): Promise<{ reset: boolean; uuid: string }> {
    this.validateUuid(uuid);

    await this.appsRepository.resetUserAppOrder(uuid, []);

    return { 
      reset: true, 
      uuid 
    };
  }

  async getPlayerAppCount(uuid: string): Promise<{ count: number; uuid: string }> {
    this.validateUuid(uuid);

    const count = await this.appsRepository.getUserAppCount(uuid);

    return { 
      count, 
      uuid 
    };
  }

  async getAvailableAppsForPlayer(uuid: string): Promise<SmartRotomUserApp[]> {
    this.validateUuid(uuid);

    const apps = await this.appsRepository.getAvailableAppsForUser(uuid);
    return apps.map(app => new SmartRotomUserApp({
      ...app,
      orden: DefaultValues.APP_ORDER,
      is_user_app: 0
    }));
  }

  async bulkAddAppsToPlayer(uuid: string, appIds: number[]): Promise<{ addedCount: number; uuid: string }> {
    this.validateUuid(uuid);

    if (!Array.isArray(appIds) || appIds.length === 0) {
      throw new ValidationException(
        'App IDs array is required and cannot be empty',
        ErrorCodes.VALIDATION_ERROR,
        { providedAppIds: appIds }
      );
    }

    // Validate all apps exist and are active
    for (const appId of appIds) {
      this.validateAppId(appId);
      await this.validateAppExistsAndActive(appId);
      await this.validateUserDoesNotHaveApp(uuid, appId);
    }

    const result = await this.appsRepository.bulkAddUserApps(uuid, appIds);

    return {
      addedCount: result.insertedCount,
      uuid
    };
  }

  async bulkRemoveAppsFromPlayer(uuid: string, appIds: number[]): Promise<{ removedCount: number; uuid: string }> {
    this.validateUuid(uuid);

    if (!Array.isArray(appIds) || appIds.length === 0) {
      throw new ValidationException(
        'App IDs array is required and cannot be empty',
        ErrorCodes.VALIDATION_ERROR,
        { providedAppIds: appIds }
      );
    }

    // Validate all apps belong to user
    for (const appId of appIds) {
      this.validateAppId(appId);
      await this.validateUserHasApp(uuid, appId);
    }

    const result = await this.appsRepository.bulkRemoveUserApps(uuid, appIds);

    return {
      removedCount: result.removedCount,
      uuid
    };
  }

  async searchUserApps(uuid: string, searchTerm: string): Promise<SmartRotomUserApp[]> {
    this.validateUuid(uuid);

    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new ValidationException(
        'Search term is required',
        ErrorCodes.VALIDATION_ERROR,
        { searchTerm }
      );
    }

    const apps = await this.appsRepository.searchUserApps(uuid, searchTerm.trim());
    return apps.map(app => new SmartRotomUserApp({
      ...app,
      orden: DefaultValues.APP_ORDER,
      is_user_app: 1
    }));
  }

  // ==================== NEW SYNC METHODS ====================
  async syncUserAppsWithActive(uuid: string): Promise<{ syncedCount: number }> {
    this.validateUuid(uuid);
    return this.appsRepository.syncUserAppsWithActiveApps(uuid);
  }

  async removeInactiveAppsFromUser(uuid: string): Promise<{ removedCount: number }> {
    this.validateUuid(uuid);
    return this.appsRepository.removeInactiveAppsFromUser(uuid);
  }

  async syncAllUsersWithActiveApps(): Promise<{ totalSynced: number; usersAffected: number }> {
    return this.appsRepository.syncAllUsersWithActiveApps();
  }

  // ==================== VALIDATION METHODS ====================
  private validateUuid(uuid: string): void {
    if (!uuid || typeof uuid !== 'string' || uuid.trim().length === 0) {
      throw new ValidationException(
        'UUID is required',
        ErrorCodes.INVALID_UUID,
        { providedUuid: uuid }
      );
    }

    const trimmedUuid = uuid.trim();
    if (trimmedUuid.length !== ValidationRules.UUID_LENGTH) {
      throw new ValidationException(
        `UUID must be exactly ${ValidationRules.UUID_LENGTH} characters`,
        ErrorCodes.INVALID_UUID,
        { providedUuid: uuid, expectedLength: ValidationRules.UUID_LENGTH }
      );
    }

    // UUID format validation (basic)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(trimmedUuid)) {
      throw new ValidationException(
        'Invalid UUID format',
        ErrorCodes.INVALID_UUID,
        { providedUuid: uuid }
      );
    }
  }

  private validateAppId(appId: number): void {
    if (!appId || !Number.isInteger(appId) || appId <= 0) {
      throw new ValidationException(
        'App ID must be a positive integer',
        ErrorCodes.INVALID_APP_ID,
        { providedAppId: appId }
      );
    }
  }

  private validateOrderData(orderData: { id: number | string; order: number }[]): void {
    if (!Array.isArray(orderData)) {
      throw new ValidationException(
        'Order data must be an array',
        ErrorCodes.INVALID_APP_ORDER,
        { providedType: typeof orderData }
      );
    }

    if (orderData.length === 0) {
      throw new ValidationException(
        'Order data cannot be empty',
        ErrorCodes.INVALID_APP_ORDER
      );
    }

    // Validate each order item
    for (const item of orderData) {
      if (!item || typeof item !== 'object') {
        throw new ValidationException(
          'Each order item must be an object with id and order properties',
          ErrorCodes.INVALID_APP_ORDER,
          { invalidItem: item }
        );
      }

      if (!('id' in item) || !('order' in item)) {
        throw new ValidationException(
          'Each order item must have id and order properties',
          ErrorCodes.INVALID_APP_ORDER,
          { invalidItem: item }
        );
      }

      if (!Number.isInteger(item.order) || item.order < 0) {
        throw new ValidationException(
          'Order must be a non-negative integer',
          ErrorCodes.INVALID_APP_ORDER,
          { invalidOrder: item.order, appId: item.id }
        );
      }
    }
  }

  private async validateAppExists(appId: number): Promise<void> {
    const appExists = await this.appsRepository.exists(appId);
    if (!appExists) {
      throw new EntityNotFoundException('App', appId);
    }
  }

  private async validateAppExistsAndActive(appId: number): Promise<void> {
    const app = await this.appsRepository.findById(appId);
    if (!app) {
      throw new EntityNotFoundException('App', appId);
    }
    
    const isActive = await this.appsRepository.validateAppIsActive(appId);
    if (!isActive) {
      throw new BusinessRuleViolationException(
        'App is not active and cannot be added to player',
        ErrorCodes.APP_INACTIVE,
        { appId }
      );
    }
  }

  private async validateUserDoesNotHaveApp(uuid: string, appId: number): Promise<void> {
    const existingUserApp = await this.appsRepository.findUserApp(uuid, appId);
    if (existingUserApp) {
      throw new BusinessRuleViolationException(
        'User already has this app',
        ErrorCodes.USER_APP_ALREADY_EXISTS,
        { uuid, appId }
      );
    }
  }

  private async validateUserHasApp(uuid: string, appId: number): Promise<void> {
    const userApp = await this.appsRepository.findUserApp(uuid, appId);
    if (!userApp) {
      throw new EntityNotFoundException('UserApp', `${uuid}:${appId}`);
    }
  }

  // ==================== HELPER METHODS ====================
  private filterValidOrderItems(
    orderData: { id: number | string; order: number }[],
    existingAppIds: Set<number>
  ): { id: number | string; order: number }[] {
    return orderData.filter(item => {
      const appId = Number(item.id);
      return !isNaN(appId) && existingAppIds.has(appId) && item.order >= 0;
    });
  }

  private validateOrderSequence(orderItems: { id: number | string; order: number }[]): void {
    // Check for duplicate orders
    const orders = orderItems.map(item => item.order);
    const uniqueOrders = new Set(orders);
    
    if (orders.length !== uniqueOrders.size) {
      throw new BusinessRuleViolationException(
        'Duplicate order values are not allowed',
        ErrorCodes.INVALID_APP_ORDER,
        { duplicateOrders: orders.filter((order, index) => orders.indexOf(order) !== index) }
      );
    }

    // Check for duplicate app IDs
    const appIds = orderItems.map(item => Number(item.id));
    const uniqueAppIds = new Set(appIds);
    
    if (appIds.length !== uniqueAppIds.size) {
      throw new BusinessRuleViolationException(
        'Duplicate app IDs are not allowed',
        ErrorCodes.INVALID_APP_ORDER,
        { duplicateAppIds: appIds.filter((id, index) => appIds.indexOf(id) !== index) }
      );
    }
  }

  private async updateAppOrders(
    uuid: string, 
    orderItems: { id: number | string; order: number }[]
  ): Promise<void> {
    for (const item of orderItems) {
      await this.appsRepository.updateUserAppOrder(
        uuid, 
        Number(item.id), 
        item.order
      );
    }
  }
}