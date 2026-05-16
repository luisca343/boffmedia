import { Injectable } from '@nestjs/common';
import { AutocompleteInteraction } from 'discord.js';
import { AutocompleteInterceptor } from 'necord';
import { VgcMetaFacadeService } from '@/api/boffmedia/herramientas/pokemon/vgc/meta/meta.facade.service';

@Injectable()
export class MetaRegulationAutocompleteInterceptor extends AutocompleteInterceptor {
  constructor(private readonly metaFacade: VgcMetaFacadeService) {
    super();
  }

  public async transformOptions(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused(true);

    if (focused.name !== 'regulation') return;

    const regulations = await this.metaFacade.getRegulations();
    const query = focused.value.toString().toLowerCase();

    let filtered = regulations.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query),
    );

    if (filtered.length > 25) filtered = filtered.slice(0, 25);

    return interaction.respond(
      filtered.map((r) => ({
        name: r.vgcPastesGid ? `${r.name} (Preview)` : r.name,
        value: r.id,
      })),
    );
  }
}
