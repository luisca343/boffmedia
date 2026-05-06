import { Injectable } from '@nestjs/common';
import { Context, Subcommand } from 'necord';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { MetaCommand } from './meta.group';
import { VgcMetaFacadeService } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/meta.facade.service';

@Injectable()
@MetaCommand()
export class MetaRegulationsCommand {
  constructor(private readonly metaFacade: VgcMetaFacadeService) {}

  @Subcommand({ name: 'regulations', description: 'List all available VGC regulations' })
  public async onRegulations(
    @Context() [interaction]: [ChatInputCommandInteraction],
  ) {
    await interaction.deferReply();

    const regulations = await this.metaFacade.getRegulations();

    if (!regulations.length) {
      await interaction.editReply('No regulations are currently configured.');
      return;
    }

    const lines = regulations.map((r) => {
      const source = r.vgcPastesGid ? '🔵 Champions' : '🟢 Smogon';
      return `${source} **${r.name}** \`${r.id}\``;
    });

    const embed = new EmbedBuilder()
      .setColor(0x7289da)
      .setTitle('Active VGC Regulations')
      .setDescription(lines.join('\n'))
      .setFooter({ text: '🟢 Smogon Ladder  ·  🔵 VGCPastes (Champions)' });

    await interaction.editReply({ embeds: [embed] });
  }
}
