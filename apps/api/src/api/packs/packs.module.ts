import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { AuthModule } from '@api/auth/auth.module';
import { LauncherAuthGuard } from './guards/launcher-auth.guard';
import { LauncherController } from './launcher.controller';
import { PacksAuthService } from './packs-auth.service';
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
    // Mojang's sessionserver — the hasJoined call in §7.2.
    HttpModule,
  ],
  controllers: [PacksController, LauncherController],
  providers: [PacksRepository, PacksService, PacksAuthService, LauncherAuthGuard],
  exports: [PacksService],
})
export class PacksModule {}
