import { ApiProperty } from '@nestjs/swagger';

export class PlotOwner {
  @ApiProperty({
    example: 'a1b2c3d4-...',
    description: 'Minecraft UUID of the owner',
  })
  uuid: string;

  @ApiProperty({
    example: 'Luisca343',
    description: 'Minecraft username of the owner',
  })
  username: string;
}

export class PlotEntry {
  @ApiProperty({ example: 'pueblo_mizu', description: 'Town identifier' })
  town: string;

  @ApiProperty({
    example: 'parcela',
    description: 'Region type (parcela, negocio, etc.)',
  })
  type: string;

  @ApiProperty({
    example: 3,
    description: 'Plot number within the town and type',
    required: false,
  })
  number?: number;

  @ApiProperty({
    type: PlotOwner,
    nullable: true,
    description: 'Owner info resolved from rotom_users, null if unclaimed',
  })
  owner: PlotOwner | null;

  @ApiProperty({
    example: -1240,
    description:
      'Center X coordinate of the plot (from worldguard_region_cuboid)',
    required: false,
  })
  centerX?: number;

  @ApiProperty({
    example: 320,
    description:
      'Center Z coordinate of the plot (from worldguard_region_cuboid)',
    required: false,
  })
  centerZ?: number;
}
