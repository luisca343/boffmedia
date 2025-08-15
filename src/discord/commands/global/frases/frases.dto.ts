import { UserOption, IntegerOption } from 'necord';
import { User } from 'discord.js';

export class FrasesDto {
  @UserOption({
    name: 'usuario',
    description: 'Usuario a buscar',
    required: false,
  })
  usuario?: User;

  @IntegerOption({
    name: 'page',
    description: 'Página a mostrar',
    required: false,
  })
  page?: number;
}
