import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { AppsController } from './apps.controller';
import { AppsFacadeService } from './apps.facade.service';
import { AppsService } from './services/apps.service';
import { UserAppsService } from './services/user-apps.service';
import { AppsRepository } from './repositories/apps.repository';

@Module({
  imports: [DrizzleModule],
  controllers: [AppsController],
  providers: [
    // Facade
    AppsFacadeService,
    
    // Domain Services
    AppsService,
    UserAppsService,
    
    // Infrastructure
    {
      provide: 'IAppsRepository',
      useClass: AppsRepository,
    },
  ],
  exports: [AppsFacadeService, AppsService, UserAppsService],
})
export class SmartRotomAppsModule {}