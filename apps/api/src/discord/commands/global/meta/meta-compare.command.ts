import { Injectable, UseInterceptors } from '@nestjs/common';
import { Context, Options, Subcommand } from 'necord';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { MetaCommand } from './meta.group';
import { MetaCompareDto } from './meta.dto';
import { MetaVgcAutocompleteInterceptor } from './meta-vgc-autocomplete.interceptor';
import { MetaCacheService } from './meta-cache.service';
import { VgcMetaFacadeService } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/meta.facade.service';
import { PokemonUsageDetail, PokemonUsageEntry } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/entities/pokemon-usage.entity';
import { typeColor, spriteUrl } from './meta.util';

function col(a: string | number | undefined, b: string | number | undefined): string {
  return `${a ?? '—'} · ${b ?? '—'}`;
}

@Injectable()
@MetaCommand()
export class MetaCompareCommand {
  constructor(
    private readonly metaFacade: VgcMetaFacadeService,
    private readonly cache: MetaCacheService,
  ) {}

  @UseInterceptors(MetaVgcAutocompleteInterceptor)
  @Subcommand({ name: 'compare', description: 'Compare two Pokémon side by side in the current meta' })
  public async onCompare(
    @Context() [interaction]: [ChatInputCommandInteraction],
    @Options() { regulation, pokemon, pokemon2 }: MetaCompareDto,
  ) {
    await interaction.deferReply();

    const reg = (await this.metaFacade.getRegulations()).find((r) => r.id === regulation);
    if (!reg) {
      await interaction.editReply(`Unknown regulation \`${regulation}\`.`);
      return;
    }

    const source = reg.vgcPastesGid ? 'VGCPastes (Champions)' : reg.formatId ? 'Smogon Ladder' : 'Limitless (Combined)';

    let entries: PokemonUsageEntry[];
    try {
      entries = await this.cache.getOrFetch(
        `vgc:usage-entries:${regulation}`,
        () => this.metaFacade.getUnifiedUsageList(regulation),
      );
    } catch {
      await interaction.editReply(`No usage data for **${reg.name}** yet.`);
      return;
    }

    const findEntry = (name: string) => {
      const q = name.toLowerCase();
      return entries.find((e) => e.speciesName.toLowerCase() === q || e.speciesId.toLowerCase() === q);
    };

    const entryA = findEntry(pokemon);
    const entryB = findEntry(pokemon2);

    if (!entryA || !entryB) {
      const missing = [!entryA && pokemon, !entryB && pokemon2].filter(Boolean);
      await interaction.editReply(
        `Not found in **${reg.name}**: ${(missing as string[]).map((n) => `**${n}**`).join(', ')}.`,
      );
      return;
    }

    const [detailA, detailB] = await Promise.all([
      this.cache.getOrFetch<PokemonUsageDetail>(
        `vgc:detail:${regulation}:${entryA.speciesId}`,
        () => this.metaFacade.getUnifiedDetail(regulation, entryA.speciesId),
      ).catch(() => null),
      this.cache.getOrFetch<PokemonUsageDetail>(
        `vgc:detail:${regulation}:${entryB.speciesId}`,
        () => this.metaFacade.getUnifiedDetail(regulation, entryB.speciesId),
      ).catch(() => null),
    ]);

    const topMove  = (d: PokemonUsageDetail | null, e: PokemonUsageEntry) => d?.moves[0]?.name      ?? e.topMove      ?? '—';
    const topItem  = (d: PokemonUsageDetail | null, e: PokemonUsageEntry) => d?.items[0]?.name      ?? e.topItem      ?? '—';
    const topTera  = (d: PokemonUsageDetail | null, e: PokemonUsageEntry) => d?.teraTypes[0]?.name  ?? e.topTeraType  ?? '—';
    const topTm    = (d: PokemonUsageDetail | null)                        => d?.teammates[0]?.name  ?? '—';

    const embed = new EmbedBuilder()
      .setColor(typeColor(entryA.types))
      .setThumbnail(spriteUrl(entryA.speciesName))
      .setTitle(`${entryA.speciesName}  vs  ${entryB.speciesName}`)
      .addFields(
        { name: 'Rank',         value: col(`#${entryA.rank}`,                    `#${entryB.rank}`),                    inline: false },
        { name: 'Usage',        value: col(`${entryA.usagePercent.toFixed(2)}%`, `${entryB.usagePercent.toFixed(2)}%`), inline: false },
        { name: 'Types',        value: col(entryA.types.join('/') || '—',        entryB.types.join('/') || '—'),         inline: false },
        { name: 'Top Move',     value: col(topMove(detailA, entryA),             topMove(detailB, entryB)),              inline: false },
        { name: 'Top Item',     value: col(topItem(detailA, entryA),             topItem(detailB, entryB)),              inline: false },
        { name: 'Top Tera',     value: col(topTera(detailA, entryA),             topTera(detailB, entryB)),              inline: false },
        { name: 'Top Teammate', value: col(topTm(detailA),                       topTm(detailB)),                        inline: false },
      )
      .setFooter({ text: `Source: ${source}  ·  Format: ${entryA.speciesName} · ${entryB.speciesName}` });

    await interaction.editReply({ embeds: [embed] });
  }
}
