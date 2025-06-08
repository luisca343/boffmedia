import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SmartRotomUsersService } from '@api/smartrotom/users/users.service';
import { DrizzleModule } from '@/drizzle/drizzle.module';
import { StarbankModule } from '@api/smartrotom/starbank/starbank.module';

@Module({
  imports: [DrizzleModule, StarbankModule],
  controllers: [UsersController],
  providers: [UsersService, SmartRotomUsersService],
  exports: [UsersService],
})
export class UsersModule {}