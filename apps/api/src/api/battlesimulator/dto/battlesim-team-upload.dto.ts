import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsNumber, IsOptional } from 'class-validator';

export class BattlesimTeamUploadDto {
  @ApiProperty({
    description: 'Client-generated id for idempotent uploads',
    example: 'team-123',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  clientId: string;

  @ApiProperty({
    description: 'Team name',
    example: 'VGC 2026 Flyer',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;

  @ApiProperty({
    description: 'Battle format (e.g., gen9vgc2025regulationc)',
    example: 'gen9vgc2025regulationc',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  format: string;

  @ApiProperty({
    description: 'Team in Showdown packed format',
    example: 'Pikachu|...|move1|move2|move3|move4',
  })
  @IsString()
  @IsNotEmpty()
  packed: string;

  @ApiProperty({
    description:
      "Client's last update timestamp (epoch ms) for merge conflict resolution",
    example: 1693574400000,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  clientUpdatedAt?: number;

  @ApiProperty({
    description:
      'Tombstone timestamp (epoch ms) if this is a deletion, null otherwise',
    example: 1693574400000,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  deletedAt?: number | null;
}
