import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { BaseDto } from '@api/_utils/dto/base.dto';

export enum ExpansionType {
  MAIN = 'main',
  PROMO = 'promo'
}

export class GetExpansionsDto extends BaseDto {}

export class GetExpansionDto extends BaseDto {
  @ApiProperty({ 
    description: 'Expansion identifier',
    example: 'genetic-apex' 
  })
  @IsString()
  id: string;
}

export class CreateExpansionDto extends BaseDto {
  @ApiProperty({ 
    description: 'Expansion identifier',
    example: 'genetic-apex' 
  })
  @IsString()
  id: string;

  @ApiProperty({ 
    description: 'Expansion name',
    example: 'Genetic Apex' 
  })
  @IsString()
  name: string;

  @ApiProperty({ 
    description: 'Logo image URL',
    example: 'https://example.com/logo.png',
    required: false 
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ 
    description: 'Icon image URL',
    example: 'https://example.com/icon.png',
    required: false 
  })
  @IsOptional()
  @IsString()
  iconUrl?: string;

  @ApiProperty({ 
    description: 'Expansion type',
    enum: ExpansionType 
  })
  @IsEnum(ExpansionType)
  type: ExpansionType;

  @ApiProperty({ 
    description: 'Release date',
    example: '2024-10-30',
    required: false 
  })
  @IsOptional()
  @IsDateString()
  releaseDate?: string;
}

export class UpdateExpansionDto extends BaseDto {
  @ApiProperty({ 
    description: 'Expansion identifier',
    example: 'genetic-apex' 
  })
  @IsString()
  id: string;

  @ApiProperty({ 
    description: 'Expansion name',
    example: 'Genetic Apex',
    required: false 
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ 
    description: 'Logo image URL',
    example: 'https://example.com/logo.png',
    required: false 
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ 
    description: 'Icon image URL',
    example: 'https://example.com/icon.png',
    required: false 
  })
  @IsOptional()
  @IsString()
  iconUrl?: string;

  @ApiProperty({ 
    description: 'Expansion type',
    enum: ExpansionType,
    required: false 
  })
  @IsOptional()
  @IsEnum(ExpansionType)
  type?: ExpansionType;

  @ApiProperty({ 
    description: 'Release date',
    example: '2024-10-30',
    required: false 
  })
  @IsOptional()
  @IsDateString()
  releaseDate?: string;
}