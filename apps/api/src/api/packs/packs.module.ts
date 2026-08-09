import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { AuthModule } from '@api/auth/auth.module';
import { BoffMediaUsersModule } from '@api/boffmedia/users/users.module';
import { RandomizerPackLinkModule } from '@api/_repositories/randomizer/pack-link.repository';
import { LauncherAuthGuard } from './guards/launcher-auth.guard';
import { LauncherAuthController } from './launcher-auth.controller';
import { LauncherController } from './launcher.controller';
import { LauncherDeviceRepository } from './launcher-device.repository';
import { LauncherDeviceService } from './launcher-device.service';
import { PacksAuthService } from './packs-auth.service';
import { PacksCatalogService } from './packs-catalog.service';
import { PacksDownloadsService } from './packs-downloads.service';
import { PacksMetaService } from './packs-meta.service';
import { PacksController } from './packs.controller';
import { PacksRepository } from './packs.repository';
import { PacksService } from './packs.service';

@Module({
  imports: [
    DrizzleModule,
    // AuthModule for JwtAuthGuard/RolesGuard, and because it re-exports
    // JwtModule — registering a second one here would put two JwtService
    // providers in scope for the same secret.
    AuthModule,
    // Resolving the account a launcher session is minted for.
    BoffMediaUsersModule,
    // The one query that resolves a pack to its randomizer config.
    RandomizerPackLinkModule,
    // The CurseForge API/CDN proxy (§4.5).
    HttpModule,
  ],
  controllers: [PacksController, LauncherController, LauncherAuthController],
  providers: [
    PacksRepository,
    PacksService,
    PacksAuthService,
    LauncherDeviceRepository,
    LauncherDeviceService,
    PacksDownloadsService,
    PacksCatalogService,
    PacksMetaService,
    LauncherAuthGuard,
  ],
  exports: [
    PacksService,
    PacksDownloadsService,
    LauncherAuthGuard,
    PacksAuthService,
  ],
})
export class PacksModule {}
