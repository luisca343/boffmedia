import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { AuthModule } from '@api/auth/auth.module';
import { BoffMediaUsersModule } from '@api/boffmedia/users/users.module';
import { RandomizerPackLinkModule } from '@api/_repositories/randomizer/pack-link.repository';
import { UploadModule } from '@api/boffmedia/util/upload/upload.module';
import { DesktopAdminGuard } from './guards/desktop-admin.guard';
import { DesktopAuthGuard } from './guards/desktop-auth.guard';
import { DesktopOrUserAuthGuard } from './guards/desktop-or-user-auth.guard';
import { DesktopAuthController } from './desktop-auth.controller';
import { LauncherController } from './launcher.controller';
import { DesktopDeviceRepository } from './desktop-device.repository';
import { DesktopDeviceService } from './desktop-device.service';
import { PacksAuthService } from './packs-auth.service';
import { PacksCatalogService } from './packs-catalog.service';
import { PacksDownloadsService } from './packs-downloads.service';
import { PacksMetaService } from './packs-meta.service';
import { PacksController } from './packs.controller';
import { PacksDesktopController } from './packs-desktop.controller';
import { PacksRepository } from './packs.repository';
import { PacksService } from './packs.service';
import { AuditService } from '@api/_repositories/audit.service';

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
    // The CurseForge API/CDN proxy.
    HttpModule,
    // D2: publishing from the app uploads the pack icon and gallery through the
    // SAME image pipeline the web /upload/image route uses, rather than a second
    // one that would drift from its type allowlist and size ceiling.
    UploadModule,
  ],
  controllers: [
    PacksController,
    PacksDesktopController,
    LauncherController,
    DesktopAuthController,
  ],
  providers: [
    // Unified audit service across all domains
    AuditService,

    PacksRepository,
    PacksService,
    PacksAuthService,
    DesktopDeviceRepository,
    DesktopDeviceService,
    PacksDownloadsService,
    PacksCatalogService,
    PacksMetaService,
    DesktopAuthGuard,
    // Composes on DesktopAuthGuard, so both are providers here.
    DesktopAdminGuard,
    // Tool routes the app writes to accept either credential.
    DesktopOrUserAuthGuard,
  ],
  exports: [
    PacksService,
    PacksDownloadsService,
    DesktopAuthGuard,
    DesktopOrUserAuthGuard,
    // A guard named in another module's @UseGuards() is instantiated in THAT
    // module's injector, so every dependency it has must be exported from here
    // too — exporting the guard alone is not enough. These two are the guard's
    // constructor, not an invitation to use the repository elsewhere:
    // RandomizerModule pulls in DesktopAuthGuard and would otherwise fail to
    // boot with "PacksRepository is not available in the RandomizerModule".
    PacksAuthService,
    PacksRepository,
  ],
})
export class PacksModule {}
