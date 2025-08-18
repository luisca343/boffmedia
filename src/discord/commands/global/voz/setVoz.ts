import { Injectable } from '@nestjs/common';
import { Context, SlashCommand, SlashCommandContext } from 'necord';
import { setVoice } from '@/discord/_util/audio';
import { CommandsService } from '@/discord/_commands/commands.service';

@Injectable()
export class SetVozCommand {
  constructor(private readonly service: CommandsService) {}

  @SlashCommand({
    name: 'setvoz',
    description: 'Cambiar la voz del bot',
    guilds: ['516237304101339156'],
  })
  public async onSetVoz(@Context() [interaction]: SlashCommandContext) {
    const voz = interaction.options.getInteger('voz');
    setVoice(this.service, interaction.user.id, voz);
    await interaction.reply('Voz cambiada');
  }
}
