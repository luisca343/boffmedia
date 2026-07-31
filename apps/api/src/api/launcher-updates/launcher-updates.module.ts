import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { AuthModule } from '@api/auth/auth.module';
import { LauncherUpdatesAdminController } from './launcher-updates-admin.controller';
import { LauncherUpdatesController } from './launcher-updates.controller';
import { LauncherUpdatesService } from './launcher-updates.service';
import { LauncherReleasesRepository } from './repositories/launcher-releases.repository';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [LauncherUpdatesController, LauncherUpdatesAdminController],
  providers: [LauncherUpdatesService, LauncherReleasesRepository],
  exports: [LauncherUpdatesService],
})
export class LauncherUpdatesModule {}
