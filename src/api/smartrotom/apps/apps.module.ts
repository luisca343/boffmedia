import { Module } from '@nestjs/common';
import { AppsService } from './services/apps.service';
import { UserAppsService } from './services/user-apps.service';
import { RepositoriesModule } from './repositories/repositories.module';
import { AppsController } from './apps.controller';
import { AppsFacadeService } from './apps.facade.service';

@Module({
  imports: [RepositoriesModule],
  controllers: [AppsController],
  providers: [
    AppsFacadeService,
    
    AppsService,
    UserAppsService,
  ],
  exports: [
    AppsService,
    UserAppsService,
    RepositoriesModule,
  ],
})
export class SmartRotomAppsModule {}