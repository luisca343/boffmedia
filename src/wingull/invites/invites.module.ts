import { Module } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invite } from './entities/invite.entity';
import { UsersModule } from 'src/boffmedia/users/users.module';
import { SmartRotomUsersModule } from 'src/smartrotom/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Invite]), UsersModule, SmartRotomUsersModule],
  controllers: [InvitesController],
  providers: [InvitesService],
})
export class InvitesModule {}
