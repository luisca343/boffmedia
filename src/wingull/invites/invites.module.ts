import { Module } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { UsersModule } from '@api/boffmedia/users/users.module';
import { SmartRotomUsersModule } from '@api/smartrotom/users/users.module';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { InvitesController } from '@api/wingull/invites/invites.controller';

@Module({
  imports: [UsersModule, SmartRotomUsersModule],
  controllers: [InvitesController],
  providers: [InvitesService, MySQL2Service],
})
export class InvitesModule {}
