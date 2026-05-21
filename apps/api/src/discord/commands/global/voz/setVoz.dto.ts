import { IntegerOption } from 'necord';

export class SetVozDto {
  @IntegerOption({
    name: 'voz',
    description: 'Voz a utilizar',
    required: true,
    autocomplete: true,
  })
  voz: number;
}
