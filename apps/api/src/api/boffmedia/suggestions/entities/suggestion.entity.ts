import { ApiProperty } from '@nestjs/swagger';

export class SuggestionEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ nullable: true, example: 42 })
  proposerUserId: number | null;

  @ApiProperty({ example: 'Torneo de verano VGC' })
  title: string;

  @ApiProperty({ example: 'Pokémon VGC' })
  gameName: string;

  @ApiProperty({ example: 'tournament' })
  type: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ nullable: true })
  additionalInfo: string | null;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  suggestedDate: string | null;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  endDate: string | null;

  @ApiProperty({ nullable: true, example: 64 })
  maxParticipants: number | null;

  @ApiProperty({ enum: ['pending', 'approved', 'rejected'] })
  status: 'pending' | 'approved' | 'rejected';

  @ApiProperty({ nullable: true })
  reviewNote: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: string;
}

export class CreateSuggestionResultEntity {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 12 })
  id: number;
}
