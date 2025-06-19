import { Injectable } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DatabaseRepository } from '@/api/_shared/repositories/database.repository';
import { 
  SmartRotomApp, 
  smartrotomApps, 
  SmartRotomUserApp, 
  smartrotomUserApps 
} from '@/_db/schema/SmartRotom';
import { IUserAppsRepository } from './user-apps.repository.interface';
import { AppStatus, DefaultValues } from '@/api/_shared/constants/app.constants';

@Injectable()
export class UserAppsRepository extends DatabaseRepository implements IUserAppsRepository {

  // ==================== USER APP BASIC OPERATIONS ====================
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

  async getUserAppCount(uuid: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(smartrotomUserApps)
      .where(eq(smartrotomUserApps.uuid, uuid));
    
    return result[0]?.count || 0;
  }

  async getUsersWithApp(appId: number): Promise<string[]> {
    const result = await this.db
      .select({ uuid: smartrotomUserApps.uuid })
      .from(smartrotomUserApps)
      .where(eq(smartrotomUserApps.appId, appId));

    return result.map(row => row.uuid);
  }

  async validateUserHasApp(uuid: string, appId: number): Promise<boolean> {
    const userApp = await this.findUserApp(uuid, appId);
    return !!userApp;
  }

  // ==================== BULK OPERATIONS ====================
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

  async removeAppsFromAllUsers(appIds: number[]): Promise<{ removedCount: number }> {
    if (appIds.length === 0) {
      return { removedCount: 0 };
    }
    
    const result = await this.db
      .delete(smartrotomUserApps)
      .where(sql`${smartrotomUserApps.appId} IN (${appIds.join(',')})`);

    return { removedCount: result[0].affectedRows };
  }

  async removeInactiveAppFromAllUsers(appId: number): Promise<{ removedCount: number }> {
    const result = await this.db
      .delete(smartrotomUserApps)
      .where(eq(smartrotomUserApps.appId, appId));

    return { removedCount: result[0].affectedRows };
  }

  // ==================== SEARCH AND FILTERING ====================
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

  async getAvailableAppsForUser(uuid: string): Promise<SmartRotomApp[]> {
    const result = await this.db.execute(sql`
      SELECT sa.*
      FROM ${smartrotomApps} sa
      LEFT JOIN ${smartrotomUserApps} sao ON sa.id = sao.app_id AND sao.uuid = ${uuid}
      WHERE sa.active = ${AppStatus.ACTIVE} AND sao.uuid IS NULL
      ORDER BY sa.name ASC
    `);

    return result[0] as unknown as SmartRotomApp[];
  }

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

  // ==================== HELPER METHODS ====================
  async getMaxUserAppOrder(uuid: string): Promise<number> {
    const result = await this.db
      .select({ maxOrder: sql<number>`MAX(${smartrotomUserApps.order})` })
      .from(smartrotomUserApps)
      .where(eq(smartrotomUserApps.uuid, uuid));
    
    return result[0]?.maxOrder || 0;
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
}