import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersFacadeService } from './users.facade.service';
import { UsersService } from './services/users.service';
import { UsersRepository } from './repositories/users.repository';
import { ResponseService } from '@api/_utils/response/response.service';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { StarbankModule } from '../starbank/starbank.module';
import { USERS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { ChatappModule } from '../chatapp/chatapp.module';

@Module({
  imports: [LoggerModule, DrizzleModule, StarbankModule, ChatappModule],
  controllers: [UsersController],
  providers: [
    UsersFacadeService,
    UsersService,
    ResponseService,
    {
      provide: USERS_REPOSITORY_TOKEN,
      useClass: UsersRepository,
    },
  ],
  exports: [UsersFacadeService, UsersService],
})
export class SmartRotomUsersModule {}
