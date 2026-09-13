import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { AuthModule } from '@api/auth/auth.module';
import { ReleasesAdminController } from './releases-admin.controller';
import { ReleaseDeploymentController } from './release-deployment.controller';
import { ReleasesController } from './releases.controller';
import { ReleaseDeploymentGuard } from './release-deployment.guard';
import { ReleasesService } from './releases.service';
import { ReleasesRepository } from './repositories/releases.repository';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [
    ReleasesController,
    ReleasesAdminController,
    ReleaseDeploymentController,
  ],
  providers: [ReleasesService, ReleasesRepository, ReleaseDeploymentGuard],
  exports: [ReleasesService, ReleaseDeploymentGuard],
})
export class ReleasesModule {}
