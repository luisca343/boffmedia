import { Module } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';
import { UsersModule } from '../../boffmedia/users/users.module';
import { SmartRotomUsersModule } from '../../smartrotom/users/users.module';
import { MySQL2Service } from '@/_utils/MySQL2Service';

@Module({
  imports: [UsersModule, SmartRotomUsersModule],
  controllers: [InvitesController],
  providers: [InvitesService, MySQL2Service],
})
export class InvitesModule {}
