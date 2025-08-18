import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, sql, or, asc } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { 
  SmartRotomUserApp, 
  smartrotomUserApps, 
  smartrotomApps 
} from '@/_db/schema/SmartRotom';
import { IUserAppsRepository } from './interfaces/user-apps-repository.interface';

@Injectable()
export class UserAppsRepository implements IUserAppsRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  async findByPlayerUuid(uuid: string): Promise<SmartRotomUserApp[]> {
    return this.db.select()
      .from(smartrotomUserApps)
      .where(eq(smartrotomUserApps.uuid, uuid));
  }

  async findUserApp(uuid: string, appId: number): Promise<SmartRotomUserApp | null> {
    const result = await this.db.select()
      .from(smartrotomUserApps)
      .where(and(
        eq(smartrotomUserApps.uuid, uuid),
        eq(smartrotomUserApps.appId, appId)
      ));
    return result[0] || null;
  }

  async addUserApp(uuid: string, appId: number, order: number = 999): Promise<SmartRotomUserApp> {
    const result = await this.db.insert(smartrotomUserApps)
      .values({
        uuid,
        appId,
        order
      } as SmartRotomUserApp);
    
    const insertedApp = await this.findUserApp(uuid, appId);
    if (!insertedApp) {
      throw new Error('Failed to create user app');
    }
    return insertedApp;
  }

  async removeUserApp(uuid: string, appId: number): Promise<boolean> {
    const result = await this.db.delete(smartrotomUserApps)
      .where(and(
        eq(smartrotomUserApps.uuid, uuid),
        eq(smartrotomUserApps.appId, appId)
      ));
    return result[0].affectedRows > 0;
  }

  async updateOrder(uuid: string, appId: number, order: number): Promise<void> {
    await this.db.update(smartrotomUserApps)
      .set({ order } as SmartRotomUserApp)
      .where(and(
        eq(smartrotomUserApps.uuid, uuid),
        eq(smartrotomUserApps.appId, appId)
      ));
  }

  async resetOrderExcept(uuid: string, excludeAppIds: number[]): Promise<void> {
    console.log('Resetting order for user:', uuid, 'excluding apps:', excludeAppIds);
    if (excludeAppIds.length === 0) {
      await this.db.update(smartrotomUserApps)
        .set({ order: 999 } as SmartRotomUserApp)
        .where(eq(smartrotomUserApps.uuid, uuid));
    } else {
      await this.db.update(smartrotomUserApps)
        .set({ order: 999 } as SmartRotomUserApp)
        .where(and(
          eq(smartrotomUserApps.uuid, uuid),
          sql`${smartrotomUserApps.appId} NOT IN (${excludeAppIds})`
        ));
    }
  }

  async getAppsForPlayer(uuid: string): Promise<any[]> {
    return this.db.select({
      id: smartrotomApps.id,
      url: smartrotomApps.url,
      name: smartrotomApps.name,
      orden: sql`COALESCE(${smartrotomUserApps.order}, 999)`.as('orden'),
      is_user_app: sql`CASE WHEN ${smartrotomUserApps.uuid} IS NOT NULL THEN 1 ELSE 0 END`.as('is_user_app')
    })
    .from(smartrotomApps)
    .leftJoin(smartrotomUserApps, and(
      eq(smartrotomApps.id, smartrotomUserApps.appId),
      eq(smartrotomUserApps.uuid, uuid)
    ))
    .where(and(
      eq(smartrotomApps.active, 1),
      eq(smartrotomUserApps.uuid, uuid)
    ))
    .orderBy(
      asc(smartrotomUserApps.order),
    );
  }
}