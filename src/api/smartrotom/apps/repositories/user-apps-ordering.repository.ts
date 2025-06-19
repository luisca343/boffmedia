import { Injectable } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DatabaseRepository } from '@/api/_shared/repositories/database.repository';
import { SmartRotomUserApp, smartrotomUserApps } from '@/_db/schema/SmartRotom';
import { IUserAppsOrderingRepository } from './user-apps-ordering.repository.interface';
import { DefaultValues } from '@/api/_shared/constants/app.constants';

@Injectable()
export class UserAppsOrderingRepository extends DatabaseRepository implements IUserAppsOrderingRepository {

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

  async getMaxUserAppOrder(uuid: string): Promise<number> {
    const result = await this.db
      .select({ maxOrder: sql<number>`MAX(${smartrotomUserApps.order})` })
      .from(smartrotomUserApps)
      .where(eq(smartrotomUserApps.uuid, uuid));
    
    return result[0]?.maxOrder || 0;
  }
}