import { Global, Module } from '@nestjs/common';
import { DiscordController } from './discord.controller';
import { DiscordService } from './discord.service';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { ConfigModule } from '@nestjs/config';
import { CommandsModule } from '../_commands/commands.module';

@Global()
@Module({
  controllers: [DiscordController],
  providers: [MySQL2Service],
  imports: [CommandsModule]
})
export class DiscordModule {}
