import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { SmartRotomUsersModule } from '@api/smartrotom/users/users.module';

// Import repository
import { InvitesRepository } from '@repositories/boffmedia/invites.repository';

// Import domain services
import { InviteManagementService } from './services/invite-management.service';
import { RegistrationService } from './services/registration.service';

// Import facade service
import { InvitesFacadeService } from './invites.facade.service';

// Import controller
import { InvitesController } from './invites.controller';
import { BoffMediaUsersModule } from '@api/boffmedia/users/users.module';

@Module({
  imports: [
    LoggerModule,
    ResponseModule,
    DrizzleModule,
    BoffMediaUsersModule,
    SmartRotomUsersModule,
  ],
  controllers: [InvitesController],
  providers: [
    // Repository
    InvitesRepository,

    // Domain services
    InviteManagementService,
    RegistrationService,

    // Facade service
    InvitesFacadeService,
  ],
  exports: [InvitesFacadeService],
})
export class InvitesModule {}
