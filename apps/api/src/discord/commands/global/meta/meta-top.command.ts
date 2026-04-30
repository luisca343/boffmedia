import { Injectable, UseInterceptors } from '@nestjs/common';
import { Context, Options, Subcommand } from 'necord';
import { ChatInputCommandInteraction } from 'discord.js';
import { EmbedBuilder } from 'discord.js';
import { MetaCommand } from './meta.group';
import { MetaTopDto } from './meta.dto';
import { MetaRegulationAutocompleteInterceptor } from './meta-regulation.interceptor';
import { VgcMetaFacadeService } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/meta.facade.service';
import { typeColor } from './meta.util';
import { PokemonUsageEntry } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/entities/pokemon-usage.entity';

const TYPE_EMOJI: Record<string, string> = {
  normal:   '⬜', fire:     '🔥', water:    '💧', electric: '⚡',
  grass:    '🌿', ice:      '❄️', fighting: '🥊', poison:   '☠️',
  ground:   '🌍', flying:   '🌬️', psychic:  '🔮', bug:      '🐛',
  rock:     '🪨', ghost:    '👻', dragon:   '🐉', dark:     '🌑',
  steel:    '⚙️', fairy:    '🌸', stellar:  '✨',
};

function typeEmoji(types: string[]): string {
  return types.map((t) => TYPE_EMOJI[t.toLowerCase()] ?? t).join('');
}

@Injectable()
@MetaCommand()
export class MetaTopCommand {
  constructor(private readonly metaFacade: VgcMetaFacadeService) {}

  @UseInterceptors(MetaRegulationAutocompleteInterceptor)
  @Subcommand({ name: 'top', description: 'Top Pokémon by usage in the current meta' })
  public async onMetaTop(
    @Context() [interaction]: [ChatInputCommandInteraction],
    @Options() { regulation, count }: MetaTopDto,
  ) {
    await interaction.deferReply();

    const reg = (await this.metaFacade.getRegulations()).find((r) => r.id === regulation);
    if (!reg) {
      await interaction.editReply(`Unknown regulation \`${regulation}\`.`);
      return;
    }

    const n = count ?? 10;

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

    const top = entries.slice(0, n);
    if (!top.length) {
      await interaction.editReply(`No usage data available for **${reg.name}** yet.`);
      return;
    }

    const lines = top.map(
      (e) =>
        `\`#${String(e.rank).padStart(2, ' ')}\` ${typeEmoji(e.types)} **${e.speciesName}** — ${e.usagePercent.toFixed(2)}%`,
    );

    const source = reg.vgcPastesGid ? 'VGCPastes (Champions)' : 'Smogon Ladder';
    const embed  = new EmbedBuilder()
      .setColor(typeColor(top[0]?.types ?? []))
      .setTitle(`Top ${n} — ${reg.name}`)
      .setDescription(lines.join('\n'))
      .setFooter({ text: `Source: ${source}` });

    await interaction.editReply({ embeds: [embed] });
  }
}
