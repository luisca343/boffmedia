import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { WingullModule } from '../wingull/wingull.module';
import { StarbankModule } from '../starbank/starbank.module'; // Add this import
import { UsersRepository } from '@api/smartrotom/users/repositories/users.repository';
import { UsersManagementService } from './services/users-management.service';
import { UsersFacadeService } from './users.facade.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    LoggerModule, 
    ResponseModule, 
    DrizzleModule, 
    WingullModule,
    StarbankModule 
  ],
  controllers: [UsersController],
  providers: [
    UsersRepository,
    UsersManagementService,
    UsersFacadeService,
  ],
  exports: [
    UsersFacadeService,
  ],
})
export class SmartRotomUsersModule {}