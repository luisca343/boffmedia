import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { BaseRepository } from '@/api/_shared/repositories/base.repository';
import { SmartRotomApp, smartrotomApps } from '@/_db/schema/SmartRotom';
import { IAppsRepository } from './apps.repository.interface';
import { AppStatus } from '@/api/_shared/constants/app.constants';

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

  async searchApps(searchTerm: string): Promise<SmartRotomApp[]> {
    return this.db
      .select()
      .from(smartrotomApps)
      .where(sql`
        ${smartrotomApps.name} LIKE ${`%${searchTerm}%`} OR 
        ${smartrotomApps.url} LIKE ${`%${searchTerm}%`}
      `);
  }

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

    const result = await this.db
      .delete(smartrotomApps)
      .where(sql`${smartrotomApps.id} IN (${appIds.join(',')})`);

    return { deletedCount: result[0].affectedRows };
  }

  // ==================== VALIDATION HELPERS ====================
  async validateAppIsActive(appId: number): Promise<boolean> {
    const app = await this.findById(appId);
    return app ? app.active === AppStatus.ACTIVE : false;
  }

  async validateUrlUniqueness(url: string, excludeId?: number): Promise<boolean> {
    const existingApp = await this.findByUrl(url);
    if (!existingApp) return true;
    return excludeId ? existingApp.id === excludeId : false;
  }
}