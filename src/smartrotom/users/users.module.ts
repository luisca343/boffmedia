import { Module } from '@nestjs/common';
import { SmartRotomUsersService } from './users.service';
import { UsersController } from './users.controller';
import { StarbankService } from '../starbank/starbank.service';
import { LoggerModule } from '@/logger/logger.module';
import { ResponseModule } from '@/response/response.module';
import { DrizzleModule } from '@/drizzle/drizzle.module';
import { WingullModule } from '../wingull/wingull.module';

@Module({
  imports: [LoggerModule, ResponseModule, DrizzleModule, WingullModule],
  controllers: [UsersController],
  providers: [SmartRotomUsersService, StarbankService],
  exports: [SmartRotomUsersService],
})
export class SmartRotomUsersModule {}
