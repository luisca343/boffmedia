import { UserOption, IntegerOption, BooleanOption } from 'necord';
import { User } from 'discord.js';

export class FraseDto {
  @UserOption({
    name: 'usuario',
    description: 'Usuario a buscar',
    required: false,
  })
  usuario?: User;

  @IntegerOption({
    name: 'num',
    description: 'Número de la frase',
    required: false,
  })
  num?: number;

  @BooleanOption({
    name: 'global',
    description: 'Buscar en todas las frases',
    required: false,
  })
  global?: boolean;
}
