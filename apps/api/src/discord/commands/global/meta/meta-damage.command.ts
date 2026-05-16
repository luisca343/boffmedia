import { Injectable, UseInterceptors } from '@nestjs/common';
import { Context, Options, Subcommand } from 'necord';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { MetaCommand } from './meta.group';
import { MetaDamageDto } from './meta.dto';
import { MetaVgcAutocompleteInterceptor } from './meta-vgc-autocomplete.interceptor';
import { MetaCacheService } from './meta-cache.service';
import { VgcMetaFacadeService } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/meta.facade.service';
import {
  PokemonUsageDetail,
  PokemonUsageEntry,
} from '@/api/boffmedia/herramientas/pokemon/vgc/meta/entities/pokemon-usage.entity';
import { typeColor, spriteUrl } from './meta.util';
import {
  calculate,
  Pokemon as CalcPokemon,
  Move as CalcMove,
  Field,
  Generations,
  toID,
} from '@smogon/calc';

// ── @smogon/calc setup ───────────────────────────────────────────────────────

const GEN = Generations.get(9);

// ── Inline weather/terrain types (not re-exported from @smogon/calc index) ───

type Weather =
  | 'Sand'
  | 'Sun'
  | 'Rain'
  | 'Hail'
  | 'Snow'
  | 'Harsh Sunshine'
  | 'Heavy Rain'
  | 'Strong Winds';
type Terrain = 'Electric' | 'Grassy' | 'Psychic' | 'Misty';

const WEATHER_MAP: Record<string, Weather> = {
  Drought: 'Sun',
  'Desolate Land': 'Harsh Sunshine',
  Drizzle: 'Rain',
  'Primordial Sea': 'Heavy Rain',
  'Sand Stream': 'Sand',
  'Snow Warning': 'Snow',
};
const TERRAIN_MAP: Record<string, Terrain> = {
  'Electric Surge': 'Electric',
  'Grassy Surge': 'Grassy',
  'Psychic Surge': 'Psychic',
  'Misty Surge': 'Misty',
};

function buildField(
  abilityA?: string,
  abilityB?: string,
): { field: Field; notes: string[] } {
  const abilities = [abilityA, abilityB].filter(Boolean) as string[];
  const weather = abilities.map((a) => WEATHER_MAP[a]).find(Boolean);
  const terrain = abilities.map((a) => TERRAIN_MAP[a]).find(Boolean);
  const notes: string[] = [];
  if (weather) notes.push(weather);
  if (terrain) notes.push(`${terrain} Terrain`);
  return { field: new Field({ gameType: 'Doubles', weather, terrain }), notes };
}

// ── Spread helpers ───────────────────────────────────────────────────────────

function parseSpreadStr(s: string) {
  const p = s
    .trim()
    .split('/')
    .map((v) => parseInt(v.trim(), 10) || 0);
  return {
    hp: p[0] ?? 0,
    atk: p[1] ?? 0,
    def: p[2] ?? 0,
    spa: p[3] ?? 0,
    spd: p[4] ?? 0,
    spe: p[5] ?? 0,
  };
}

function fallbackAtkEvs(detail: PokemonUsageDetail) {
  const { atk, spa } = detail.baseStats;
  return atk >= spa
    ? {
        evs: { hp: 0, atk: 252, def: 4, spa: 0, spd: 0, spe: 252 },
        nature: 'Adamant',
      }
    : {
        evs: { hp: 0, atk: 0, def: 4, spa: 252, spd: 0, spe: 252 },
        nature: 'Modest',
      };
}

function fmtEvs(evs: ReturnType<typeof parseSpreadStr>): string {
  const labels: Record<string, string> = {
    hp: 'HP',
    atk: 'Atk',
    def: 'Def',
    spa: 'SpA',
    spd: 'SpD',
    spe: 'Spe',
  };
  return (
    Object.entries(evs)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${v} ${labels[k]}`)
      .join(' / ') || '0 EVs'
  );
}

interface BuiltSet {
  pokemon: CalcPokemon;
  nature: string;
  evs: ReturnType<typeof parseSpreadStr>;
  isFallback: boolean;
}

function buildPokemonSet(detail: PokemonUsageDetail): BuiltSet {
  const top = detail.spreads?.[0];
  const isFallback = !top?.spread;
  const { evs, nature } = top?.spread
    ? { evs: parseSpreadStr(top.spread), nature: top.nature }
    : fallbackAtkEvs(detail);

  const pokemon = new CalcPokemon(GEN, detail.speciesName, {
    ability: detail.abilities[0]?.name,
    item: detail.items[0]?.name,
    nature,
    evs,
    level: 50,
  });
  return { pokemon, nature, evs, isFallback };
}

// ── Calc helpers ─────────────────────────────────────────────────────────────

interface CalcLine {
  moveName: string;
  minPct: number;
  maxPct: number;
  khoText: string;
}

function runTopCalcs(
  atkDetail: PokemonUsageDetail,
  atkMon: CalcPokemon,
  defMon: CalcPokemon,
  field: Field,
): CalcLine[] {
  const results: CalcLine[] = [];
  for (const m of atkDetail.moves.slice(0, 10)) {
    const moveData = GEN.moves.get(toID(m.name) as ReturnType<typeof toID>);
    if (!moveData || moveData.category === 'Status' || moveData.basePower === 0)
      continue;
    try {
      const result = calculate(
        GEN,
        atkMon,
        defMon,
        new CalcMove(GEN, m.name),
        field,
      );
      const [min, max] = result.range();
      const defHp = defMon.stats.hp;
      if (defHp === 0) continue;
      const { n, text: khoText } = result.kochance();
      results.push({
        moveName: m.name,
        minPct: (min / defHp) * 100,
        maxPct: (max / defHp) * 100,
        khoText: khoText || (n === 1 ? 'OHKO' : `${n}HKO`),
      });
    } catch {
      // Species not in @smogon/calc data
    }
    if (results.length >= 4) break;
  }
  return results;
}

function runSingleCalc(
  moveName: string,
  atkMon: CalcPokemon,
  defMon: CalcPokemon,
  field: Field,
): CalcLine | null {
  try {
    const result = calculate(
      GEN,
      atkMon,
      defMon,
      new CalcMove(GEN, moveName),
      field,
    );
    const [min, max] = result.range();
    const defHp = defMon.stats.hp;
    if (defHp === 0) return null;
    const { n, text: khoText } = result.kochance();
    return {
      moveName,
      minPct: (min / defHp) * 100,
      maxPct: (max / defHp) * 100,
      khoText: khoText || (n === 1 ? 'OHKO' : `${n}HKO`),
    };
  } catch {
    return null;
  }
}

function fmtCalcLine(line: CalcLine): string {
  return `**${line.moveName}** — **${line.minPct.toFixed(1)}–${line.maxPct.toFixed(1)}%**  *(${line.khoText})*`;
}

function fmtSetLine(
  name: string,
  set: BuiltSet,
  detail: PokemonUsageDetail,
): string {
  const tag = set.isFallback ? ' *(est.)*' : '';
  return `**${name}** — ${set.nature} · ${detail.abilities[0]?.name ?? '?'} · ${detail.items[0]?.name ?? '?'}\n\`${fmtEvs(set.evs)}\`${tag}`;
}

// ── Command ──────────────────────────────────────────────────────────────────

@Injectable()
@MetaCommand()
export class MetaDamageCommand {
  constructor(
    private readonly metaFacade: VgcMetaFacadeService,
    private readonly cache: MetaCacheService,
  ) {}

  @UseInterceptors(MetaVgcAutocompleteInterceptor)
  @Subcommand({
    name: 'damage',
    description: 'Damage calc: attacker vs defender, optional specific move',
  })
  public async onDamage(
    @Context() [interaction]: [ChatInputCommandInteraction],
    @Options() { regulation, pokemon, vs, move }: MetaDamageDto,
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
      ? 'VGCPastes'
      : reg.formatId
        ? 'Smogon Ladder'
        : 'Limitless';

    // ── Resolve both Pokémon ──────────────────────────────────────────────────
    let allEntries: PokemonUsageEntry[];
    try {
      allEntries = await this.cache.getOrFetch(
        `vgc:usage-entries:${regulation}`,
        () => this.metaFacade.getUnifiedUsageList(regulation),
      );
    } catch {
      await interaction.editReply(`No usage data for **${reg.name}** yet.`);
      return;
    }

    const findEntry = (query: string) => {
      const q = query.toLowerCase();
      return allEntries.find(
        (e) =>
          e.speciesId === query ||
          e.speciesName.toLowerCase() === q ||
          e.speciesId.toLowerCase() === q,
      );
    };

    const atkEntry = findEntry(pokemon);
    const defEntry = findEntry(vs);

    if (!atkEntry || !defEntry) {
      const missing = [!atkEntry && pokemon, !defEntry && vs].filter(
        Boolean,
      ) as string[];
      await interaction.editReply(
        `Not found in **${reg.name}**: ${missing.map((n) => `**${n}**`).join(', ')}.`,
      );
      return;
    }

    // ── Fetch details for both ────────────────────────────────────────────────
    const [atkDetail, defDetail] = await Promise.all([
      this.cache
        .getOrFetch<PokemonUsageDetail>(
          `vgc:detail:${regulation}:${atkEntry.speciesId}`,
          () =>
            this.metaFacade.getUnifiedDetail(regulation, atkEntry.speciesId),
        )
        .catch(() => null),
      this.cache
        .getOrFetch<PokemonUsageDetail>(
          `vgc:detail:${regulation}:${defEntry.speciesId}`,
          () =>
            this.metaFacade.getUnifiedDetail(regulation, defEntry.speciesId),
        )
        .catch(() => null),
    ]);

    if (!atkDetail || !defDetail) {
      const missing = [
        !atkDetail && atkEntry.speciesName,
        !defDetail && defEntry.speciesName,
      ].filter(Boolean) as string[];
      await interaction.editReply(
        `No detail data for: ${missing.map((n) => `**${n}**`).join(', ')}.`,
      );
      return;
    }

    if (!atkDetail.moves?.length) {
      await interaction.editReply(
        `No move data available for **${atkEntry.speciesName}** in **${reg.name}**.`,
      );
      return;
    }

    // ── Validate specific move if provided ────────────────────────────────────
    if (move) {
      const moveData = GEN.moves.get(toID(move) as ReturnType<typeof toID>);
      if (!moveData) {
        await interaction.editReply(
          `Unknown move **${move}**. Use the autocomplete to pick from ${atkEntry.speciesName}'s meta moves.`,
        );
        return;
      }
      if (moveData.category === 'Status' || moveData.basePower === 0) {
        await interaction.editReply(
          `**${move}** is a status move with no damage output.`,
        );
        return;
      }
    }

    // ── Build sets ────────────────────────────────────────────────────────────
    let atkSet: BuiltSet;
    let defSet: BuiltSet;
    try {
      atkSet = buildPokemonSet(atkDetail);
      defSet = buildPokemonSet(defDetail);
    } catch {
      await interaction.editReply(
        `Could not build sets — one of these species may be unsupported by the calc engine.`,
      );
      return;
    }

    // ── Build field (weather/terrain from abilities) ───────────────────────────
    const { field, notes: fieldNotes } = buildField(
      atkDetail.abilities[0]?.name,
      defDetail.abilities[0]?.name,
    );

    // ── Run calc ──────────────────────────────────────────────────────────────
    const title = move
      ? `${atkEntry.speciesName} → ${defEntry.speciesName} — ${move} (${reg.name})`
      : `${atkEntry.speciesName} → ${defEntry.speciesName} (${reg.name})`;

    const embed = new EmbedBuilder()
      .setColor(typeColor(atkDetail.types))
      .setThumbnail(spriteUrl(atkEntry.speciesName))
      .setTitle(title);

    if (move) {
      // ── Single move ──────────────────────────────────────────────────────────
      const result = runSingleCalc(move, atkSet.pokemon, defSet.pokemon, field);
      if (!result) {
        await interaction.editReply(
          `Could not calculate **${move}** — species or move may be unsupported by the calc engine.`,
        );
        return;
      }
      embed.setDescription(
        `**${result.minPct.toFixed(1)}–${result.maxPct.toFixed(1)}%**  *(${result.khoText})*`,
      );
    } else {
      // ── Top 4 moves ──────────────────────────────────────────────────────────
      const calcs = runTopCalcs(
        atkDetail,
        atkSet.pokemon,
        defSet.pokemon,
        field,
      );
      if (calcs.length === 0) {
        await interaction.editReply(
          `No damaging moves found for **${atkEntry.speciesName}** in the calc engine.`,
        );
        return;
      }
      embed.setDescription(calcs.map(fmtCalcLine).join('\n'));
    }

    embed
      .addFields(
        {
          name: 'Attacker',
          value: fmtSetLine(atkEntry.speciesName, atkSet, atkDetail),
          inline: true,
        },
        {
          name: 'Defender',
          value: fmtSetLine(defEntry.speciesName, defSet, defDetail),
          inline: true,
        },
      )
      .setFooter({
        text: [
          `Source: ${source}`,
          'Doubles',
          ...fieldNotes,
          'Tera not applied',
        ].join('  ·  '),
      });

    await interaction.editReply({ embeds: [embed] });
  }
}
