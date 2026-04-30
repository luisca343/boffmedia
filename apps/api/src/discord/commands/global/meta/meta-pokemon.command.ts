import { Injectable, UseInterceptors } from '@nestjs/common';
import { Context, Options, Subcommand } from 'necord';
import { ChatInputCommandInteraction } from 'discord.js';
import { EmbedBuilder } from 'discord.js';
import { MetaCommand } from './meta.group';
import { MetaPokemonDto } from './meta.dto';
import { MetaRegulationAutocompleteInterceptor } from './meta-regulation.interceptor';
import { VgcMetaFacadeService } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/meta.facade.service';
import { typeColor, spriteUrl } from './meta.util';
import { PokemonUsageEntry } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/entities/pokemon-usage.entity';

@Injectable()
@MetaCommand()
export class MetaPokemonCommand {
  constructor(private readonly metaFacade: VgcMetaFacadeService) {}

  @UseInterceptors(MetaRegulationAutocompleteInterceptor)
  @Subcommand({ name: 'pokemon', description: 'Usage stats for a single Pokémon in the current meta' })
  public async onMetaPokemon(
    @Context() [interaction]: [ChatInputCommandInteraction],
    @Options() { regulation, pokemon }: MetaPokemonDto,
  ) {
    await interaction.deferReply();

    const reg = (await this.metaFacade.getRegulations()).find((r) => r.id === regulation);
    if (!reg) {
      await interaction.editReply(`Unknown regulation \`${regulation}\`.`);
      return;
    }

    let entries: PokemonUsageEntry[];
    try {
      if (reg.vgcPastesGid) {
        entries = await this.metaFacade.getChampionsUsageList({ regulationId: regulation });
      } else {
        entries = await this.metaFacade.getSmogonUsageList({ format: reg.formatId });
      }
    } catch {
      await interaction.editReply(`No usage data available for **${reg.name}** yet.`);
      return;
    }

    const query  = pokemon.toLowerCase();
    const entry  = entries.find(
      (e) => e.speciesName.toLowerCase() === query || e.speciesId.toLowerCase() === query,
    );

    if (!entry) {
      await interaction.editReply(`**${pokemon}** was not found in the **${reg.name}** usage list.`);
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(typeColor(entry.types))
      .setTitle(entry.speciesName)
      .setThumbnail(spriteUrl(entry.speciesName))
      .addFields(
        { name: 'Regulation', value: reg.name,                            inline: true  },
        { name: 'Rank',       value: `#${entry.rank}`,                    inline: true  },
        { name: 'Usage',      value: `${entry.usagePercent.toFixed(2)}%`, inline: true  },
        { name: 'Types',      value: entry.types.join(' / ') || '—',      inline: true  },
        ...(entry.topItem     ? [{ name: 'Top Item',      value: entry.topItem,     inline: true }] : []),
        ...(entry.topMove     ? [{ name: 'Top Move',      value: entry.topMove,     inline: true }] : []),
        ...(entry.topTeraType ? [{ name: 'Top Tera Type', value: entry.topTeraType, inline: true }] : []),
      )
      .setFooter({ text: reg.vgcPastesGid ? 'Source: VGCPastes (Champions)' : 'Source: Smogon Ladder' });

    await interaction.editReply({ embeds: [embed] });
  }
}
