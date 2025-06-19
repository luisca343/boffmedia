import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DatabaseRepository } from '@/api/_shared/repositories/database.repository';
import { 
  SmartRotomApp, 
  smartrotomApps, 
  SmartRotomUserApp, 
  smartrotomUserApps 
} from '@/_db/schema/SmartRotom';
import { IUserAppsSyncRepository } from './user-apps-sync.repository.interface';
import { AppStatus } from '@/api/_shared/constants/app.constants';

@Injectable()
export class UserAppsSyncRepository extends DatabaseRepository implements IUserAppsSyncRepository {

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

  private async getMaxUserAppOrder(uuid: string): Promise<number> {
    const result = await this.db
      .select({ maxOrder: sql<number>`MAX(${smartrotomUserApps.order})` })
      .from(smartrotomUserApps)
      .where(eq(smartrotomUserApps.uuid, uuid));
    
    return result[0]?.maxOrder || 0;
  }
}