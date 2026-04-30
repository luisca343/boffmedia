import { Injectable, UseInterceptors } from '@nestjs/common';
import { Context, Options, Subcommand } from 'necord';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { MetaCommand } from './meta.group';
import { MetaPokemonDto } from './meta.dto';
import { MetaRegulationAutocompleteInterceptor } from './meta-regulation.interceptor';
import { VgcMetaFacadeService } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/meta.facade.service';
import { typeColor, spriteUrl } from './meta.util';
import { DetailData, buildDetailPages, buildNavRow, COLLECTOR_TTL_MS } from './meta-paginator';
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

    // ── Resolve usage list entry ─────────────────────────────────────────────
    let entries: PokemonUsageEntry[];
    try {
      entries = reg.vgcPastesGid
        ? await this.metaFacade.getChampionsUsageList({ regulationId: regulation })
        : await this.metaFacade.getSmogonUsageList({ format: reg.formatId });
    } catch {
      await interaction.editReply(`No usage data available for **${reg.name}** yet.`);
      return;
    }

    const query = pokemon.toLowerCase();
    const entry = entries.find(
      (e) => e.speciesName.toLowerCase() === query || e.speciesId.toLowerCase() === query,
    );

    if (!entry) {
      await interaction.editReply(`**${pokemon}** was not found in the **${reg.name}** usage list.`);
      return;
    }

    // ── Resolve full detail ──────────────────────────────────────────────────
    let detailData: DetailData;
    const source = reg.vgcPastesGid ? 'VGCPastes (Champions)' : 'Smogon Ladder';

    try {
      if (reg.vgcPastesGid) {
        const pd = await this.metaFacade.getChampionsPasteDetail(regulation, entry.speciesId);
        detailData = {
          speciesName:  entry.speciesName,
          types:        entry.types,
          rank:         entry.rank,
          usagePercent: entry.usagePercent,
          rawCount:     entry.rawCount,
          topItem:      entry.topItem,
          topMove:      entry.topMove,
          topTeraType:  entry.topTeraType,
          abilities:    pd.abilities,
          items:        pd.items,
          moves:        pd.moves,
          teraTypes:    pd.teraTypes,
          spreads:      pd.spreads,
        };
      } else {
        const sd = await this.metaFacade.getSmogonDetail({ format: reg.formatId, speciesId: entry.speciesId });
        detailData = {
          speciesName:  sd.speciesName,
          types:        sd.types,
          rank:         sd.rank,
          usagePercent: sd.usagePercent,
          rawCount:     sd.rawCount,
          topItem:      sd.topItem,
          topMove:      sd.topMove,
          topTeraType:  sd.topTeraType,
          abilities:    sd.abilities,
          items:        sd.items,
          moves:        sd.moves,
          teraTypes:    sd.teraTypes,
          spreads:      sd.spreads,
        };
      }
    } catch {
      // Fallback: show a simple overview-only embed when detail fetch fails
      const embed = buildFallbackEmbed(entry, reg.name, source);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // ── Paginated reply ──────────────────────────────────────────────────────
    const pages = buildDetailPages(detailData, reg.name, source);
    const iid   = interaction.id;
    let   page  = 0;

    const msg = await interaction.editReply({
      embeds:     [pages[page]],
      components: [buildNavRow(iid, page, pages.length)],
    });

    if (pages.length === 1) return;

    const collector = msg.createMessageComponentCollector({
      filter: (i) =>
        i.user.id === interaction.user.id &&
        (i.customId === `meta_${iid}_prev` || i.customId === `meta_${iid}_next`),
      time: COLLECTOR_TTL_MS,
    });

    collector.on('collect', async (btn) => {
      page = btn.customId === `meta_${iid}_prev` ? page - 1 : page + 1;
      page = Math.max(0, Math.min(pages.length - 1, page));
      await btn.update({
        embeds:     [pages[page]],
        components: [buildNavRow(iid, page, pages.length)],
      });
    });

    collector.on('end', () => {
      interaction.editReply({ components: [] }).catch(() => {});
    });
  }
}

function buildFallbackEmbed(entry: PokemonUsageEntry, regName: string, source: string) {
  return new EmbedBuilder()
    .setColor(typeColor(entry.types))
    .setTitle(entry.speciesName)
    .setThumbnail(spriteUrl(entry.speciesName))
    .addFields(
      { name: 'Regulation', value: regName,                            inline: true },
      { name: 'Rank',       value: `#${entry.rank}`,                   inline: true },
      { name: 'Usage',      value: `${entry.usagePercent.toFixed(2)}%`, inline: true },
      { name: 'Types',      value: entry.types.join(' / ') || '—',     inline: true },
      ...(entry.topItem     ? [{ name: 'Top Item',      value: entry.topItem,     inline: true }] : []),
      ...(entry.topMove     ? [{ name: 'Top Move',      value: entry.topMove,     inline: true }] : []),
      ...(entry.topTeraType ? [{ name: 'Top Tera Type', value: entry.topTeraType, inline: true }] : []),
    )
    .setFooter({ text: `Source: ${source}` });
}
