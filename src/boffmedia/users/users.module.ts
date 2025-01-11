import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SmartRotomUsersService } from '@/smartrotom/users/users.service';
import { DrizzleModule } from '@/drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [UsersController],
  providers: [UsersService, SmartRotomUsersService],
  exports: [UsersService],
})
export class UsersModule {}
