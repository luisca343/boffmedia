import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmartrotomUser } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SmartrotomUser])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class SmartRotomUsersModule {}
