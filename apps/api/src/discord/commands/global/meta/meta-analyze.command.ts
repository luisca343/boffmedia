import { Injectable, UseInterceptors } from '@nestjs/common';
import { Context, Options, Subcommand } from 'necord';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { MetaCommand } from './meta.group';
import { MetaAnalyzeDto } from './meta.dto';
import { MetaRegulationAutocompleteInterceptor } from './meta-regulation.interceptor';
import { MetaCacheService } from './meta-cache.service';
import { VgcMetaFacadeService } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/meta.facade.service';
import { PokemonUsageEntry } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/entities/pokemon-usage.entity';
import { parsePasteMeta } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/services/parse-paste-meta';
import { VgcMetaSlot } from '@/_db/schema/Vgc';
import {
  detectArchetype,
  analyzeWeaknesses,
  analyzeRoles,
} from './meta-team-utils';
import { buildNavRow, COLLECTOR_TTL_MS } from './meta-paginator';
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

function buildAnalysisPages(
  slots: VgcMetaSlot[],
  entryMap: Map<string, PokemonUsageEntry>,
  regName: string,
  source: string,
): EmbedBuilder[] {
  const firstTypes = slots
    .map((s) => entryMap.get(s.speciesId)?.types ?? [])
    .find((t) => t.length) ?? ['normal'];
  const color = typeColor(firstTypes);
  const footer = { text: `Source: ${source}` };
  const base = () => new EmbedBuilder().setColor(color).setFooter(footer);

  const archetypes = detectArchetype(slots);
  const roles = analyzeRoles(slots);
  const weaknesses = analyzeWeaknesses(
    slots.map((s) => ({
      speciesName: s.speciesName,
      types: entryMap.get(s.speciesId)?.types ?? [],
    })),
  );

  // Page 1 — Team Overview
  const teamLines = slots.map((s) => {
    const e = entryMap.get(s.speciesId);
    const rank = e ? `#${e.rank}` : '?';
    const use = e ? `${e.usagePercent.toFixed(1)}%` : '—';
    const emoji = e?.types.length ? `${typeEmoji(e.types)} ` : '';
    return `${emoji}**${s.speciesName}** — ${rank} (${use})`;
  });

  const p1 = base()
    .setTitle(`Team Analysis — ${regName}`)
    .setDescription(teamLines.join('\n'))
    .addFields({
      name: 'Archetype',
      value: archetypes.join(', '),
      inline: false,
    });

  // Page 2 — Weaknesses
  const weakLines = weaknesses.slice(0, 10).map((w) => {
    const filled = Math.min(w.total, 6);
    const bar = '█'.repeat(filled) + '░'.repeat(6 - filled);
    const count = w.doubleHits + w.quadHits;
    const tag = w.quadHits ? ` (${w.quadHits}×4×)` : '';
    return `**${capitalize(w.atkType)}** ${bar} ${count} Pokémon${tag}`;
  });

  const p2 = base()
    .setTitle(`Weaknesses — ${regName}`)
    .setDescription(
      weakLines.length ? weakLines.join('\n') : 'No notable type weaknesses.',
    )
    .addFields({
      name: 'Note',
      value: 'Tera type changes not factored in.',
      inline: false,
    });

  // Page 3 — Roles & Gaps
  const p3 = base()
    .setTitle(`Roles & Gaps — ${regName}`)
    .addFields(
      {
        name: 'Present',
        value: roles.present.join(', ') || '—',
        inline: false,
      },
      {
        name: 'Missing',
        value: roles.missing.join(', ') || '—',
        inline: false,
      },
    );

  return [p1, p2, p3];
}

@Injectable()
@MetaCommand()
export class MetaAnalyzeCommand {
  constructor(
    private readonly metaFacade: VgcMetaFacadeService,
    private readonly cache: MetaCacheService,
  ) {}

  @UseInterceptors(MetaRegulationAutocompleteInterceptor)
  @Subcommand({
    name: 'analyze',
    description:
      'Analyze a team paste for meta ranks, archetypes, and type weaknesses',
  })
  public async onAnalyze(
    @Context() [interaction]: [ChatInputCommandInteraction],
    @Options() { regulation, paste }: MetaAnalyzeDto,
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

    let entries: PokemonUsageEntry[] = [];
    try {
      entries = await this.cache.getOrFetch(
        `vgc:usage-entries:${regulation}`,
        () => this.metaFacade.getUnifiedUsageList(regulation),
      );
    } catch {
      // continue without rank data
    }

    const entryMap = new Map(entries.map((e) => [e.speciesId, e]));
    const pages = buildAnalysisPages(slots, entryMap, reg.name, source);

    const iid = interaction.id;
    let page = 0;

    const msg = await interaction.editReply({
      embeds: [pages[page]],
      components:
        pages.length > 1 ? [buildNavRow(iid, page, pages.length)] : [],
    });

    if (pages.length <= 1) return;

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
