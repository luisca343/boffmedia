import { Module } from '@nestjs/common';

// Repository Implementations
import { AppsRepository } from './apps.repository';
import { UserAppsRepository } from './user-apps.repository';
import { UserAppsOrderingRepository } from './user-apps-ordering.repository';
import { UserAppsSyncRepository } from './user-apps-sync.repository';
import { AppsAnalyticsRepository } from './apps-analytics.repository';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  providers: [
    AppsRepository,
    UserAppsRepository,
    UserAppsOrderingRepository,
    UserAppsSyncRepository,
    AppsAnalyticsRepository,

    // Repository Interface Bindings
    {
      provide: 'IAppsRepository',
      useClass: AppsRepository,
    },
    {
      provide: 'IUserAppsRepository',
      useClass: UserAppsRepository,
    },
    {
      provide: 'IUserAppsOrderingRepository',
      useClass: UserAppsOrderingRepository,
    },
    {
      provide: 'IUserAppsSyncRepository',
      useClass: UserAppsSyncRepository,
    },
    {
      provide: 'IAppsAnalyticsRepository',
      useClass: AppsAnalyticsRepository,
    },
  ],
  exports: [
    // Export repository tokens
    'IAppsRepository',
    'IUserAppsRepository',
    'IUserAppsOrderingRepository',
    'IUserAppsSyncRepository',
    'IAppsAnalyticsRepository',

    // Export concrete implementations
    AppsRepository,
    UserAppsRepository,
    UserAppsOrderingRepository,
    UserAppsSyncRepository,
    AppsAnalyticsRepository,
  ],
})
export class RepositoriesModule {}