import { Module } from '@nestjs/common';
import { CommandsController } from './commands.controller';
import { MySQL2Service } from '@/_utils/MySQL2Service';

@Module({
  controllers: [CommandsController],
  providers: [MySQL2Service]
})
export class CommandsModule {}
