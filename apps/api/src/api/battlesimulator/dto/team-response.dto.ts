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
    description: 'User-defined tags for organizing teams',
    isArray: true,
    type: String,
  })
  tags: string[];

  @ApiProperty({ description: 'Whether the team is in the account favorites' })
  favorite: boolean;

  @ApiProperty({ description: 'Whether the team is pinned in the library' })
  pinned: boolean;

  @ApiProperty({
    description: 'Private strategy notes for this team',
    nullable: true,
    type: String,
  })
  notes: string | null;

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
