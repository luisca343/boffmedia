import { ApiProperty } from '@nestjs/swagger';

export class NpcCatalogEntry {
  @ApiProperty({
    description: 'Player UUID associated with this NPC interaction',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  uuid: string;
}
