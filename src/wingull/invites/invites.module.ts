import { Module } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invite } from './entities/invite.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Invite])],
  controllers: [InvitesController],
  providers: [InvitesService],
})
export class InvitesModule {}
