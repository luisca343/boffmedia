import { Injectable, UseInterceptors } from '@nestjs/common';
import { Context, Options, Subcommand } from 'necord';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { MetaCommand } from './meta.group';
import { MetaMatchupDto } from './meta.dto';
import { MetaVgcAutocompleteInterceptor } from './meta-vgc-autocomplete.interceptor';
import { MetaCacheService } from './meta-cache.service';
import { VgcMetaFacadeService } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/meta.facade.service';
import { PokemonUsageDetail, PokemonUsageEntry } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/entities/pokemon-usage.entity';
import { getEffectiveness } from './meta-team-utils';
import { typeColor, spriteUrl } from './meta.util';
import { buildNavRow, COLLECTOR_TTL_MS } from './meta-paginator';
import {
  calculate,
  Pokemon as CalcPokemon,
  Move as CalcMove,
  Field,
  Generations,
  toID,
} from '@smogon/calc';

type Weather = 'Sand' | 'Sun' | 'Rain' | 'Hail' | 'Snow' | 'Harsh Sunshine' | 'Heavy Rain' | 'Strong Winds';
type Terrain = 'Electric' | 'Grassy' | 'Psychic' | 'Misty';

// ── @smogon/calc setup ───────────────────────────────────────────────────────

const GEN = Generations.get(9);

// ── Spread helpers ───────────────────────────────────────────────────────────

// Smogon moveset.txt spread format: "0/0/4/252/0/252" (HP/Atk/Def/SpA/SpD/Spe)
function parseSpreadStr(s: string) {
  const p = s.trim().split('/').map((v) => parseInt(v.trim(), 10) || 0);
  return { hp: p[0] ?? 0, atk: p[1] ?? 0, def: p[2] ?? 0, spa: p[3] ?? 0, spd: p[4] ?? 0, spe: p[5] ?? 0 };
}

function fallbackSet(detail: PokemonUsageDetail) {
  const { atk, spa } = detail.baseStats;
  return atk >= spa
    ? { evs: { hp: 0, atk: 252, def: 4, spa: 0, spd: 0, spe: 252 }, nature: 'Adamant' }
    : { evs: { hp: 0, atk: 0, def: 4, spa: 252, spd: 0, spe: 252 }, nature: 'Modest' };
}

function fmtEvs(evs: ReturnType<typeof parseSpreadStr>): string {
  const labels: Record<string, string> = { hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe' };
  return Object.entries(evs)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${v} ${labels[k]}`)
    .join(' / ') || '0 EVs';
}

interface BuiltSet {
  pokemon:    CalcPokemon;
  nature:     string;
  evs:        ReturnType<typeof parseSpreadStr>;
  isFallback: boolean;
}

function buildSet(detail: PokemonUsageDetail): BuiltSet {
  const top = detail.spreads?.[0];
  const isFallback = !top?.spread;
  const { evs, nature } = top?.spread
    ? { evs: parseSpreadStr(top.spread), nature: top.nature }
    : fallbackSet(detail);

  const pokemon = new CalcPokemon(GEN, detail.speciesName, {
    ability: detail.abilities[0]?.name,
    item:    detail.items[0]?.name,
    nature,
    evs,
    level: 50,
  });
  return { pokemon, nature, evs, isFallback };
}

// ── Field helpers ────────────────────────────────────────────────────────────

const WEATHER_MAP: Record<string, Weather> = {
  'Drought':         'Sun',
  'Desolate Land':   'Harsh Sunshine',
  'Drizzle':         'Rain',
  'Primordial Sea':  'Heavy Rain',
  'Sand Stream':     'Sand',
  'Snow Warning':    'Snow',
};
const TERRAIN_MAP: Record<string, Terrain> = {
  'Electric Surge': 'Electric',
  'Grassy Surge':   'Grassy',
  'Psychic Surge':  'Psychic',
  'Misty Surge':    'Misty',
};

function buildField(abilityA?: string, abilityB?: string): { field: Field; notes: string[] } {
  const abilities = [abilityA, abilityB].filter(Boolean) as string[];
  const weather   = abilities.map((a) => WEATHER_MAP[a]).find(Boolean);
  const terrain   = abilities.map((a) => TERRAIN_MAP[a]).find(Boolean);
  const notes: string[] = [];
  if (weather) notes.push(`${weather} (from ${abilities.find((a) => WEATHER_MAP[a] === weather)})`);
  if (terrain) notes.push(`${terrain} Terrain`);
  return { field: new Field({ gameType: 'Doubles', weather, terrain }), notes };
}

// ── Damage calc ──────────────────────────────────────────────────────────────

interface CalcEntry {
  moveName: string;
  minPct:   number;
  maxPct:   number;
  khoText:  string;
}

function runCalcs(
  atkDetail: PokemonUsageDetail,
  atkSet:    CalcPokemon,
  defSet:    CalcPokemon,
  field:     Field,
): CalcEntry[] {
  const results: CalcEntry[] = [];

  for (const m of atkDetail.moves.slice(0, 10)) {
    const moveData = GEN.moves.get(toID(m.name) as ReturnType<typeof toID>);
    if (!moveData || moveData.category === 'Status' || moveData.basePower === 0) continue;

    try {
      const result  = calculate(GEN, atkSet, defSet, new CalcMove(GEN, m.name), field);
      const [min, max] = result.range();
      const defHp   = defSet.stats.hp;
      if (defHp === 0) continue;
      const minPct  = (min / defHp) * 100;
      const maxPct  = (max / defHp) * 100;
      const { n, text: khoText } = result.kochance();
      const label = khoText || (n === 1 ? 'OHKO' : `${n}HKO`);
      results.push({ moveName: m.name, minPct, maxPct, khoText: label });
    } catch {
      // Species not in @smogon/calc data (e.g. Champions mod Pokémon)
    }

    if (results.length >= 4) break;
  }

  return results;
}

function fmtCalcLine(entry: CalcEntry): string {
  const range = `${entry.minPct.toFixed(1)}–${entry.maxPct.toFixed(1)}%`;
  return `**${entry.moveName}** — ${range}  *(${entry.khoText})*`;
}

// ── Type matchup helpers ─────────────────────────────────────────────────────

function bestOffensive(atkTypes: string[], defTypes: string[]): number {
  if (!atkTypes.length || !defTypes.length) return 1;
  return Math.max(...atkTypes.map((t) => getEffectiveness(t, defTypes)));
}

function multLabel(m: number): string {
  if (m === 0)    return '🚫 immune (0×)';
  if (m >= 4)     return `🔥 quad-hit (${m}×)`;
  if (m >= 2)     return `✅ super-effective (${m}×)`;
  if (m <= 0.25)  return `🛡️ double-resist (${m}×)`;
  if (m <= 0.5)   return `🛡️ resisted (${m}×)`;
  return `➖ neutral (1×)`;
}

// ── Embed builders ───────────────────────────────────────────────────────────

function buildTypeMatchupPage(
  yourEntry: PokemonUsageEntry,
  vsEntry:   PokemonUsageEntry,
  source:    string,
): EmbedBuilder {
  const yourBest = bestOffensive(yourEntry.types, vsEntry.types);
  const vsBest   = bestOffensive(vsEntry.types,   yourEntry.types);

  return new EmbedBuilder()
    .setColor(typeColor(yourEntry.types))
    .setThumbnail(spriteUrl(yourEntry.speciesName))
    .setTitle(`${yourEntry.speciesName}  vs  ${vsEntry.speciesName}`)
    .addFields(
      {
        name:   `${yourEntry.speciesName} → ${vsEntry.speciesName}`,
        value:  `${multLabel(yourBest)}\n*${yourEntry.types.join('/')} vs ${vsEntry.types.join('/')}*`,
        inline: false,
      },
      {
        name:   `${vsEntry.speciesName} → ${yourEntry.speciesName}`,
        value:  `${multLabel(vsBest)}\n*${vsEntry.types.join('/')} vs ${yourEntry.types.join('/')}*`,
        inline: false,
      },
      {
        name:   `${yourEntry.speciesName}`,
        value:  `Rank #${yourEntry.rank} · ${yourEntry.usagePercent.toFixed(1)}%`,
        inline: true,
      },
      {
        name:   `${vsEntry.speciesName}`,
        value:  `Rank #${vsEntry.rank} · ${vsEntry.usagePercent.toFixed(1)}%`,
        inline: true,
      },
    )
    .setFooter({ text: `Source: ${source}  ·  Best STAB type matchup shown` });
}

function buildCalcPage(
  yourDetail: PokemonUsageDetail,
  vsDetail:   PokemonUsageDetail,
  yourSet:    BuiltSet,
  vsSet:      BuiltSet,
  fieldNotes: string[],
): EmbedBuilder {
  const yourCalcs = runCalcs(yourDetail, yourSet.pokemon, vsSet.pokemon,
    yourSet.pokemon.ability && vsSet.pokemon.ability
      ? buildField(yourSet.pokemon.ability, vsSet.pokemon.ability).field
      : new Field({ gameType: 'Doubles' }),
  );
  const vsCalcs = runCalcs(vsDetail, vsSet.pokemon, yourSet.pokemon,
    yourSet.pokemon.ability && vsSet.pokemon.ability
      ? buildField(yourSet.pokemon.ability, vsSet.pokemon.ability).field
      : new Field({ gameType: 'Doubles' }),
  );

  const setNote = (s: BuiltSet) => s.isFallback ? '*(estimated set)*' : '*(meta-typical set)*';

  const yourBlock = [
    `**${yourDetail.speciesName}** — ${yourSet.nature} · ${yourDetail.abilities[0]?.name ?? '?'} · ${yourDetail.items[0]?.name ?? '?'}`,
    `EVs: ${fmtEvs(yourSet.evs)} ${setNote(yourSet)}`,
    '',
    `→ **${vsDetail.speciesName}** (${fmtEvs(vsSet.evs)}):`,
    ...(yourCalcs.length ? yourCalcs.map(fmtCalcLine) : ['  *No damaging moves found in data*']),
  ].join('\n');

  const vsBlock = [
    `**${vsDetail.speciesName}** — ${vsSet.nature} · ${vsDetail.abilities[0]?.name ?? '?'} · ${vsDetail.items[0]?.name ?? '?'}`,
    `EVs: ${fmtEvs(vsSet.evs)} ${setNote(vsSet)}`,
    '',
    `→ **${yourDetail.speciesName}** (${fmtEvs(yourSet.evs)}):`,
    ...(vsCalcs.length ? vsCalcs.map(fmtCalcLine) : ['  *No damaging moves found in data*']),
  ].join('\n');

  const footerParts = [
    ...fieldNotes,
    'Doubles · Tera types not applied',
  ];

  return new EmbedBuilder()
    .setColor(typeColor(yourDetail.types))
    .setThumbnail(spriteUrl(yourDetail.speciesName))
    .setTitle(`Damage Calcs — ${yourDetail.speciesName} vs ${vsDetail.speciesName}`)
    .setDescription(`${yourBlock}\n\n${vsBlock}`)
    .setFooter({ text: footerParts.join('  ·  ') });
}

// ── Command ──────────────────────────────────────────────────────────────────

@Injectable()
@MetaCommand()
export class MetaMatchupCommand {
  constructor(
    private readonly metaFacade: VgcMetaFacadeService,
    private readonly cache: MetaCacheService,
  ) {}

  @UseInterceptors(MetaVgcAutocompleteInterceptor)
  @Subcommand({ name: 'matchup', description: 'Type matchup and damage calcs between two Pokémon using meta-typical sets' })
  public async onMatchup(
    @Context() [interaction]: [ChatInputCommandInteraction],
    @Options() { regulation, your, vs }: MetaMatchupDto,
  ) {
    await interaction.deferReply();

    const reg = (await this.metaFacade.getRegulations()).find((r) => r.id === regulation);
    if (!reg) {
      await interaction.editReply(`Unknown regulation \`${regulation}\`.`);
      return;
    }

    const source = reg.vgcPastesGid ? 'VGCPastes (Champions)' : reg.formatId ? 'Smogon Ladder' : 'Limitless (Combined)';

    // ── Resolve usage entries ────────────────────────────────────────────────
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

    const find = (name: string) => {
      const q = name.toLowerCase();
      return entries.find((e) => e.speciesName.toLowerCase() === q || e.speciesId.toLowerCase() === q);
    };

    const yourEntry = find(your);
    const vsEntry   = find(vs);

    if (!yourEntry || !vsEntry) {
      const missing = [!yourEntry && your, !vsEntry && vs].filter(Boolean) as string[];
      await interaction.editReply(
        `Not found in **${reg.name}**: ${missing.map((n) => `**${n}**`).join(', ')}.`,
      );
      return;
    }

    // ── Fetch full detail for calc sets ─────────────────────────────────────
    const [yourDetail, vsDetail] = await Promise.all([
      this.cache.getOrFetch<PokemonUsageDetail>(
        `vgc:detail:${regulation}:${yourEntry.speciesId}`,
        () => this.metaFacade.getUnifiedDetail(regulation, yourEntry.speciesId),
      ).catch(() => null),
      this.cache.getOrFetch<PokemonUsageDetail>(
        `vgc:detail:${regulation}:${vsEntry.speciesId}`,
        () => this.metaFacade.getUnifiedDetail(regulation, vsEntry.speciesId),
      ).catch(() => null),
    ]);

    // ── Type matchup page (always available) ─────────────────────────────────
    const p1 = buildTypeMatchupPage(yourEntry, vsEntry, source);

    // ── Damage calc page (requires detail) ──────────────────────────────────
    const pages: EmbedBuilder[] = [p1];

    if (yourDetail && vsDetail) {
      const yourSet = buildSet(yourDetail);
      const vsSet   = buildSet(vsDetail);
      const { field, notes } = buildField(
        yourDetail.abilities[0]?.name,
        vsDetail.abilities[0]?.name,
      );
      // Pass pre-built field to calc page
      const p2 = buildCalcPageWithField(yourDetail, vsDetail, yourSet, vsSet, field, notes);
      pages.push(p2);
    }

    // ── Send ─────────────────────────────────────────────────────────────────
    const iid  = interaction.id;
    let   page = 0;

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

function buildCalcPageWithField(
  yourDetail: PokemonUsageDetail,
  vsDetail:   PokemonUsageDetail,
  yourSet:    BuiltSet,
  vsSet:      BuiltSet,
  field:      Field,
  fieldNotes: string[],
): EmbedBuilder {
  const yourCalcs = runCalcs(yourDetail, yourSet.pokemon, vsSet.pokemon, field);
  const vsCalcs   = runCalcs(vsDetail,   vsSet.pokemon,  yourSet.pokemon, field);

  const setNote = (s: BuiltSet) => s.isFallback ? '*(estimated)*' : '*(meta-typical)*';

  const yourBlock = [
    `**${yourDetail.speciesName}** — ${yourSet.nature} · ${yourDetail.abilities[0]?.name ?? '?'} · ${yourDetail.items[0]?.name ?? '?'}`,
    `\`${fmtEvs(yourSet.evs)}\` ${setNote(yourSet)}`,
    `→ **${vsDetail.speciesName}**:`,
    ...(yourCalcs.length ? yourCalcs.map(fmtCalcLine) : ['*No damaging moves found in data*']),
  ].join('\n');

  const vsBlock = [
    `**${vsDetail.speciesName}** — ${vsSet.nature} · ${vsDetail.abilities[0]?.name ?? '?'} · ${vsDetail.items[0]?.name ?? '?'}`,
    `\`${fmtEvs(vsSet.evs)}\` ${setNote(vsSet)}`,
    `→ **${yourDetail.speciesName}**:`,
    ...(vsCalcs.length ? vsCalcs.map(fmtCalcLine) : ['*No damaging moves found in data*']),
  ].join('\n');

  const footerParts = [...fieldNotes, 'Doubles · Tera not applied'];

  return new EmbedBuilder()
    .setColor(typeColor(yourDetail.types))
    .setTitle(`Damage Calcs — ${yourDetail.speciesName} vs ${vsDetail.speciesName}`)
    .setDescription(`${yourBlock}\n\n${vsBlock}`)
    .setFooter({ text: footerParts.join('  ·  ') });
}
