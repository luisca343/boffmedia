import { SmartRotomApp } from '@/_db/schema/SmartRotom';

export interface IAppsAnalyticsRepository {
  getAppUsageStatistics(appId?: number): Promise<any[]>;
  getAppsWithUserCounts(): Promise<any[]>;
  getMostPopularApps(limit?: number): Promise<any[]>;
  getAppsWithoutUsers(): Promise<SmartRotomApp[]>;
  getUserCountByApp(): Promise<Map<number, number>>;
}