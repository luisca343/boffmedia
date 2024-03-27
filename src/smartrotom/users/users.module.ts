import { Module } from '@nestjs/common';
import { SmartRotomUsersService } from './users.service';
import { UsersController } from './users.controller';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { StarbankService } from '../starbank/starbank.service';

@Module({
  imports: [],
  controllers: [UsersController],
  providers: [SmartRotomUsersService, MySQL2Service, StarbankService],
  exports: [SmartRotomUsersService],
})
export class SmartRotomUsersModule {}
