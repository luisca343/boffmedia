import { Injectable, UseInterceptors } from '@nestjs/common';
import { Context, Options, Subcommand } from 'necord';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { MetaCommand } from './meta.group';
import { MetaPokemonDto } from './meta.dto';
import { MetaVgcAutocompleteInterceptor } from './meta-vgc-autocomplete.interceptor';
import { MetaCacheService } from './meta-cache.service';
import { VgcMetaFacadeService } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/meta.facade.service';
import { typeColor, spriteUrl } from './meta.util';
import {
  DetailData,
  buildDetailPages,
  buildNavRow,
  COLLECTOR_TTL_MS,
} from './meta-paginator';
import { PokemonUsageEntry } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/entities/pokemon-usage.entity';

@Injectable()
@MetaCommand()
export class MetaPokemonCommand {
  constructor(
    private readonly metaFacade: VgcMetaFacadeService,
    private readonly cache: MetaCacheService,
  ) {}

  @UseInterceptors(MetaVgcAutocompleteInterceptor)
  @Subcommand({
    name: 'pokemon',
    description: 'Usage stats for a single Pokémon in the current meta',
  })
  public async onMetaPokemon(
    @Context() [interaction]: [ChatInputCommandInteraction],
    @Options() { regulation, pokemon }: MetaPokemonDto,
  ) {
    await interaction.deferReply();

    const reg = (await this.metaFacade.getRegulations()).find(
      (r) => r.id === regulation,
    );
    if (!reg) {
      await interaction.editReply(`Unknown regulation \`${regulation}\`.`);
      return;
    }

    const source = reg.vgcPastesGid
      ? 'VGCPastes (Champions)'
      : reg.formatId
        ? 'Smogon Ladder'
        : 'Limitless (Combined)';

    // ── Resolve usage list entry ─────────────────────────────────────────────
    let entries: PokemonUsageEntry[];
    try {
      entries = await this.cache.getOrFetch(
        `vgc:usage-entries:${regulation}`,
        () => this.metaFacade.getUnifiedUsageList(regulation),
      );
    } catch {
      await interaction.editReply(
        `No usage data available for **${reg.name}** yet.`,
      );
      return;
    }

    const query = pokemon.toLowerCase();
    const entry = entries.find(
      (e) =>
        e.speciesName.toLowerCase() === query ||
        e.speciesId.toLowerCase() === query,
    );

    if (!entry) {
      await interaction.editReply(
        `**${pokemon}** was not found in the **${reg.name}** usage list.`,
      );
      return;
    }

    // ── Resolve full detail ──────────────────────────────────────────────────
    let detailData: DetailData;
    try {
      const d = await this.cache.getOrFetch(
        `vgc:detail:${regulation}:${entry.speciesId}`,
        () => this.metaFacade.getUnifiedDetail(regulation, entry.speciesId),
      );
      detailData = {
        speciesName: d.speciesName,
        types: d.types,
        rank: d.rank,
        usagePercent: d.usagePercent,
        rawCount: d.rawCount,
        topItem: d.topItem,
        topMove: d.topMove,
        topTeraType: d.topTeraType,
        abilities: d.abilities,
        items: d.items,
        moves: d.moves,
        teraTypes: d.teraTypes,
        teammates: d.teammates ?? [],
        spreads: d.spreads,
      };
    } catch {
      const embed = buildFallbackEmbed(entry, reg.name, source);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // ── Paginated reply ──────────────────────────────────────────────────────
    const pages = buildDetailPages(detailData, reg.name, source);
    const iid = interaction.id;
    let page = 0;

    const msg = await interaction.editReply({
      embeds: [pages[page]],
      components: [buildNavRow(iid, page, pages.length)],
    });

    if (pages.length === 1) return;

    const collector = msg.createMessageComponentCollector({
      filter: (i) =>
        i.user.id === interaction.user.id &&
        (i.customId === `meta_${iid}_prev` ||
          i.customId === `meta_${iid}_next`),
      time: COLLECTOR_TTL_MS,
    });

    collector.on('collect', async (btn) => {
      page = btn.customId === `meta_${iid}_prev` ? page - 1 : page + 1;
      page = Math.max(0, Math.min(pages.length - 1, page));
      await btn.update({
        embeds: [pages[page]],
        components: [buildNavRow(iid, page, pages.length)],
      });
    });

    collector.on('end', () => {
      interaction.editReply({ components: [] }).catch(() => {});
    });
  }
}

function buildFallbackEmbed(
  entry: PokemonUsageEntry,
  regName: string,
  source: string,
) {
  return new EmbedBuilder()
    .setColor(typeColor(entry.types))
    .setTitle(entry.speciesName)
    .setThumbnail(spriteUrl(entry.speciesName))
    .addFields(
      { name: 'Regulation', value: regName, inline: true },
      { name: 'Rank', value: `#${entry.rank}`, inline: true },
      {
        name: 'Usage',
        value: `${entry.usagePercent.toFixed(2)}%`,
        inline: true,
      },
      { name: 'Types', value: entry.types.join(' / ') || '—', inline: true },
      ...(entry.topItem
        ? [{ name: 'Top Item', value: entry.topItem, inline: true }]
        : []),
      ...(entry.topMove
        ? [{ name: 'Top Move', value: entry.topMove, inline: true }]
        : []),
      ...(entry.topTeraType
        ? [{ name: 'Top Tera Type', value: entry.topTeraType, inline: true }]
        : []),
    )
    .setFooter({ text: `Source: ${source}` });
}
