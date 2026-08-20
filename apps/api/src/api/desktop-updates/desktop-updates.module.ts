import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { AuthModule } from '@api/auth/auth.module';
import { DesktopDownloadsController } from './desktop-downloads.controller';
import { DesktopUpdatesAdminController } from './desktop-updates-admin.controller';
import { DesktopUpdatesController } from './desktop-updates.controller';
import { DesktopUpdatesService } from './desktop-updates.service';
import { DesktopReleasesRepository } from './repositories/desktop-releases.repository';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [
    DesktopUpdatesController,
    DesktopDownloadsController,
    DesktopUpdatesAdminController,
  ],
  providers: [DesktopUpdatesService, DesktopReleasesRepository],
  exports: [DesktopUpdatesService],
})
export class DesktopUpdatesModule {}
