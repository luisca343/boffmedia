import { Injectable, UseInterceptors } from '@nestjs/common';
import { Context, Options, Subcommand } from 'necord';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { MetaCommand } from './meta.group';
import { MetaSpeedDto } from './meta.dto';
import { MetaVgcAutocompleteInterceptor } from './meta-vgc-autocomplete.interceptor';
import { MetaCacheService } from './meta-cache.service';
import { VgcMetaFacadeService } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/meta.facade.service';
import { PokemonUsageDetail } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/entities/pokemon-usage.entity';
import { buildNavRow, COLLECTOR_TTL_MS } from './meta-paginator';
import { typeColor, typeEmoji } from './meta.util';

// ── Speed calc (level 50, 31 IVs) ────────────────────────────────────────────

const SPEED_PLUS  = new Set(['jolly', 'timid', 'hasty', 'naive']);
const SPEED_MINUS = new Set(['brave', 'quiet', 'relaxed', 'sassy']);

function calcSpe(baseSpe: number, evSpe: number, nature: string): number {
  const lower = nature.toLowerCase();
  const mod   = SPEED_PLUS.has(lower) ? 1.1 : SPEED_MINUS.has(lower) ? 0.9 : 1.0;
  return Math.floor(
    (Math.floor((2 * baseSpe + 31 + Math.floor(evSpe / 4)) * 50 / 100) + 5) * mod,
  );
}

function parseEvSpe(spread?: string): number {
  if (!spread) return 0;
  return parseInt(spread.split('/')[5] ?? '0', 10) || 0;
}

function fmtSpeDetail(baseSpe: number, evSpe: number, nature: string, isFallback: boolean): string {
  const lower  = nature.toLowerCase();
  const isPlus = SPEED_PLUS.has(lower);
  let inner    = `${baseSpe} base`;
  if (evSpe > 0 && isPlus)  inner += ` · ${evSpe}+ ${nature}`;
  else if (evSpe > 0)       inner += ` · ${evSpe} EVs`;
  else if (isPlus)          inner += ` · +${nature}`;
  if (isFallback) inner += ' ≈';
  return `*(${inner})*`;
}

interface SpeedRow {
  speciesId:  string;
  rank:       number;
  name:       string;
  types:      string[];
  baseSpe:    number;
  metaSpe:    number;
  nature:     string;
  evSpe:      number;
  isFallback: boolean;
}

// ── Pagination ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

function buildSpeedPages(
  rows:        SpeedRow[],
  highlightId: string | undefined,
  regName:     string,
  source:      string,
): EmbedBuilder[] {
  const total = Math.ceil(rows.length / PAGE_SIZE);
  const color = typeColor(rows[0]?.types ?? ['normal']);

  return Array.from({ length: total }, (_, i) => {
    const slice = rows.slice(i * PAGE_SIZE, (i + 1) * PAGE_SIZE);
    const lines = slice.map((row, localIdx) => {
      const globalIdx  = i * PAGE_SIZE + localIdx;
      const isHighlight = row.speciesId === highlightId;
      const prefix      = isHighlight ? '→' : `\`#${String(globalIdx + 1).padStart(2)}\``;
      return `${prefix} ${typeEmoji(row.types)} **${row.name}** — **${row.metaSpe}** ${fmtSpeDetail(row.baseSpe, row.evSpe, row.nature, row.isFallback)}`;
    });

    return new EmbedBuilder()
      .setColor(color)
      .setTitle(`Speed Tiers — ${regName}`)
      .setDescription(lines.join('\n'))
      .setFooter({
        text: `Source: ${source}  ·  ${i + 1}/${total}  ·  TW ×2  ·  Scarf ×1.5  ·  TR reverses  ·  ≈ est.`,
      });
  });
}

// ── Command ───────────────────────────────────────────────────────────────────

@Injectable()
@MetaCommand()
export class MetaSpeedCommand {
  constructor(
    private readonly metaFacade: VgcMetaFacadeService,
    private readonly cache: MetaCacheService,
  ) {}

  @UseInterceptors(MetaVgcAutocompleteInterceptor)
  @Subcommand({ name: 'speed', description: 'Full paginated speed tier table for a regulation' })
  public async onSpeed(
    @Context() [interaction]: [ChatInputCommandInteraction],
    @Options() { regulation, compare }: MetaSpeedDto,
  ) {
    await interaction.deferReply();

    const reg = (await this.metaFacade.getRegulations()).find((r) => r.id === regulation);
    if (!reg) {
      await interaction.editReply(`Unknown regulation \`${regulation}\`.`);
      return;
    }

    const source = reg.vgcPastesGid ? 'VGCPastes' : reg.formatId ? 'Smogon Ladder' : 'Limitless';

    // ── Fetch all details at once ─────────────────────────────────────────────
    let allDetails: PokemonUsageDetail[];
    try {
      allDetails = await this.cache.getOrFetch(
        `vgc:detail-list:${regulation}`,
        () => this.metaFacade.getUnifiedUsageDetailList(regulation),
      );
    } catch {
      await interaction.editReply(`No usage data available for **${reg.name}** yet.`);
      return;
    }

    // ── Resolve compare entry ─────────────────────────────────────────────────
    let compareSpeciesId: string | undefined;
    if (compare) {
      const q     = compare.toLowerCase();
      const match = allDetails.find(
        (d) => d.speciesName.toLowerCase() === q || d.speciesId.toLowerCase() === q,
      );
      if (!match) {
        await interaction.editReply(`**${compare}** not found in **${reg.name}** usage data.`);
        return;
      }
      compareSpeciesId = match.speciesId;
    }

    // ── Build and sort speed rows ─────────────────────────────────────────────
    const rows: SpeedRow[] = allDetails
      .filter((d) => d.baseStats.spe > 0)
      .map((d) => {
        const top        = d.spreads?.[0];
        const isFallback = !top?.spread;
        const nature     = top?.nature ?? 'Hardy';
        const evSpe      = parseEvSpe(top?.spread);
        const metaSpe    = calcSpe(d.baseStats.spe, evSpe, nature);
        return { speciesId: d.speciesId, rank: d.rank, name: d.speciesName, types: d.types, baseSpe: d.baseStats.spe, metaSpe, nature, evSpe, isFallback };
      });

    rows.sort((a, b) => b.metaSpe - a.metaSpe || a.rank - b.rank);

    if (rows.length === 0) {
      await interaction.editReply(`No speed data available for **${reg.name}**.`);
      return;
    }

    // ── Build pages and start on compare's page ───────────────────────────────
    const pages = buildSpeedPages(rows, compareSpeciesId, reg.name, source);

    let startPage = 0;
    if (compareSpeciesId) {
      const idx = rows.findIndex((r) => r.speciesId === compareSpeciesId);
      if (idx >= 0) startPage = Math.floor(idx / PAGE_SIZE);
    }

    const iid  = interaction.id;
    let   page = startPage;

    const msg = await interaction.editReply({
      embeds:     [pages[page]],
      components: pages.length > 1 ? [buildNavRow(iid, page, pages.length)] : [],
    });

    if (pages.length <= 1) return;

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
