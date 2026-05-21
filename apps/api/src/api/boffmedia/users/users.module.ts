import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { SmartRotomUsersModule } from '@api/smartrotom/users/users.module';

// Repository
import { BoffMediaUsersRepository } from './repositories/users.repository';
import { BOFFMEDIA_USERS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

// Services
import { BoffMediaUsersManagementService } from './services/users-management.service';
import { BoffMediaUsersFacadeService } from './users.facade.service';

// Controller
import { BoffMediaUsersController } from './users.controller';
import { StarbankModule } from '@api/smartrotom/starbank/starbank.module';
import { PasswordModule } from '@api/auth/password.module';

@Module({
  imports: [
    LoggerModule,
    ResponseModule,
    DrizzleModule,
    StarbankModule,
    SmartRotomUsersModule,
    PasswordModule,
  ],
  controllers: [BoffMediaUsersController],
  providers: [
    // Repository with dependency injection
    {
      provide: BOFFMEDIA_USERS_REPOSITORY_TOKEN,
      useClass: BoffMediaUsersRepository,
    },
    BoffMediaUsersRepository, // TODO: REMOVE THIS AFTER MIGRATION
    BoffMediaUsersManagementService,
    BoffMediaUsersFacadeService,
  ],
  exports: [
    BOFFMEDIA_USERS_REPOSITORY_TOKEN,
    BoffMediaUsersFacadeService,
    BoffMediaUsersManagementService,
    BoffMediaUsersRepository, // TODO: REMOVE THIS AFTER MIGRATION
  ],
})
export class BoffMediaUsersModule {}
