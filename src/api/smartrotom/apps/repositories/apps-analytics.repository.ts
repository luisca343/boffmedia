import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DatabaseRepository } from '@/api/_shared/repositories/database.repository';
import { 
  SmartRotomApp, 
  smartrotomApps, 
  smartrotomUserApps 
} from '@/_db/schema/SmartRotom';
import { IAppsAnalyticsRepository } from './apps-analytics.repository.interface';

@Injectable()
export class AppsAnalyticsRepository extends DatabaseRepository implements IAppsAnalyticsRepository {

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

  async getAppsWithUserCounts(): Promise<any[]> {
    const result = await this.db.execute(sql`
      SELECT 
        sa.*,
        COUNT(sao.uuid) as user_count
      FROM ${smartrotomApps} sa
      LEFT JOIN ${smartrotomUserApps} sao ON sa.id = sao.app_id
      GROUP BY sa.id
      ORDER BY user_count DESC, sa.name ASC
    `);

    return result[0] as unknown as any[];
  }

  async getMostPopularApps(limit: number = 10): Promise<any[]> {
    const result = await this.db.execute(sql`
      SELECT 
        sa.id,
        sa.name,
        sa.url,
        COUNT(sao.uuid) as user_count
      FROM ${smartrotomApps} sa
      INNER JOIN ${smartrotomUserApps} sao ON sa.id = sao.app_id
      GROUP BY sa.id, sa.name, sa.url
      ORDER BY user_count DESC
      LIMIT ${limit}
    `);

    return result[0] as unknown as any[];
  }

  async getAppsWithoutUsers(): Promise<SmartRotomApp[]> {
    const result = await this.db.execute(sql`
      SELECT sa.*
      FROM ${smartrotomApps} sa
      LEFT JOIN ${smartrotomUserApps} sao ON sa.id = sao.app_id
      WHERE sao.app_id IS NULL
      ORDER BY sa.name ASC
    `);

    return result[0] as unknown as SmartRotomApp[];
  }

  async getUserCountByApp(): Promise<Map<number, number>> {
    const result = await this.db
      .select({
        appId: smartrotomUserApps.appId,
        count: sql<number>`COUNT(*)`
      })
      .from(smartrotomUserApps)
      .groupBy(smartrotomUserApps.appId);

    return new Map(result.map(row => [row.appId, row.count]));
  }
}