import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { 
  SmartRotomApp, 
  smartrotomApps, 
  SmartRotomUserApp, 
  smartrotomUserApps 
} from '@/_db/schema/SmartRotom';

@Injectable()
export class AppsRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  async findAll(): Promise<SmartRotomApp[]> {
    return this.db.select().from(smartrotomApps);
  }

  async findById(id: number): Promise<SmartRotomApp> {
    const result = await this.db.select()
      .from(smartrotomApps)
      .where(eq(smartrotomApps.id, id));
    return result[0];
  }

  async create(appData: Partial<SmartRotomApp>): Promise<{ insertId: number }> {
    const result = await this.db.insert(smartrotomApps)
      .values({
        ...appData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as SmartRotomApp);
    
    return { insertId: result[0].insertId };
  }

  async update(id: number, appData: Partial<SmartRotomApp>): Promise<void> {
    await this.db.update(smartrotomApps)
      .set({
        ...appData,
        updatedAt: new Date()
      } as SmartRotomApp)
      .where(eq(smartrotomApps.id, id));
  }

  async delete(id: number): Promise<{ affectedRows: number }> {
    const result = await this.db.delete(smartrotomApps)
      .where(eq(smartrotomApps.id, id));
    return { affectedRows: result[0].affectedRows };
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

  async findUserApp(uuid: string, appId: number): Promise<SmartRotomUserApp> {
    const result = await this.db.select()
      .from(smartrotomUserApps)
      .where(and(
        eq(smartrotomUserApps.uuid, uuid),
        eq(smartrotomUserApps.appId, appId)
      ));
    return result[0];
  }

  async findUserApps(uuid: string): Promise<SmartRotomUserApp[]> {
    return this.db.select()
      .from(smartrotomUserApps)
      .where(eq(smartrotomUserApps.uuid, uuid));
  }

  async addUserApp(userAppData: Partial<SmartRotomUserApp>): Promise<{ insertId: number }> {
    const result = await this.db.insert(smartrotomUserApps)
      .values(userAppData as SmartRotomUserApp);
    
    return { insertId: result[0].insertId };
  }

  async removeUserApp(uuid: string, appId: number): Promise<{ affectedRows: number }> {
    const result = await this.db.delete(smartrotomUserApps)
      .where(and(
        eq(smartrotomUserApps.uuid, uuid),
        eq(smartrotomUserApps.appId, appId)
      ));
    return { affectedRows: result[0].affectedRows };
  }

  async updateUserAppOrder(uuid: string, appId: number, order: number): Promise<void> {
    await this.db.update(smartrotomUserApps)
      .set({ order } as SmartRotomUserApp)
      .where(and(
        eq(smartrotomUserApps.uuid, uuid),
        eq(smartrotomUserApps.appId, appId)
      ));
  }

  async resetUserAppOrder(uuid: string, excludeAppIds: number[]): Promise<void> {
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

  async findActiveApp(appId: number): Promise<SmartRotomApp> {
    const result = await this.db.select()
      .from(smartrotomApps)
      .where(and(
        eq(smartrotomApps.id, appId),
        eq(smartrotomApps.active, 0)
      ));
    return result[0];
  }
}