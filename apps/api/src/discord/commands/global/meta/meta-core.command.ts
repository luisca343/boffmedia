import { Injectable, UseInterceptors } from '@nestjs/common';
import { Context, Options, Subcommand } from 'necord';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { MetaCommand } from './meta.group';
import { MetaCoreDto } from './meta.dto';
import { MetaRegulationAutocompleteInterceptor } from './meta-regulation.interceptor';
import { MetaCacheService } from './meta-cache.service';
import { VgcMetaFacadeService } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/meta.facade.service';
import { PokemonUsageDetail } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/entities/pokemon-usage.entity';
import { typeColor } from './meta.util';

const POOL_SIZE = 30;

interface Core {
  a:     PokemonUsageDetail;
  b:     PokemonUsageDetail;
  score: number;
}

function coreTier(score: number): string {
  if (score >= 35) return '🔑';
  if (score >= 20) return '💪';
  return '⚡';
}

function findTopCores(pool: PokemonUsageDetail[]): Core[] {
  const index = new Map(pool.map((d) => [d.speciesName.toLowerCase(), d]));
  const seen  = new Set<string>();
  const cores: Core[] = [];

  for (const a of pool) {
    for (const tm of (a.teammates ?? []).slice(0, 10)) {
      const b = index.get(tm.name.toLowerCase());
      if (!b) continue;

      const key = [a.speciesName, b.speciesName].sort().join(':');
      if (seen.has(key)) continue;
      seen.add(key);

      const reverseLink = b.teammates?.find(
        (t) => t.name.toLowerCase() === a.speciesName.toLowerCase(),
      );
      if (!reverseLink) continue;

      cores.push({ a, b, score: (tm.percent + reverseLink.percent) / 2 });
    }
  }

  return cores.sort((x, y) => y.score - x.score);
}

@Injectable()
@MetaCommand()
export class MetaCoreCommand {
  constructor(
    private readonly metaFacade: VgcMetaFacadeService,
    private readonly cache: MetaCacheService,
  ) {}

  @UseInterceptors(MetaRegulationAutocompleteInterceptor)
  @Subcommand({ name: 'core', description: 'Discover top Pokémon synergy pairs in the current meta' })
  public async onCore(
    @Context() [interaction]: [ChatInputCommandInteraction],
    @Options() { regulation }: MetaCoreDto,
  ) {
    await interaction.deferReply();

    const reg = (await this.metaFacade.getRegulations()).find((r) => r.id === regulation);
    if (!reg) {
      await interaction.editReply(`Unknown regulation \`${regulation}\`.`);
      return;
    }

    const source = reg.vgcPastesGid ? 'VGCPastes (Champions)' : reg.formatId ? 'Smogon Ladder' : 'Limitless (Combined)';

    let details: PokemonUsageDetail[];
    try {
      details = await this.cache.getOrFetch(
        `vgc:usage-detail:${regulation}`,
        () => this.metaFacade.getUnifiedUsageDetailList(regulation),
      );
    } catch {
      await interaction.editReply(`No usage data available for **${reg.name}** yet.`);
      return;
    }

    const pool    = details.slice(0, POOL_SIZE);
    const topCores = findTopCores(pool).slice(0, 5);

    if (!topCores.length) {
      await interaction.editReply(`Not enough teammate data to compute cores for **${reg.name}**.`);
      return;
    }

    const lines = topCores.map((c, i) => {
      const tier = coreTier(c.score);
      return `\`#${i + 1}\` ${tier} **${c.a.speciesName}** + **${c.b.speciesName}** — ${c.score.toFixed(1)}% mutual`;
    });

    const embed = new EmbedBuilder()
      .setColor(typeColor(pool[0]?.types ?? []))
      .setTitle(`Top Synergy Cores — ${reg.name}`)
      .setDescription(lines.join('\n'))
      .addFields(
        { name: 'Regulation', value: reg.name, inline: true },
        { name: 'Source',     value: source,   inline: true },
      )
      .setFooter({ text: 'Score = average mutual teammate %  ·  🔑 ≥35%  💪 ≥20%  ⚡ others' });

    await interaction.editReply({ embeds: [embed] });
  }
}
