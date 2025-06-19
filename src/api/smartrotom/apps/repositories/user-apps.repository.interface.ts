import { SmartRotomApp, SmartRotomUserApp } from '@/_db/schema/SmartRotom';
import { AppStatus } from '@/api/_shared/constants/app.constants';

export interface IUserAppsRepository {
  // Basic operations
  getAppsForPlayer(uuid: string): Promise<any[]>;
  findUserApp(uuid: string, appId: number): Promise<SmartRotomUserApp | null>;
  addUserApp(uuid: string, appId: number, order?: number): Promise<{ insertId: number }>;
  removeUserApp(uuid: string, appId: number): Promise<{ affectedRows: number }>;
  getUserAppCount(uuid: string): Promise<number>;
  getUsersWithApp(appId: number): Promise<string[]>;
  validateUserHasApp(uuid: string, appId: number): Promise<boolean>;

  // Bulk operations
  bulkAddUserApps(uuid: string, appIds: number[]): Promise<{ insertedCount: number }>;
  bulkRemoveUserApps(uuid: string, appIds: number[]): Promise<{ removedCount: number }>;
  removeAppsFromAllUsers(appIds: number[]): Promise<{ removedCount: number }>;
  removeInactiveAppFromAllUsers(appId: number): Promise<{ removedCount: number }>;

  // Search and filtering
  searchUserApps(uuid: string, searchTerm: string): Promise<SmartRotomApp[]>;
  getAvailableAppsForUser(uuid: string): Promise<SmartRotomApp[]>;
  getUserAppsByStatus(uuid: string, status: AppStatus): Promise<SmartRotomApp[]>;
  getActiveUserApps(uuid: string): Promise<SmartRotomApp[]>;
  getInactiveUserApps(uuid: string): Promise<SmartRotomApp[]>;

  // Helper methods
  getMaxUserAppOrder(uuid: string): Promise<number>;
  getUserAppOrderMap(uuid: string): Promise<Map<number, number>>;
}