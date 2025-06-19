export interface IUserAppsSyncRepository {
  syncUserAppsWithActiveApps(uuid: string): Promise<{ syncedCount: number }>;
  removeInactiveAppsFromUser(uuid: string): Promise<{ removedCount: number }>;
  syncAllUsersWithActiveApps(): Promise<{ totalSynced: number; usersAffected: number }>;
}