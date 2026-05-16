import { Injectable } from '@nestjs/common';
import { AutocompleteInteraction } from 'discord.js';
import { AutocompleteInterceptor } from 'necord';
import { VgcMetaFacadeService } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/meta.facade.service';
import { MetaCacheService } from './meta-cache.service';
import {
  PokemonUsageDetail,
  PokemonUsageEntry,
} from '@/api/boffmedia/herramientas/pokemon/vgc/meta/entities/pokemon-usage.entity';

const POKEMON_FIELDS = new Set([
  'pokemon',
  'pokemon2',
  'pokemon3',
  'your',
  'vs',
  'compare',
]);

@Injectable()
export class MetaVgcAutocompleteInterceptor extends AutocompleteInterceptor {
  constructor(
    private readonly metaFacade: VgcMetaFacadeService,
    private readonly cache: MetaCacheService,
  ) {
    super();
  }

  public async transformOptions(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused(true);

    // ── Regulation autocomplete ──────────────────────────────────────────────
    if (focused.name === 'regulation') {
      const regulations = await this.metaFacade.getRegulations();
      const query = focused.value.toString().toLowerCase();
      const filtered = regulations
        .filter(
          (r) =>
            r.name.toLowerCase().includes(query) ||
            r.id.toLowerCase().includes(query),
        )
        .slice(0, 25);
      return interaction.respond(
        filtered.map((r) => ({
          name: r.vgcPastesGid ? `${r.name} (Preview)` : r.name,
          value: r.id,
        })),
      );
    }

    // ── Move autocomplete (requires regulation + pokemon to be filled) ────────
    if (focused.name === 'move') {
      const regulationId = interaction.options.getString('regulation');
      const pokemonVal = interaction.options.getString('pokemon');
      if (!regulationId || !pokemonVal) return interaction.respond([]);

      let entries: PokemonUsageEntry[];
      try {
        entries = await this.cache.getOrFetch(
          `vgc:usage-entries:${regulationId}`,
          () => this.metaFacade.getUnifiedUsageList(regulationId),
        );
      } catch {
        return interaction.respond([]);
      }

      const q = pokemonVal.toLowerCase();
      const entry = entries.find(
        (e) => e.speciesId === pokemonVal || e.speciesName.toLowerCase() === q,
      );
      if (!entry) return interaction.respond([]);

      let detail: PokemonUsageDetail;
      try {
        detail = await this.cache.getOrFetch(
          `vgc:detail:${regulationId}:${entry.speciesId}`,
          () => this.metaFacade.getUnifiedDetail(regulationId, entry.speciesId),
        );
      } catch {
        return interaction.respond([]);
      }

      const moveQuery = focused.value.toString().toLowerCase();
      const moves = (detail.moves ?? []).filter((m) =>
        m.name.toLowerCase().includes(moveQuery),
      );

      return interaction.respond(
        moves.slice(0, 25).map((m) => ({
          name: `${m.name} (${m.percent.toFixed(1)}%)`,
          value: m.name,
        })),
      );
    }

    // ── Pokémon autocomplete ─────────────────────────────────────────────────
    if (POKEMON_FIELDS.has(focused.name)) {
      const regulationId = interaction.options.getString('regulation');
      if (!regulationId) return interaction.respond([]);

      const query = focused.value.toString().toLowerCase();

      let entries: PokemonUsageEntry[];
      try {
        entries = await this.cache.getOrFetch(
          `vgc:usage-entries:${regulationId}`,
          () => this.metaFacade.getUnifiedUsageList(regulationId),
        );
      } catch {
        return interaction.respond([]);
      }

      const filtered = entries.filter(
        (e) =>
          e.speciesName.toLowerCase().includes(query) ||
          e.speciesId.toLowerCase().includes(query),
      );

      filtered.sort((a, b) => {
        const prefixA = a.speciesName.toLowerCase().startsWith(query) ? 1 : 0;
        const prefixB = b.speciesName.toLowerCase().startsWith(query) ? 1 : 0;
        return prefixB - prefixA || b.usagePercent - a.usagePercent;
      });

      return interaction.respond(
        filtered.slice(0, 25).map((e) => ({
          name: `${e.speciesName} (${e.usagePercent.toFixed(1)}%)`,
          value: e.speciesId,
        })),
      );
    }
  }
}
