import { ApiProperty } from '@nestjs/swagger';

export class PokemonImage {
  @ApiProperty({
    description: 'Image URL',
    example: '/smartrotom/img/sprites/Front/PIKACHU.png',
  })
  url: string;

  @ApiProperty({
    description: 'Image type',
    example: 'image',
    enum: ['image', 'sprite'],
  })
  type: string;

  @ApiProperty({
    description: 'Pokémon status (0=unseen, 1=seen, 2=caught)',
    example: 2,
    enum: [0, 1, 2],
  })
  status: number;

  @ApiProperty({
    description: 'Whether to show the image',
    example: true,
  })
  showImg: boolean;
}

export class ItemSprite {
  @ApiProperty({
    description: 'Item sprite URL',
    example: '\\smartrotom\\img\\sprites\\items\\POKEBALL.png',
  })
  url: string;
}
