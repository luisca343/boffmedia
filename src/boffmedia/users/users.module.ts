import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MySQL2Service } from '@/_utils/MySQL2Service';

@Module({
  imports: [],
  controllers: [UsersController],
  providers: [UsersService, MySQL2Service],
  exports: [UsersService],
})
export class UsersModule {}
