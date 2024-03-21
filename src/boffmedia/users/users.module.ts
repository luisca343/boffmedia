import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { SmartRotomUsersService } from '@/smartrotom/users/users.service';

@Module({
  imports: [],
  controllers: [UsersController],
  providers: [UsersService, MySQL2Service, SmartRotomUsersService],
  exports: [UsersService],
})
export class UsersModule {}
