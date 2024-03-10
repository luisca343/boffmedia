import { Module } from '@nestjs/common';
import { SmartRotomUsersService } from './users.service';
import { UsersController } from './users.controller';
import { MySQL2Service } from '@/MySQL2Service';

@Module({
  imports: [],
  controllers: [UsersController],
  providers: [SmartRotomUsersService, MySQL2Service],
  exports: [SmartRotomUsersService],
})
export class SmartRotomUsersModule {}
