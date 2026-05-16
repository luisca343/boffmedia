import { Injectable, UseInterceptors } from '@nestjs/common';
import { Context, Options, Subcommand } from 'necord';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { MetaCommand } from './meta.group';
import { MetaThreatsDto } from './meta.dto';
import { MetaRegulationAutocompleteInterceptor } from './meta-regulation.interceptor';
import { MetaCacheService } from './meta-cache.service';
import { VgcMetaFacadeService } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/meta.facade.service';
import { PokemonUsageEntry } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/entities/pokemon-usage.entity';
import { parsePasteMeta } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/services/parse-paste-meta';
import { getEffectiveness, analyzeWeaknesses } from './meta-team-utils';
import { typeColor, typeEmoji } from './meta.util';

async function resolvePaste(input: string): Promise<string | null> {
  const match = input.match(/https?:\/\/pokepast\.es\/([a-zA-Z0-9]+)\/?/);
  if (match) {
    try {
      const res = await fetch(`https://pokepast.es/${match[1]}/json`);
      if (!res.ok) return null;
      const json = (await res.json()) as { paste?: string };
      return json.paste ?? null;
    } catch {
      return null;
    }
  }
  return input;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface ThreatResult {
  entry: PokemonUsageEntry;
  score: number;
  count: number;
  targets: string[];
}

function buildThreatList(
  metaEntries: PokemonUsageEntry[],
  pasteMembers: Array<{ speciesName: string; types: string[] }>,
  limit: number,
): ThreatResult[] {
  const validMembers = pasteMembers.filter((m) => m.types.length > 0);
  if (validMembers.length === 0) return [];

  const results: ThreatResult[] = [];
  for (const meta of metaEntries) {
    if (meta.types.length === 0) continue;
    const targets: string[] = [];
    for (const pm of validMembers) {
      const bestEff = Math.max(
        ...meta.types.map((t) => getEffectiveness(t, pm.types)),
      );
      if (bestEff >= 2) targets.push(pm.speciesName);
    }
    if (targets.length === 0) continue;
    results.push({
      entry: meta,
      score: targets.length * meta.usagePercent,
      count: targets.length,
      targets,
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

@Injectable()
@MetaCommand()
export class MetaThreatsCommand {
  constructor(
    private readonly metaFacade: VgcMetaFacadeService,
    private readonly cache: MetaCacheService,
  ) {}

  @UseInterceptors(MetaRegulationAutocompleteInterceptor)
  @Subcommand({
    name: 'threats',
    description: 'Find top meta threats to a team paste',
  })
  public async onThreats(
    @Context() [interaction]: [ChatInputCommandInteraction],
    @Options() { regulation, paste }: MetaThreatsDto,
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

    // ── Resolve paste ─────────────────────────────────────────────────────────
    const rawPaste = await resolvePaste(paste.trim());
    if (!rawPaste) {
      await interaction.editReply(
        'Could not fetch paste. Provide a valid pokepast.es URL or raw Showdown paste.',
      );
      return;
    }

    const slots = parsePasteMeta(rawPaste);
    if (slots.length === 0) {
      await interaction.editReply(
        'No Pokémon found in paste. Check the Showdown format.',
      );
      return;
    }

    // ── Fetch usage entries ──────────────────────────────────────────────────
    let entries: PokemonUsageEntry[] = [];
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

    const entryMap = new Map(entries.map((e) => [e.speciesId, e]));

    // ── Build paste member type profiles ─────────────────────────────────────
    const pasteMembers = slots.map((s) => ({
      speciesName: s.speciesName,
      types: entryMap.get(s.speciesId)?.types ?? [],
    }));

    const unknownCount = pasteMembers.filter(
      (m) => m.types.length === 0,
    ).length;

    // ── Find top 8 threats (from top 30 meta Pokémon) ────────────────────────
    const threats = buildThreatList(entries.slice(0, 30), pasteMembers, 8);

    // ── Analyze team weaknesses ──────────────────────────────────────────────
    const weaknesses = analyzeWeaknesses(
      pasteMembers.filter((m) => m.types.length > 0),
    );

    // ── Build embed ──────────────────────────────────────────────────────────
    const firstTypes = pasteMembers.find((m) => m.types.length)?.types ?? [
      'normal',
    ];

    const threatLines = threats.map((t, i) => {
      const targetStr = t.targets.join(', ');
      return `\`#${String(i + 1).padStart(2)}\` ${typeEmoji(t.entry.types)} **${t.entry.speciesName}** (${t.entry.usagePercent.toFixed(1)}%) — hits **${t.count}/${pasteMembers.length}**: ${targetStr}`;
    });

    const weakLines = weaknesses.slice(0, 5).map((w) => {
      const total = w.doubleHits + w.quadHits;
      const tag = w.quadHits ? ` (${w.quadHits}×4×)` : '';
      return `**${capitalize(w.atkType)}** — ${total} member${total !== 1 ? 's' : ''}${tag}`;
    });

    const description =
      threats.length > 0
        ? threatLines.join('\n')
        : '*No notable threats found — strong coverage!*';

    const embed = new EmbedBuilder()
      .setColor(typeColor(firstTypes))
      .setTitle(`Top Threats — ${reg.name}`)
      .setDescription(description)
      .setFooter({ text: `Source: ${source}  ·  Based on STAB type matchups` });

    if (weakLines.length > 0) {
      embed.addFields({
        name: 'Your top type weaknesses',
        value: weakLines.join('\n'),
        inline: false,
      });
    }
    if (unknownCount > 0) {
      embed.addFields({
        name: 'Note',
        value: `${unknownCount} Pokémon not in meta data — excluded from analysis.`,
        inline: false,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  }
}
