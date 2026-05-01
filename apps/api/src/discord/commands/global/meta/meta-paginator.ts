import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { PokemonUsageEntry } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/entities/pokemon-usage.entity';
import { typeColor, spriteUrl, typeEmoji } from './meta.util';

export interface DetailData {
  speciesName:  string;
  types:        string[];
  rank:         number;
  usagePercent: number;
  rawCount:     number;
  topItem?:     string;
  topMove?:     string;
  topTeraType?: string;
  abilities:    Array<{ name: string; percent: number }>;
  items:        Array<{ name: string; percent: number }>;
  moves:        Array<{ name: string; percent: number }>;
  teraTypes:    Array<{ name: string; percent: number }>;
  teammates:    Array<{ name: string; percent: number }>;
  spreads:      Array<{ nature: string; spread: string; percent: number }>;
}

const COLLECTOR_TTL_MS = 3 * 60 * 1000; // 3 minutes

/** Builds a 3-button nav row (◀ · page/total · ▶). All IDs are scoped to `iid`. */
export function buildNavRow(
  iid:   string,
  page:  number,
  total: number,
): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`meta_${iid}_prev`)
      .setLabel('◀')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`meta_${iid}_info`)
      .setLabel(`${page + 1} / ${total}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`meta_${iid}_next`)
      .setLabel('▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === total - 1),
  );
}

function pct(n: number) { return `${n.toFixed(1)}%`; }

function fmtList(arr: Array<{ name: string; percent: number }>, limit = 5): string {
  if (!arr?.length) return '—';
  return arr.slice(0, limit).map((e) => `**${e.name}** ${pct(e.percent)}`).join('\n');
}

function fmtSpreads(arr: Array<{ nature: string; spread: string; percent: number }>, limit = 5): string {
  if (!arr?.length) return '—';
  return arr.slice(0, limit).map((e) => `**${e.nature}** \`${e.spread}\` ${pct(e.percent)}`).join('\n');
}

function fmtTeammates(arr: Array<{ name: string; percent: number }>, limit = 3): string {
  if (!arr?.length) return '—';
  return arr.slice(0, limit).map((e) => `**${e.name}** ${pct(e.percent)}`).join(' · ');
}

/** Builds 4 embed pages for a single Pokémon detail view. */
export function buildDetailPages(
  d:       DetailData,
  regName: string,
  source:  string,
): EmbedBuilder[] {
  const color   = typeColor(d.types);
  const thumb   = spriteUrl(d.speciesName);
  const footer  = { text: `Source: ${source}` };

  const base = () =>
    new EmbedBuilder().setColor(color).setThumbnail(thumb).setFooter(footer);

  // Page 1 — Overview
  const p1 = base()
    .setTitle(`${d.speciesName}`)
    .addFields(
      { name: 'Regulation', value: regName,                    inline: true },
      { name: 'Rank',       value: `#${d.rank}`,               inline: true },
      { name: 'Usage',      value: pct(d.usagePercent),        inline: true },
      { name: 'Types',      value: d.types.join(' / ') || '—', inline: true },
      { name: 'Raw Count',  value: String(d.rawCount),         inline: true },
      { name: '​',     value: '​',                   inline: true },
      ...(d.topItem     ? [{ name: 'Top Item',      value: d.topItem,     inline: true }] : []),
      ...(d.topMove     ? [{ name: 'Top Move',      value: d.topMove,     inline: true }] : []),
      ...(d.topTeraType ? [{ name: 'Top Tera Type', value: d.topTeraType, inline: true }] : []),
      ...(d.teammates?.length
        ? [{ name: 'Top Teammates', value: fmtTeammates(d.teammates, 3), inline: false }]
        : []),
    );

  // Page 2 — Abilities & Items
  const p2 = base()
    .setTitle(`${d.speciesName} — Abilities & Items`)
    .addFields(
      { name: 'Abilities', value: fmtList(d.abilities, 5), inline: false },
      { name: 'Items',     value: fmtList(d.items, 5),     inline: false },
    );

  // Page 3 — Moves
  const p3 = base()
    .setTitle(`${d.speciesName} — Moves`)
    .addFields(
      { name: 'Moves', value: fmtList(d.moves, 8), inline: false },
    );

  // Page 4 — Tera Types & Spreads
  const p4 = base()
    .setTitle(`${d.speciesName} — Tera Types & Spreads`)
    .addFields(
      { name: 'Tera Types', value: fmtList(d.teraTypes, 5),  inline: false },
      { name: 'Spreads',    value: fmtSpreads(d.spreads, 5), inline: false },
    );

  return [p1, p2, p3, p4];
}

const PAGE_SIZE = 10;

/** Builds paginated embeds for the top-N list. */
export function buildTopPages(
  entries: PokemonUsageEntry[],
  regName: string,
  source:  string,
): EmbedBuilder[] {
  const color   = typeColor(entries[0]?.types ?? []);
  const footer  = { text: `Source: ${source}` };
  const total   = Math.ceil(entries.length / PAGE_SIZE);

  return Array.from({ length: total }, (_, i) => {
    const slice = entries.slice(i * PAGE_SIZE, (i + 1) * PAGE_SIZE);
    const lines = slice.map(
      (e) =>
        `\`#${String(e.rank).padStart(2, ' ')}\` ${typeEmoji(e.types)} **${e.speciesName}** — ${pct(e.usagePercent)}`,
    );
    return new EmbedBuilder()
      .setColor(color)
      .setTitle(`Top — ${regName}`)
      .setDescription(lines.join('\n'))
      .setFooter(footer);
  });
}

export { COLLECTOR_TTL_MS };
