import { Injectable } from '@nestjs/common';
import { AutocompleteInteraction } from 'discord.js';
import { AutocompleteInterceptor } from 'necord';
import { getVoices } from '@/discord/_util/audio';

@Injectable()
export class SetVozAutocompleteInterceptor extends AutocompleteInterceptor {
  public async transformOptions(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused(true);

    if (focused.name === 'voz') {
      const choices = await getVoices();
      const focusedValue = focused.value.toString().toLowerCase();
      
      let filtered = choices.filter(choice => 
        choice.name.toLowerCase().includes(focusedValue)
      );

      if (filtered.length > 25) {
        filtered = filtered.slice(0, 25);
      }

      return interaction.respond(
        filtered.map(choice => ({ name: choice.name, value: choice.value }))
      );
    }
  }
}
