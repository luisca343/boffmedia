import { Module } from '@nestjs/common';
import { AuthModule } from '@api/auth/auth.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { PacksModule } from '@api/packs/packs.module';
import { ChangelogAdminController } from './changelog-admin.controller';
import { ChangelogController } from './changelog.controller';
import { ChangelogService } from './changelog.service';
import {
  ChangelogAuthGuard,
  OptionalChangelogAuthGuard,
} from './guards/changelog-auth.guard';
import { ChangelogRepository } from './repositories/changelog.repository';

@Module({
  imports: [DrizzleModule, AuthModule, PacksModule],
  controllers: [ChangelogController, ChangelogAdminController],
  providers: [
    ChangelogRepository,
    ChangelogService,
    ChangelogAuthGuard,
    OptionalChangelogAuthGuard,
  ],
})
export class ChangelogModule {}
