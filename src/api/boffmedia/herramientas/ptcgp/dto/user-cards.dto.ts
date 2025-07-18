import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { GetResourceDto } from './get-resource.dto';

export class CardUpdateDto {
  @ApiProperty({ 
    description: 'Expansion identifier',
    example: 'genetic-apex' 
  })
  @IsString()
  expansion: string;

  @ApiProperty({ 
    description: 'Card number within the expansion',
    example: 25 
  })
  @Type(() => Number)
  @IsNumber()
  cardNumber: number;

  @ApiProperty({ 
    description: 'Pack where the card was obtained',
    example: 'charizard' 
  })
  @IsString()
  packId: string;

  @ApiProperty({ 
    description: 'Change in card count (positive for additions, negative for removals)',
    example: 1 
  })
  @Type(() => Number)
  @IsNumber()
  change: number;
}

export class GetUserCardsDto {
  @ApiProperty({ 
    description: 'Username to get cards for',
    example: 'trainer123' 
  })
  @IsString()
  username: string;

  @ApiProperty({ 
    description: 'Filter by specific expansion',
    example: 'genetic-apex',
    required: false 
  })
  @IsOptional()
  @IsString()
  expansion?: string;
}

export class BatchUpdateCardsDto {
  @ApiProperty({ 
    description: 'Username to update cards for',
    example: 'trainer123' 
  })
  @IsString()
  username: string;

  @ApiProperty({ 
    description: 'Array of card updates to apply',
    type: [CardUpdateDto] 
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CardUpdateDto)
  cardUpdates: CardUpdateDto[];
}

export class GetRecentUpdatesDto {
  @ApiProperty({ 
    description: 'Username to get updates for',
    example: 'trainer123' 
  })
  @IsString()
  username: string;

  @ApiProperty({ 
    description: 'Number of updates to return',
    example: 10,
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiProperty({ 
    description: 'Number of updates to skip',
    example: 0,
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  offset?: number;
}

export class GetMissingCardsDto extends PartialType(GetUserCardsDto) {}

export class GetCollectionStatsDto extends PartialType(GetUserCardsDto) {}