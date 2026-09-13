import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { AuthModule } from '@api/auth/auth.module';
import { ReleasesModule } from '@api/boffmedia/releases/releases.module';
import { DesktopReleaseAutomationController } from './desktop-release-automation.controller';
import { DesktopDownloadsController } from './desktop-downloads.controller';
import { DesktopUpdatesAdminController } from './desktop-updates-admin.controller';
import { DesktopUpdatesController } from './desktop-updates.controller';
import { DesktopUpdatesService } from './desktop-updates.service';
import { DesktopReleasesRepository } from './repositories/desktop-releases.repository';

@Module({
  imports: [DrizzleModule, AuthModule, ReleasesModule],
  controllers: [
    DesktopUpdatesController,
    DesktopDownloadsController,
    DesktopUpdatesAdminController,
    DesktopReleaseAutomationController,
  ],
  providers: [DesktopUpdatesService, DesktopReleasesRepository],
  exports: [DesktopUpdatesService],
})
export class DesktopUpdatesModule {}
