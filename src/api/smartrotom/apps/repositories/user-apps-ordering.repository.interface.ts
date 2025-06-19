export interface IUserAppsOrderingRepository {
  updateUserAppOrder(uuid: string, appId: number, order: number): Promise<void>;
  resetUserAppOrder(uuid: string, excludeAppIds: number[]): Promise<void>;
  reorderUserApps(uuid: string, startOrder?: number): Promise<void>;
  getMaxUserAppOrder(uuid: string): Promise<number>;
}