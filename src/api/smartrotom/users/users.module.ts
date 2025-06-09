import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { WingullModule } from '../wingull/wingull.module';
import { UsersRepository } from '@repositories/smartrotom/users.repository';
import { UsersManagementService } from './services/users-management.service';
import { StarbankService } from '../starbank/starbank.service';
import { UsersFacadeService } from './users.facade.service';
import { UsersController } from './users.controller';

@Module({
  imports: [LoggerModule, ResponseModule, DrizzleModule, WingullModule],
  controllers: [UsersController],
  providers: [
    UsersRepository,
    UsersManagementService,
    StarbankService,
    UsersFacadeService,
  ],
  exports: [
    UsersFacadeService,
  ],
})
export class SmartRotomUsersModule {}