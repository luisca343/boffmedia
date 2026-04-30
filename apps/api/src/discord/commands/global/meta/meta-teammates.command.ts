import { Injectable, UseInterceptors } from '@nestjs/common';
import { Context, Options, Subcommand } from 'necord';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { MetaCommand } from './meta.group';
import { MetaTeammatesDto } from './meta-teammates.dto';
import { MetaRegulationAutocompleteInterceptor } from './meta-regulation.interceptor';
import { VgcMetaFacadeService } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/meta.facade.service';
import { typeColor, spriteUrl } from './meta.util';

interface TeammateScore {
  name:       string;
  avgPercent: number;
  listCount:  number; // how many input Pokémon had this teammate
}

/** Intersect N teammate arrays, sorted by average percent across all inputs. */
function intersectTeammates(
  inputs: Array<{ pokemonName: string; teammates: Array<{ name: string; percent: number }> }>,
): { scores: TeammateScore[]; strict: boolean } {
  const n = inputs.length;
  const tally: Record<string, { sum: number; count: number }> = {};

  for (const { teammates } of inputs) {
    for (const tm of teammates) {
      if (!tally[tm.name]) tally[tm.name] = { sum: 0, count: 0 };
      tally[tm.name].sum   += tm.percent;
      tally[tm.name].count += 1;
    }
  }

  const scored: TeammateScore[] = Object.entries(tally).map(([name, v]) => ({
    name,
    avgPercent: v.sum / n,
    listCount:  v.count,
  }));

  // Strict intersection: appear in ALL input lists
  const strict = scored.filter((s) => s.listCount === n).sort((a, b) => b.avgPercent - a.avgPercent);
  if (strict.length > 0) return { scores: strict, strict: true };

  // Fallback: most common across inputs, then by average
  const fallback = scored.sort((a, b) => b.listCount - a.listCount || b.avgPercent - a.avgPercent);
  return { scores: fallback, strict: false };
}

@Injectable()
@MetaCommand()
export class MetaTeammatesCommand {
  constructor(private readonly metaFacade: VgcMetaFacadeService) {}

  @UseInterceptors(MetaRegulationAutocompleteInterceptor)
  @Subcommand({ name: 'teammates', description: 'Find most common teammates for one or more Pokémon' })
  public async onTeammates(
    @Context() [interaction]: [ChatInputCommandInteraction],
    @Options() { regulation, pokemon, pokemon2, pokemon3 }: MetaTeammatesDto,
  ) {
    await interaction.deferReply();

    const reg = (await this.metaFacade.getRegulations()).find((r) => r.id === regulation);
    if (!reg) {
      await interaction.editReply(`Unknown regulation \`${regulation}\`.`);
      return;
    }

    // Teammate data only available from Smogon snapshots
    if (!reg.formatId) {
      await interaction.editReply(`Teammate data is not available for **${reg.name}**.`);
      return;
    }

    // ── Resolve speciesIds for all input Pokémon ────────────────────────────
    const names = [pokemon, pokemon2, pokemon3].filter(Boolean) as string[];

    let usageEntries: Awaited<ReturnType<typeof this.metaFacade.getSmogonUsageList>>;
    try {
      usageEntries = await this.metaFacade.getSmogonUsageList({ format: reg.formatId });
    } catch {
      await interaction.editReply(`No Smogon data available for **${reg.name}** yet.`);
      return;
    }

    const resolved = names.map((name) => {
      const q = name.toLowerCase();
      return usageEntries.find(
        (e) => e.speciesName.toLowerCase() === q || e.speciesId.toLowerCase() === q,
      );
    });

    const missing = names.filter((_, i) => !resolved[i]);
    if (missing.length > 0) {
      await interaction.editReply(
        `Could not find in **${reg.name}**: ${missing.map((n) => `**${n}**`).join(', ')}.`,
      );
      return;
    }

    // ── Fetch full detail (includes teammates) for each Pokémon ─────────────
    const detailResults = await Promise.allSettled(
      resolved.map((entry) =>
        this.metaFacade.getSmogonDetail({ format: reg.formatId, speciesId: entry!.speciesId }),
      ),
    );

    const failed = detailResults
      .map((r, i) => (r.status === 'rejected' ? names[i] : null))
      .filter(Boolean);
    if (failed.length > 0) {
      await interaction.editReply(
        `Detail data unavailable for: ${failed.map((n) => `**${n}**`).join(', ')}.`,
      );
      return;
    }

    const details = detailResults.map((r) => (r as PromiseFulfilledResult<any>).value);

    // ── Build teammate scores ────────────────────────────────────────────────
    const inputs = details.map((d, i) => ({
      pokemonName: resolved[i]!.speciesName,
      teammates:   d.teammates ?? [],
    }));

    if (inputs.every((inp) => inp.teammates.length === 0)) {
      await interaction.editReply(`No teammate data found for **${reg.name}**.`);
      return;
    }

    const { scores, strict } = intersectTeammates(inputs);
    const top = scores.slice(0, 10);

    // ── Build embed ──────────────────────────────────────────────────────────
    const primaryEntry = resolved[0]!;
    const inputNames   = inputs.map((i) => i.pokemonName);
    const title        = names.length === 1
      ? `${inputNames[0]} — Teammates`
      : `Common Teammates — ${inputNames.join(' + ')}`;

    const lines = top.map((tm, idx) => {
      const pctStr = `${tm.avgPercent.toFixed(1)}%`;
      const listNote = !strict && names.length > 1
        ? ` *(${tm.listCount}/${names.length})*`
        : '';
      return `\`#${String(idx + 1).padStart(2)}\` **${tm.name}** — ${pctStr}${listNote}`;
    });

    let description = lines.join('\n');
    if (names.length > 1 && !strict) {
      description = `_No single teammate appeared alongside all inputs — showing most frequent:_\n\n${description}`;
    }

    const embed = new EmbedBuilder()
      .setColor(typeColor(primaryEntry.types))
      .setThumbnail(spriteUrl(primaryEntry.speciesName))
      .setTitle(title)
      .setDescription(description)
      .addFields({ name: 'Regulation', value: reg.name, inline: true })
      .setFooter({ text: 'Source: Smogon Ladder' });

    await interaction.editReply({ embeds: [embed] });
  }
}
