import { Module } from '@nestjs/common';
import { CommandsController } from './commands.controller';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { CommandsService } from './commands.service';

@Module({
  controllers: [CommandsController],
  providers: [MySQL2Service, CommandsService],
  exports: [CommandsService],
})
export class CommandsModule {}
