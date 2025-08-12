import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Locale } from '../enums/locale.enum';
import { ResourceType } from '../enums/resource-type.enum';

export class ClearCacheDto extends BaseDto {
  @ApiProperty({ 
    description: 'Specific resource type to clear',
    example: ResourceType.WEAPONS,
    required: false,
    enum: ResourceType,
    enumName: 'ResourceType'
  })
  @IsOptional()
  @IsString()
  @IsEnum(ResourceType)
  resourceType?: ResourceType;

  @ApiProperty({ 
    description: 'Language/locale to clear',
    example: Locale.SPANISH,
    required: false,
    enum: Locale,
    enumName: 'Locale'
  })
  @IsOptional()
  @IsString()
  @IsEnum(Locale)
  locale?: Locale;
}

export class WarmupCacheDto extends BaseDto {
  @ApiProperty({ 
    description: 'Language/locale to warmup',
    example: Locale.SPANISH,
    default: Locale.SPANISH,
    required: false,
    enum: Locale,
    enumName: 'Locale'
  })
  @IsOptional()
  @IsString()
  @IsEnum(Locale)
  locale?: Locale = Locale.SPANISH;
}