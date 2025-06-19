import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, sql } from 'drizzle-orm';
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
    
    return this.findUserApp(uuid, appId);
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
    const result = await this.db.execute(sql`
      SELECT DISTINCT sa.id, sa.url, sa.name, 
        COALESCE(sao.order, 999) as orden,
        CASE WHEN sao.uuid IS NOT NULL THEN 1 ELSE 0 END as is_user_app
      FROM ${smartrotomApps} sa
      LEFT JOIN ${smartrotomUserApps} sao ON sa.id = sao.app_id AND sao.uuid = ${uuid}
      WHERE sa.active = 1 OR sao.uuid = ${uuid}
      ORDER BY is_user_app DESC, orden ASC, sa.name ASC
    `);

    return result[0] as unknown as any[];
  }
}