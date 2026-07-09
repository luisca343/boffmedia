import { Module } from '@nestjs/common';
import { MySQL2Module } from '@/_utils/MySQL2.module';
import { CommandsService } from './commands.service';

@Module({
  imports: [MySQL2Module],
  providers: [CommandsService],
  exports: [CommandsService],
})
export class CommandsModule {}
