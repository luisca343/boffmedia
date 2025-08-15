import { Module } from '@nestjs/common';
import { FrasesCommand } from './frases';
import { CommandsService } from '@/discord/_commands/commands.service';

@Module({
  providers: [FrasesCommand, CommandsService],
  exports: [FrasesCommand],
})
export class FrasesModule {}