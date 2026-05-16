import { Injectable, UseInterceptors } from '@nestjs/common';
import { Context, Options, Subcommand } from 'necord';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { MetaCommand } from './meta.group';
import { MetaPokemonDto } from './meta.dto';
import { MetaVgcAutocompleteInterceptor } from './meta-vgc-autocomplete.interceptor';
import { MetaCacheService } from './meta-cache.service';
import { VgcMetaFacadeService } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/meta.facade.service';
import {
  PokemonUsageDetail,
  PokemonUsageEntry,
} from '@/api/boffmedia/herramientas/pokemon/vgc/meta/entities/pokemon-usage.entity';
import { typeColor, spriteUrl } from './meta.util';

const ITEM_NOTES: Record<string, string> = {
  'Assault Vest': 'built for special bulk',
  'Choice Scarf': 'speed-boosted attacker',
  'Choice Band': 'max physical power',
  'Choice Specs': 'max special power',
  'Life Orb': 'high-power attacker with recoil',
  Leftovers: 'sustain-oriented',
  'Safety Goggles': 'immune to powder moves and weather chip',
  'Booster Energy': 'Paradox form — triggers a stat boost once',
  'Clear Amulet': 'immune to stat drops',
  'Covert Cloak': 'immune to secondary effects',
  'Rocky Helmet': 'punishes physical contact',
  'Sitrus Berry': 'one-time HP recovery',
  'Lum Berry': 'cures one status condition',
  'Tera Orb': 'enables Terastallization',
};

const SUPPORT_MOVES = new Set([
  'fake out',
  'follow me',
  'rage powder',
  'helping hand',
  'tailwind',
  'trick room',
  'wide guard',
  'quick guard',
  'spore',
  'sleep powder',
  'thunder wave',
  'encore',
  'taunt',
  'disable',
]);
const PIVOT_MOVES = new Set([
  'volt switch',
  'u-turn',
  'flip turn',
  'parting shot',
  'teleport',
]);
const PROTECT_MOVES = new Set([
  'protect',
  'detect',
  'wide guard',
  'quick guard',
  'kings shield',
  "king's shield",
  'mat block',
]);

function buildRoleExplanation(d: PokemonUsageDetail): string[] {
  const lines: string[] = [];
  const moveNames = d.moves.slice(0, 8).map((m) => m.name.toLowerCase());

  // Usage tier
  if (d.usagePercent >= 20)
    lines.push('**Meta staple** — seen on over 1 in 5 teams.');
  else if (d.usagePercent >= 10)
    lines.push('**Common pick** — solid meta presence.');
  else if (d.usagePercent >= 5)
    lines.push('**Niche pick** — appears in specific team styles.');
  else
    lines.push(
      '**Fringe option** — rarely seen; likely a counter to specific threats.',
    );

  // Role inference
  const roles: string[] = [];
  if (moveNames.includes('trick room')) roles.push('Trick Room setter');
  if (moveNames.includes('tailwind')) roles.push('Tailwind setter');
  if (moveNames.includes('fake out')) roles.push('Fake Out support');
  if (moveNames.includes('parting shot')) roles.push('Parting Shot support');
  if (moveNames.some((m) => m === 'follow me' || m === 'rage powder'))
    roles.push('Redirection support');
  if (moveNames.some((m) => PIVOT_MOVES.has(m))) roles.push('pivot');
  if (
    moveNames.some(
      (m) => PROTECT_MOVES.has(m) && m !== 'wide guard' && m !== 'quick guard',
    )
  )
    roles.push('scout/stall');
  if (moveNames.some((m) => m === 'spore' || m === 'sleep powder'))
    roles.push('sleep setter');
  if (moveNames.some((m) => m === 'helping hand'))
    roles.push('Helping Hand support');
  if (moveNames.some((m) => m === 'encore')) roles.push('Encore disruptor');

  const supportCount = moveNames.filter((m) => SUPPORT_MOVES.has(m)).length;
  if (roles.length === 0) {
    roles.push(supportCount >= 2 ? 'utility / support' : 'attacker');
  }

  lines.push(`**Roles:** ${roles.join(', ')}`);

  // Item note
  const topItem = d.items[0]?.name;
  if (topItem) {
    const note = ITEM_NOTES[topItem];
    lines.push(
      note
        ? `**Most common item:** ${topItem} — ${note}`
        : `**Most common item:** ${topItem}`,
    );
  }

  // Top teammate
  const topTm = d.teammates[0];
  if (topTm) {
    lines.push(
      `**Best partner:** ${topTm.name} (${topTm.percent.toFixed(1)}%)`,
    );
  }

  return lines;
}

@Injectable()
@MetaCommand()
export class MetaExplainCommand {
  constructor(
    private readonly metaFacade: VgcMetaFacadeService,
    private readonly cache: MetaCacheService,
  ) {}

  @UseInterceptors(MetaVgcAutocompleteInterceptor)
  @Subcommand({
    name: 'explain',
    description: "Explain a Pokémon's meta role and competitive context",
  })
  public async onExplain(
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

    const query = pokemon.toLowerCase();
    const entry = entries.find(
      (e) =>
        e.speciesName.toLowerCase() === query ||
        e.speciesId.toLowerCase() === query,
    );

    if (!entry) {
      await interaction.editReply(
        `**${pokemon}** was not found in **${reg.name}**.`,
      );
      return;
    }

    let detail: PokemonUsageDetail | null = null;
    try {
      detail = await this.cache.getOrFetch(
        `vgc:detail:${regulation}:${entry.speciesId}`,
        () => this.metaFacade.getUnifiedDetail(regulation, entry.speciesId),
      );
    } catch {
      // continue with entry-only data
    }

    if (!detail) {
      await interaction.editReply(
        `Detail data unavailable for **${entry.speciesName}** in **${reg.name}** — try \`/vgc pokemon\` instead.`,
      );
      return;
    }

    const lines = buildRoleExplanation(detail);

    const embed = new EmbedBuilder()
      .setColor(typeColor(entry.types))
      .setThumbnail(spriteUrl(entry.speciesName))
      .setTitle(`${entry.speciesName} — Role in ${reg.name}`)
      .setDescription(lines.join('\n\n'))
      .addFields(
        { name: 'Regulation', value: reg.name, inline: true },
        { name: 'Rank', value: `#${entry.rank}`, inline: true },
        {
          name: 'Usage',
          value: `${entry.usagePercent.toFixed(1)}%`,
          inline: true,
        },
      )
      .setFooter({ text: `Source: ${source}` });

    await interaction.editReply({ embeds: [embed] });
  }
}
