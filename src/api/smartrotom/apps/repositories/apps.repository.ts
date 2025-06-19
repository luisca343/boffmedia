import { Injectable } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { BaseRepository } from '@/api/_shared/repositories/base.repository';
import { 
  SmartRotomApp, 
  smartrotomApps, 
  SmartRotomUserApp, 
  smartrotomUserApps 
} from '@/_db/schema/SmartRotom';
import { IAppsRepository } from './apps.repository.interface';
import { AppStatus, DefaultValues } from '@/api/_shared/constants/app.constants';

@Injectable()
export class AppsRepository extends BaseRepository<SmartRotomApp, number> implements IAppsRepository {
  
  // ==================== BASE REPOSITORY IMPLEMENTATION ====================
  async findAll(): Promise<SmartRotomApp[]> {
    return this.db.select().from(smartrotomApps);
  }

  async findById(id: number): Promise<SmartRotomApp | null> {
    const result = await this.db
      .select()
      .from(smartrotomApps)
      .where(eq(smartrotomApps.id, id));
    
    return result[0] || null;
  }

  async create(appData: Partial<SmartRotomApp>): Promise<{ insertId: number }> {
    const result = await this.db
      .insert(smartrotomApps)
      .values({
        ...appData,
        active: appData.active ?? AppStatus.ACTIVE,
      } as SmartRotomApp);
    
    return { insertId: result[0].insertId };
  }

  async update(id: number, appData: Partial<SmartRotomApp>): Promise<void> {
    await this.db
      .update(smartrotomApps)
      .set(appData)
      .where(eq(smartrotomApps.id, id));
  }

  async delete(id: number): Promise<{ affectedRows: number }> {
    const result = await this.db
      .delete(smartrotomApps)
      .where(eq(smartrotomApps.id, id));
    
    return { affectedRows: result[0].affectedRows };
  }

  // ==================== APP-SPECIFIC METHODS ====================
  async findByStatus(status: AppStatus): Promise<SmartRotomApp[]> {
    return this.db
      .select()
      .from(smartrotomApps)
      .where(eq(smartrotomApps.active, status));
  }

  async findByUrl(url: string): Promise<SmartRotomApp | null> {
    const result = await this.db
      .select()
      .from(smartrotomApps)
      .where(eq(smartrotomApps.url, url));
    
    return result[0] || null;
  }

  // ==================== USER APP METHODS ====================
  async getAppsForPlayer(uuid: string): Promise<any[]> {
    const result = await this.db.execute(sql`
      SELECT DISTINCT 
        sa.id, 
        sa.url, 
        sa.name, 
        sa.active,
        COALESCE(sao.order, ${DefaultValues.APP_ORDER}) as orden,
        CASE WHEN sao.uuid IS NOT NULL THEN 1 ELSE 0 END as is_user_app
      FROM ${smartrotomApps} sa
      LEFT JOIN ${smartrotomUserApps} sao ON sa.id = sao.app_id AND sao.uuid = ${uuid}
      WHERE sa.active = ${AppStatus.ACTIVE} OR sao.uuid = ${uuid}
      ORDER BY is_user_app DESC, orden ASC, sa.name ASC
    `);

    return result[0] as unknown as any[];
  }

  async findUserApp(uuid: string, appId: number): Promise<SmartRotomUserApp | null> {
    const result = await this.db
      .select()
      .from(smartrotomUserApps)
      .where(and(
        eq(smartrotomUserApps.uuid, uuid),
        eq(smartrotomUserApps.appId, appId)
      ));
    
    return result[0] || null;
  }

  async addUserApp(uuid: string, appId: number, order: number = DefaultValues.APP_ORDER): Promise<{ insertId: number }> {
    const result = await this.db
      .insert(smartrotomUserApps)
      .values({ 
        uuid, 
        appId, 
        order 
      } as SmartRotomUserApp);
    
    return { insertId: result[0].insertId };
  }

  async removeUserApp(uuid: string, appId: number): Promise<{ affectedRows: number }> {
    const result = await this.db
      .delete(smartrotomUserApps)
      .where(and(
        eq(smartrotomUserApps.uuid, uuid),
        eq(smartrotomUserApps.appId, appId)
      ));
    
    return { affectedRows: result[0].affectedRows };
  }

  async updateUserAppOrder(uuid: string, appId: number, order: number): Promise<void> {
    await this.db
      .update(smartrotomUserApps)
      .set({ order } as SmartRotomUserApp)
      .where(and(
        eq(smartrotomUserApps.uuid, uuid),
        eq(smartrotomUserApps.appId, appId)
      ));
  }

  async resetUserAppOrder(uuid: string, excludeAppIds: number[]): Promise<void> {
    if (excludeAppIds.length === 0) {
      // Reset all user apps for this UUID
      await this.db
        .update(smartrotomUserApps)
        .set({ order: DefaultValues.APP_ORDER } as SmartRotomUserApp)
        .where(eq(smartrotomUserApps.uuid, uuid));
    } else {
      // Reset all except specified app IDs
      await this.db
        .update(smartrotomUserApps)
        .set({ order: DefaultValues.APP_ORDER } as SmartRotomUserApp)
        .where(and(
          eq(smartrotomUserApps.uuid, uuid),
          sql`${smartrotomUserApps.appId} NOT IN (${excludeAppIds.join(',')})`
        ));
    }
  }

  // ==================== USER APP SYNC METHODS ====================
  async syncUserAppsWithActiveApps(uuid: string): Promise<{ syncedCount: number }> {
    // Get all active apps
    const activeApps = await this.db
      .select({ id: smartrotomApps.id })
      .from(smartrotomApps)
      .where(eq(smartrotomApps.active, AppStatus.ACTIVE));

    if (activeApps.length === 0) {
      return { syncedCount: 0 };
    }

    const activeAppIds = activeApps.map(app => app.id);

    // Get existing user apps
    const existingUserApps = await this.db
      .select({ appId: smartrotomUserApps.appId })
      .from(smartrotomUserApps)
      .where(eq(smartrotomUserApps.uuid, uuid));

    const existingAppIds = new Set(existingUserApps.map(app => app.appId));

    // Find apps that need to be added
    const appsToAdd = activeAppIds.filter(appId => !existingAppIds.has(appId));

    if (appsToAdd.length === 0) {
      return { syncedCount: 0 };
    }

    // Get max order for this user
    const maxOrder = await this.getMaxUserAppOrder(uuid);

    // Prepare data for bulk insert
    const userAppData = appsToAdd.map((appId, index) => ({
      uuid,
      appId,
      order: maxOrder + index + 1,
    }));

    // Insert new user apps
    const result = await this.db
      .insert(smartrotomUserApps)
      .values(userAppData as SmartRotomUserApp[]);

    return { syncedCount: result[0].affectedRows };
  }

  async removeInactiveAppsFromUser(uuid: string): Promise<{ removedCount: number }> {
    // Remove user apps for apps that are no longer active
    const result = await this.db.execute(sql`
      DELETE sua FROM ${smartrotomUserApps} sua
      INNER JOIN ${smartrotomApps} sa ON sua.app_id = sa.id
      WHERE sua.uuid = ${uuid} AND sa.active = ${AppStatus.INACTIVE}
    `);

    return { removedCount: result[0].affectedRows };
  }

  async syncAllUsersWithActiveApps(): Promise<{ totalSynced: number; usersAffected: number }> {
    // Get all unique user UUIDs
    const users = await this.db
      .select({ uuid: sql<string>`DISTINCT ${smartrotomUserApps.uuid}` })
      .from(smartrotomUserApps);

    let totalSynced = 0;
    let usersAffected = 0;

    for (const user of users) {
      const result = await this.syncUserAppsWithActiveApps(user.uuid);
      if (result.syncedCount > 0) {
        totalSynced += result.syncedCount;
        usersAffected++;
      }
    }

    return { totalSynced, usersAffected };
  }

  async removeInactiveAppFromAllUsers(appId: number): Promise<{ removedCount: number }> {
    const result = await this.db
      .delete(smartrotomUserApps)
      .where(eq(smartrotomUserApps.appId, appId));

    return { removedCount: result[0].affectedRows };
  }

  async removeAppsFromAllUsers(appIds: number[]): Promise<{ removedCount: number }> {
    if (appIds.length === 0) {
      return { removedCount: 0 };
    }
    
    const result = await this.db
      .delete(smartrotomUserApps)
      .where(sql`${smartrotomUserApps.appId} IN (${appIds.join(',')})`);

    return { removedCount: result[0].affectedRows };
  }

  // ==================== ADDITIONAL UTILITY METHODS ====================
  async getUserAppsByStatus(uuid: string, status: AppStatus): Promise<SmartRotomApp[]> {
    return this.db
      .select({
        id: smartrotomApps.id,
        name: smartrotomApps.name,
        url: smartrotomApps.url,
        active: smartrotomApps.active,
      })
      .from(smartrotomApps)
      .innerJoin(smartrotomUserApps, eq(smartrotomApps.id, smartrotomUserApps.appId))
      .where(and(
        eq(smartrotomUserApps.uuid, uuid),
        eq(smartrotomApps.active, status)
      ))
      .orderBy(smartrotomUserApps.order);
  }

  async getActiveUserApps(uuid: string): Promise<SmartRotomApp[]> {
    return this.getUserAppsByStatus(uuid, AppStatus.ACTIVE);
  }

  async getInactiveUserApps(uuid: string): Promise<SmartRotomApp[]> {
    return this.getUserAppsByStatus(uuid, AppStatus.INACTIVE);
  }

  async getUserAppCount(uuid: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(smartrotomUserApps)
      .where(eq(smartrotomUserApps.uuid, uuid));
    
    return result[0]?.count || 0;
  }

  async getMaxUserAppOrder(uuid: string): Promise<number> {
    const result = await this.db
      .select({ maxOrder: sql<number>`MAX(${smartrotomUserApps.order})` })
      .from(smartrotomUserApps)
      .where(eq(smartrotomUserApps.uuid, uuid));
    
    return result[0]?.maxOrder || 0;
  }

  async reorderUserApps(uuid: string, startOrder: number = 1): Promise<void> {
    // Get all user apps ordered by current order
    const userApps = await this.db
      .select()
      .from(smartrotomUserApps)
      .where(eq(smartrotomUserApps.uuid, uuid))
      .orderBy(smartrotomUserApps.order);

    // Update each app with sequential order starting from startOrder
    for (let i = 0; i < userApps.length; i++) {
      await this.db
        .update(smartrotomUserApps)
        .set({ order: startOrder + i } as SmartRotomUserApp)
        .where(and(
          eq(smartrotomUserApps.uuid, uuid),
          eq(smartrotomUserApps.appId, userApps[i].appId)
        ));
    }
  }

  async bulkAddUserApps(uuid: string, appIds: number[]): Promise<{ insertedCount: number }> {
    if (appIds.length === 0) {
      return { insertedCount: 0 };
    }

    const maxOrder = await this.getMaxUserAppOrder(uuid);
    const userAppData = appIds.map((appId, index) => ({
      uuid,
      appId,
      order: maxOrder + index + 1,
    }));

    const result = await this.db
      .insert(smartrotomUserApps)
      .values(userAppData as SmartRotomUserApp[]);

    return { insertedCount: result[0].affectedRows };
  }

  async bulkRemoveUserApps(uuid: string, appIds: number[]): Promise<{ removedCount: number }> {
    if (appIds.length === 0) {
      return { removedCount: 0 };
    }

    const result = await this.db
      .delete(smartrotomUserApps)
      .where(and(
        eq(smartrotomUserApps.uuid, uuid),
        sql`${smartrotomUserApps.appId} IN (${appIds.join(',')})`
      ));

    return { removedCount: result[0].affectedRows };
  }

  // ==================== SEARCH AND FILTERING ====================
  async searchApps(searchTerm: string): Promise<SmartRotomApp[]> {
    return this.db
      .select()
      .from(smartrotomApps)
      .where(sql`
        ${smartrotomApps.name} LIKE ${`%${searchTerm}%`} OR 
        ${smartrotomApps.url} LIKE ${`%${searchTerm}%`}
      `);
  }

  async searchUserApps(uuid: string, searchTerm: string): Promise<SmartRotomApp[]> {
    return this.db
      .select({
        id: smartrotomApps.id,
        name: smartrotomApps.name,
        url: smartrotomApps.url,
        active: smartrotomApps.active,
      })
      .from(smartrotomApps)
      .innerJoin(smartrotomUserApps, eq(smartrotomApps.id, smartrotomUserApps.appId))
      .where(and(
        eq(smartrotomUserApps.uuid, uuid),
        sql`
          ${smartrotomApps.name} LIKE ${`%${searchTerm}%`} OR 
          ${smartrotomApps.url} LIKE ${`%${searchTerm}%`}
        `
      ))
      .orderBy(smartrotomUserApps.order);
  }

  // ==================== ADVANCED QUERIES ====================
  async getAvailableAppsForUser(uuid: string): Promise<SmartRotomApp[]> {
    // Get apps that are active but not yet added by the user
    const result = await this.db.execute(sql`
      SELECT sa.*
      FROM ${smartrotomApps} sa
      LEFT JOIN ${smartrotomUserApps} sao ON sa.id = sao.app_id AND sao.uuid = ${uuid}
      WHERE sa.active = ${AppStatus.ACTIVE} AND sao.uuid IS NULL
      ORDER BY sa.name ASC
    `);

    return result[0] as unknown as SmartRotomApp[];
  }

  async getAppUsageStatistics(appId?: number): Promise<any[]> {
    const whereClause = appId 
      ? sql`WHERE ${smartrotomUserApps.appId} = ${appId}`
      : sql``;

    const result = await this.db.execute(sql`
      SELECT 
        sa.id,
        sa.name,
        sa.url,
        COUNT(sao.uuid) as user_count,
        AVG(sao.order) as average_order
      FROM ${smartrotomApps} sa
      LEFT JOIN ${smartrotomUserApps} sao ON sa.id = sao.app_id
      ${whereClause}
      GROUP BY sa.id, sa.name, sa.url
      ORDER BY user_count DESC, sa.name ASC
    `);

    return result[0] as unknown as any[];
  }

  async getUsersWithApp(appId: number): Promise<string[]> {
    const result = await this.db
      .select({ uuid: smartrotomUserApps.uuid })
      .from(smartrotomUserApps)
      .where(eq(smartrotomUserApps.appId, appId));

    return result.map(row => row.uuid);
  }

  async getUserAppOrderMap(uuid: string): Promise<Map<number, number>> {
    const userApps = await this.db
      .select({
        appId: smartrotomUserApps.appId,
        order: smartrotomUserApps.order,
      })
      .from(smartrotomUserApps)
      .where(eq(smartrotomUserApps.uuid, uuid));

    return new Map(userApps.map(app => [app.appId, app.order]));
  }

  // ==================== BATCH OPERATIONS ====================
  async batchUpdateAppStatus(appIds: number[], status: AppStatus): Promise<{ updatedCount: number }> {
    if (appIds.length === 0) {
      return { updatedCount: 0 };
    }

    const result = await this.db
      .update(smartrotomApps)
      .set({ active: status } as SmartRotomApp)
      .where(sql`${smartrotomApps.id} IN (${appIds.join(',')})`);

    return { updatedCount: result[0].affectedRows };
  }

  async batchDeleteApps(appIds: number[]): Promise<{ deletedCount: number }> {
    if (appIds.length === 0) {
      return { deletedCount: 0 };
    }

    // First remove all user apps relationships
    await this.db
      .delete(smartrotomUserApps)
      .where(sql`${smartrotomUserApps.appId} IN (${appIds.join(',')})`);

    // Then delete the apps
    const result = await this.db
      .delete(smartrotomApps)
      .where(sql`${smartrotomApps.id} IN (${appIds.join(',')})`);

    return { deletedCount: result[0].affectedRows };
  }

  // ==================== VALIDATION HELPERS ====================
  async validateAppExists(appId: number): Promise<boolean> {
    return this.exists(appId);
  }

  async validateAppIsActive(appId: number): Promise<boolean> {
    const app = await this.findById(appId);
    return app ? app.active === AppStatus.ACTIVE : false;
  }

  async validateUserHasApp(uuid: string, appId: number): Promise<boolean> {
    const userApp = await this.findUserApp(uuid, appId);
    return !!userApp;
  }

  async validateUrlUniqueness(url: string, excludeId?: number): Promise<boolean> {
    const existingApp = await this.findByUrl(url);
    if (!existingApp) return true;
    return excludeId ? existingApp.id === excludeId : false;
  }
}