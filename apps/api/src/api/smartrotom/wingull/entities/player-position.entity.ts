import { ApiProperty } from '@nestjs/swagger';

/**
 * Where a player is standing right now, read from the game server.
 *
 * The only server-side source of a player's coordinates. The browser has its own via the MCEF
 * bridge (`getMcUserData`), but nothing the backend can trust or reach when the page is closed —
 * which is what pricing a fare and resolving an ambiguous teleport both need.
 */
export class PlayerPosition {
  @ApiProperty({
    example: true,
    description:
      'False when the player is not on the server; coordinates are then meaningless.',
  })
  online: boolean;

  @ApiProperty({ example: 49.5, description: 'X coordinate' })
  x: number;

  @ApiProperty({ example: 70, description: 'Y coordinate' })
  y: number;

  @ApiProperty({ example: 13.2, description: 'Z coordinate' })
  z: number;

  @ApiProperty({
    example: 'minecraft:overworld',
    description: 'Dimension id the player is in',
  })
  dimension: string;
}
