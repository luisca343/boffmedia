import { Injectable, UseInterceptors } from '@nestjs/common';
import { Context, Options, SlashCommand, SlashCommandContext } from 'necord';
import { setVoice } from '@/discord/_util/audio';
import { CommandsService } from '@/discord/_commands/commands.service';
import { SetVozDto } from './setVoz.dto';
import { SetVozAutocompleteInterceptor } from './setVoz.interceptor';

@Injectable()
export class SetVozCommand {
  constructor(private readonly service: CommandsService) {}

  @UseInterceptors(SetVozAutocompleteInterceptor)
  @SlashCommand({
    name: 'setvoz',
    description: 'Cambiar la voz del bot',
    guilds: ['516237304101339156'],
  })
  public async onSetVoz(
    @Context() [interaction]: SlashCommandContext,
    @Options() { voz }: SetVozDto,
  ) {
    setVoice(this.service, interaction.user.id, voz);
    await interaction.reply('Voz cambiada');
  }
}
