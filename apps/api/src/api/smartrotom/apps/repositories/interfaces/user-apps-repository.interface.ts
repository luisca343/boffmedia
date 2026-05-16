import { SmartRotomUserApp } from '@/_db/schema/SmartRotom';

export interface IUserAppsRepository {
  findByPlayerUuid(uuid: string): Promise<SmartRotomUserApp[]>;
  findUserApp(uuid: string, appId: number): Promise<SmartRotomUserApp | null>;
  addUserApp(
    uuid: string,
    appId: number,
    order?: number,
  ): Promise<SmartRotomUserApp>;
  removeUserApp(uuid: string, appId: number): Promise<boolean>;
  updateOrder(uuid: string, appId: number, order: number): Promise<void>;
  resetOrderExcept(uuid: string, excludeAppIds: number[]): Promise<void>;
  getAppsForPlayer(uuid: string): Promise<any[]>;
}
