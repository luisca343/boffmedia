import { ApiProperty } from '@nestjs/swagger';

export class BattlesimTeamDto {
  @ApiProperty({ description: 'Unique team id' })
  id: string;

  @ApiProperty({ description: 'Client-generated id for idempotency' })
  clientId: string;

  @ApiProperty({ description: 'Team name' })
  name: string;

  @ApiProperty({ description: 'Battle format' })
  format: string;

  @ApiProperty({ description: 'Team in Showdown packed format' })
  packed: string;

  @ApiProperty({
    description: "Client's last update timestamp (epoch ms)",
    nullable: true,
  })
  clientUpdatedAt: number | null;

  @ApiProperty({ description: 'Server creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Server update timestamp' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Tombstone timestamp (epoch ms), null if not deleted',
    nullable: true,
  })
  deletedAt: number | null;
}
