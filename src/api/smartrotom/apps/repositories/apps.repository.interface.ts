import { IBaseRepository } from '@/api/_shared/repositories/base.repository.interface';
import { SmartRotomApp, SmartRotomUserApp } from '@/_db/schema/SmartRotom';
import { AppStatus } from '@/api/_shared/constants/app.constants';

export interface IAppsRepository extends IBaseRepository<SmartRotomApp, number> {
  // ==================== APP-SPECIFIC METHODS ====================
  findByStatus(status: AppStatus): Promise<SmartRotomApp[]>;
  findByUrl(url: string): Promise<SmartRotomApp | null>;
  
  // ==================== USER APP METHODS ====================
  getAppsForPlayer(uuid: string): Promise<any[]>;
  findUserApp(uuid: string, appId: number): Promise<SmartRotomUserApp | null>;
  addUserApp(uuid: string, appId: number, order?: number): Promise<{ insertId: number }>;
  removeUserApp(uuid: string, appId: number): Promise<{ affectedRows: number }>;
  updateUserAppOrder(uuid: string, appId: number, order: number): Promise<void>;
  resetUserAppOrder(uuid: string, excludeAppIds: number[]): Promise<void>;
  
   // ==================== USER APP SYNC METHODS ====================
  syncUserAppsWithActiveApps(uuid: string): Promise<{ syncedCount: number }>;
  removeInactiveAppsFromUser(uuid: string): Promise<{ removedCount: number }>;
  syncAllUsersWithActiveApps(): Promise<{ totalSynced: number; usersAffected: number }>;
  removeInactiveAppFromAllUsers(appId: number): Promise<{ removedCount: number }>;
  removeAppsFromAllUsers(appIds: number[]): Promise<{ removedCount: number }>;


  // ==================== ADDITIONAL UTILITY METHODS ====================
  getUserAppsByStatus(uuid: string, status: AppStatus): Promise<SmartRotomApp[]>;
  getActiveUserApps(uuid: string): Promise<SmartRotomApp[]>;
  getInactiveUserApps(uuid: string): Promise<SmartRotomApp[]>;
  getUserAppCount(uuid: string): Promise<number>;
  getMaxUserAppOrder(uuid: string): Promise<number>;
  reorderUserApps(uuid: string, startOrder?: number): Promise<void>;
  bulkAddUserApps(uuid: string, appIds: number[]): Promise<{ insertedCount: number }>;
  bulkRemoveUserApps(uuid: string, appIds: number[]): Promise<{ removedCount: number }>;

  // ==================== SEARCH AND FILTERING ====================
  searchApps(searchTerm: string): Promise<SmartRotomApp[]>;
  searchUserApps(uuid: string, searchTerm: string): Promise<SmartRotomApp[]>;
  
  // ==================== ADVANCED QUERIES ====================
  getAvailableAppsForUser(uuid: string): Promise<SmartRotomApp[]>;
  getAppUsageStatistics(appId?: number): Promise<any[]>;
  getUsersWithApp(appId: number): Promise<string[]>;
  getUserAppOrderMap(uuid: string): Promise<Map<number, number>>;

  // ==================== BATCH OPERATIONS ====================
  batchUpdateAppStatus(appIds: number[], status: AppStatus): Promise<{ updatedCount: number }>;
  batchDeleteApps(appIds: number[]): Promise<{ deletedCount: number }>;

  // ==================== VALIDATION HELPERS ====================
  validateAppExists(appId: number): Promise<boolean>;
  validateAppIsActive(appId: number): Promise<boolean>;
  validateUserHasApp(uuid: string, appId: number): Promise<boolean>;
  validateUrlUniqueness(url: string, excludeId?: number): Promise<boolean>;
}