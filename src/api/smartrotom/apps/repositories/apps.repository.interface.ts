import { IBaseRepository } from '@/api/_shared/repositories/base.repository.interface';
import { SmartRotomApp } from '@/_db/schema/SmartRotom';
import { AppStatus } from '@/api/_shared/constants/app.constants';

export interface IAppsRepository extends IBaseRepository<SmartRotomApp, number> {
  // App-specific methods
  findByStatus(status: AppStatus): Promise<SmartRotomApp[]>;
  findByUrl(url: string): Promise<SmartRotomApp | null>;
  searchApps(searchTerm: string): Promise<SmartRotomApp[]>;
  
  // Batch operations
  batchUpdateAppStatus(appIds: number[], status: AppStatus): Promise<{ updatedCount: number }>;
  batchDeleteApps(appIds: number[]): Promise<{ deletedCount: number }>;

  // Validation helpers
  validateAppIsActive(appId: number): Promise<boolean>;
  validateUrlUniqueness(url: string, excludeId?: number): Promise<boolean>;
}