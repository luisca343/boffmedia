import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class GetCardsDto {
  @ApiProperty({ description: 'Expansion ID', required: false, example: 'genetic-apex' })
  @IsOptional()
  @IsString()
  expansion?: string;
}

export class GetCardDto {
  @ApiProperty({ description: 'Expansion ID', example: 'genetic-apex' })
  @IsString()
  expansion: string;

  @ApiProperty({ description: 'Card number', example: 1 })
  @IsNumber()
  @Type(() => Number)
  number: number;
}

export class CardUpdateDto {
  @ApiProperty({ description: 'Expansion ID', example: 'genetic-apex' })
  @IsString()
  expansion: string;

  @ApiProperty({ description: 'Card number', example: 1 })
  @IsNumber()
  cardNumber: number;

  @ApiProperty({ description: 'Pack ID', example: 'charizard-pack' })
  @IsString()
  packId: string;

  @ApiProperty({ description: 'Change amount (positive or negative)', example: 1 })
  @IsNumber()
  change: number;
}

export class BatchUpdateCardsDto {
  @ApiProperty({ description: 'Username', example: 'trainer123' })
  @IsString()
  username: string;

  @ApiProperty({ description: 'Array of card updates', type: [CardUpdateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CardUpdateDto)
  cardUpdates: CardUpdateDto[];
}

export class GetUserCardsDto {
  @ApiProperty({ description: 'Username', example: 'trainer123' })
  @IsString()
  username: string;
}

export class GetRecentUpdatesDto {
  @ApiProperty({ description: 'Username', example: 'trainer123' })
  @IsString()
  username: string;

  @ApiProperty({ description: 'Number of records to return', required: false, example: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @ApiProperty({ description: 'Number of records to skip', required: false, example: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  offset?: number;
}

export class GetMissingCardsDto {
  @ApiProperty({ description: 'Username', example: 'trainer123' })
  @IsString()
  username: string;

  @ApiProperty({ description: 'Expansion ID', required: false, example: 'genetic-apex' })
  @IsOptional()
  @IsString()
  expansion?: string;
}

export class GetBestPackDto {
  @ApiProperty({ description: 'Username', example: 'trainer123' })
  @IsString()
  username: string;

  @ApiProperty({ description: 'Expansion ID', required: false, example: 'genetic-apex' })
  @IsOptional()
  @IsString()
  expansion?: string;
}

export class CalculateProbabilitiesDto {
  @ApiProperty({ description: 'Expansion ID', example: 'genetic-apex' })
  @IsString()
  expansionID: string;

  @ApiProperty({ description: 'Pack ID', example: 'charizard-pack' })
  @IsString()
  packId: string;
}

export class GetBattleDataDto {
  @ApiProperty({ description: 'Battle URL from Serebii', example: 'https://www.serebii.net/tcgpocket/battles/example.shtml' })
  @IsString()
  battleUrl: string;
}

// Response DTOs
export class CardResponseDto {
  @ApiProperty({ description: 'Card expansion' })
  expansion: string;

  @ApiProperty({ description: 'Card number' })
  number: number;

  @ApiProperty({ description: 'Card name' })
  name: string;

  @ApiProperty({ description: 'Card rarity' })
  rarity: string;

  @ApiProperty({ description: 'Card type' })
  type: string;

  @ApiProperty({ description: 'Card HP', required: false })
  hp?: number;
}

export class UserCardResponseDto {
  @ApiProperty({ description: 'Card expansion' })
  expansion: string;

  @ApiProperty({ description: 'Card number' })
  cardNumber: number;

  @ApiProperty({ description: 'Number owned' })
  count: number;

  @ApiProperty({ description: 'Card name', required: false })
  cardName?: string;
}

export class CollectionStatsResponseDto {
  @ApiProperty({ description: 'Total cards in expansion/game' })
  totalCards: number;

  @ApiProperty({ description: 'Cards owned by user' })
  ownedCards: number;

  @ApiProperty({ description: 'Cards missing from collection' })
  missingCards: number;

  @ApiProperty({ description: 'Collection completion percentage' })
  completionPercentage: number;
}

export class BestPackResponseDto {
  @ApiProperty({ description: 'Recommended pack name' })
  bestPack: string;

  @ApiProperty({ description: 'Pack score' })
  score: number;

  @ApiProperty({ description: 'All pack scores' })
  allScores: { [key: string]: number };

  @ApiProperty({ description: 'Expansion (if specific expansion requested)', required: false })
  expansion?: string;
}

export class HealthCheckResponseDto {
  @ApiProperty({ description: 'Service status' })
  status: string;

  @ApiProperty({ description: 'Timestamp' })
  timestamp: string;

  @ApiProperty({ description: 'Service statistics', required: false })
  stats?: {
    totalCards: number;
    totalPacks: number;
  };

  @ApiProperty({ description: 'Error message if unhealthy', required: false })
  error?: string;
}

export class BatchUpdateResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean;

  @ApiProperty({ description: 'Operation message' })
  message: string;

  @ApiProperty({ description: 'Update results' })
  results: any[];
}