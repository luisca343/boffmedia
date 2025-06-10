import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { StarbankModule } from '@api/smartrotom/starbank/starbank.module';
import { SmartRotomUsersModule } from '@api/smartrotom/users/users.module';

// Repository
import { BoffMediaUsersRepository } from '@repositories/boffmedia/users.repository';

// Services
import { BoffMediaUsersManagementService } from './services/users-management.service';
import { BoffMediaUsersFacadeService } from './users.facade.service';

// Controller
import { BoffMediaUsersController } from './users.controller';
import { PasswordModule } from '@api/auth/password.module';

@Module({
  imports: [
    LoggerModule,
    ResponseModule,
    DrizzleModule,
    StarbankModule,
    SmartRotomUsersModule,
    PasswordModule
  ],
  controllers: [BoffMediaUsersController],
  providers: [
    BoffMediaUsersRepository,
    BoffMediaUsersManagementService,
    BoffMediaUsersFacadeService,
  ],
  exports: [
    BoffMediaUsersFacadeService,
    BoffMediaUsersManagementService,
    BoffMediaUsersRepository,
  ],
})
export class BoffMediaUsersModule {}