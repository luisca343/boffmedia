import { Injectable, UseInterceptors } from '@nestjs/common';
import { Context, Options, Subcommand } from 'necord';
import { ChatInputCommandInteraction } from 'discord.js';
import { MetaCommand } from './meta.group';
import { MetaTopDto } from './meta.dto';
import { MetaRegulationAutocompleteInterceptor } from './meta-regulation.interceptor';
import { VgcMetaFacadeService } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/meta.facade.service';
import { buildTopPages, buildNavRow, COLLECTOR_TTL_MS } from './meta-paginator';
import { PokemonUsageEntry } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/entities/pokemon-usage.entity';

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

    let entries: PokemonUsageEntry[];
    try {
      entries = reg.vgcPastesGid
        ? await this.metaFacade.getChampionsUsageList({ regulationId: regulation })
        : await this.metaFacade.getSmogonUsageList({ format: reg.formatId });
    } catch {
      await interaction.editReply(`No usage data available for **${reg.name}** yet.`);
      return;
    }

    if (!entries.length) {
      await interaction.editReply(`No usage data available for **${reg.name}** yet.`);
      return;
    }

    // Honour the optional `count` cap before building pages
    const slice  = count ? entries.slice(0, count) : entries;
    const source = reg.vgcPastesGid ? 'VGCPastes (Champions)' : 'Smogon Ladder';
    const pages  = buildTopPages(slice, reg.name, source);
    const iid    = interaction.id;
    let   page   = 0;

    const msg = await interaction.editReply({
      embeds:     [pages[page]],
      components: pages.length > 1 ? [buildNavRow(iid, page, pages.length)] : [],
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
