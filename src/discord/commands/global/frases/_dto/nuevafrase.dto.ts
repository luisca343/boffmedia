import { UserOption, StringOption } from 'necord';
import { User } from 'discord.js';

export class NuevaFraseDto {
  @UserOption({
    name: 'usuario',
    description: 'Usuario a buscar',
    required: true,
  })
  usuario!: User;

  @StringOption({
    name: 'frase',
    description: 'Frase a añadir',
    required: true,
  })
  frase!: string;

  @StringOption({
    name: 'comentario',
    description: 'Comentario adicional',
    required: false,
  })
  comentario?: string;
}
