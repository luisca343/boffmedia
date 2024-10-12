import { Module } from '@nestjs/common';
import { SmartRotomUsersService } from './users.service';
import { UsersController } from './users.controller';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { StarbankService } from '../starbank/starbank.service';
import { LoggerModule } from '@/logger/logger.module';
import { ResponseModule } from '@/response/response.module';

@Module({
  imports: [LoggerModule, ResponseModule],
  controllers: [UsersController],
  providers: [SmartRotomUsersService, MySQL2Service, StarbankService],
  exports: [SmartRotomUsersService],
})
export class SmartRotomUsersModule {}
