import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { GetResourceDto } from './get-resource.dto';

export enum CardType {
  POKEMON = 'pokemon',
  TRAINER = 'trainer',
  ENERGY = 'energy'
}

export enum CardRarity {
  DIAMOND1 = 'diamond1',
  DIAMOND2 = 'diamond2',
  DIAMOND3 = 'diamond3',
  DIAMOND4 = 'diamond4',
  STAR1 = 'star1',
  STAR2 = 'star2',
  STAR3 = 'star3',
  CROWN = 'crown',
  PROMO = 'promo'
}

export class GetCardsDto extends PartialType(GetResourceDto) {
  @ApiProperty({ 
    description: 'Card type filter',
    enum: CardType,
    required: false 
  })
  @IsOptional()
  @IsEnum(CardType)
  type?: CardType;

  @ApiProperty({ 
    description: 'Card rarity filter',
    enum: CardRarity,
    required: false 
  })
  @IsOptional()
  @IsEnum(CardRarity)
  rarity?: CardRarity;

  @ApiProperty({ 
    description: 'Search term for card name',
    example: 'Pikachu',
    required: false 
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class GetCardDto extends GetResourceDto {
  @ApiProperty({ 
    description: 'Card number within the expansion',
    example: 25 
  })
  @Type(() => Number)
  @IsNumber()
  number: number;
}

export class CreateCardDto extends GetResourceDto {
  @ApiProperty({ 
    description: 'Card number within the expansion',
    example: 25 
  })
  @Type(() => Number)
  @IsNumber()
  number: number;

  @ApiProperty({ 
    description: 'Card name',
    example: 'Pikachu ex' 
  })
  @IsString()
  name: string;

  @ApiProperty({ 
    description: 'Card type',
    enum: CardType 
  })
  @IsEnum(CardType)
  type: CardType;

  @ApiProperty({ 
    description: 'Card rarity',
    enum: CardRarity 
  })
  @IsEnum(CardRarity)
  rarity: CardRarity;

  @ApiProperty({ 
    description: 'HP value for Pokemon cards',
    example: 190,
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  hp?: number;

  @ApiProperty({ 
    description: 'Weakness type',
    example: 'fighting',
    required: false 
  })
  @IsOptional()
  @IsString()
  weakness?: string;

  @ApiProperty({ 
    description: 'Weakness damage value',
    example: 2,
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  weaknessValue?: number;

  @ApiProperty({ 
    description: 'Retreat cost',
    example: 1,
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  retreatCost?: number;
}